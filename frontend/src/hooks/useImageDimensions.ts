import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Image dimension data with loading state
 */
export interface ImageDimension {
  width: number;
  height: number;
  aspectRatio: number;
  isLoaded: boolean;
  error?: string;
}

/**
 * Result of batch image dimension loading
 */
export interface ImageDimensionsResult {
  dimensions: Map<string, ImageDimension>;
  loadingProgress: number; // 0-100
  isAllLoaded: boolean;
  errors: string[];
  totalImages: number;
  loadedImages: number;
  retryFailedImages: () => void;
}

/**
 * Configuration for image dimension loading
 */
export interface ImageDimensionConfig {
  timeout: number; // Timeout for each image load in milliseconds
  retryAttempts: number; // Number of retry attempts for failed images
  batchSize: number; // Number of images to load concurrently
  cacheDuration: number; // Cache duration in milliseconds
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ImageDimensionConfig = {
  timeout: 10000, // 10 seconds
  retryAttempts: 2,
  batchSize: 6, // Load 6 images at a time
  cacheDuration: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Cache for image dimensions to avoid repeated loading
 */
const dimensionCache = new Map<string, { dimension: ImageDimension; timestamp: number }>();

/**
 * Clear expired cache entries
 */
function clearExpiredCache(maxAge: number) {
  const now = Date.now();
  for (const [key, value] of dimensionCache.entries()) {
    if (now - value.timestamp > maxAge) {
      dimensionCache.delete(key);
    }
  }
}

/**
 * Load image dimensions with timeout and retry support
 */
function loadImageDimensions(
  src: string, 
  timeout: number = DEFAULT_CONFIG.timeout
): Promise<ImageDimension> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let isResolved = false;

    const handleLoad = () => {
      if (isResolved) return;
      isResolved = true;
      
      const dimension: ImageDimension = {
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
        isLoaded: true,
      };
      
      resolve(dimension);
    };

    const handleError = () => {
      if (isResolved) return;
      isResolved = true;
      
      const error = `Failed to load image: ${src}`;
      reject(new Error(error));
    };

    const handleTimeout = () => {
      if (isResolved) return;
      isResolved = true;
      
      const error = `Timeout loading image: ${src}`;
      reject(new Error(error));
    };

    img.onload = handleLoad;
    img.onerror = handleError;
    
    // Set timeout
    const timeoutId = setTimeout(handleTimeout, timeout);
    
    // Clean up timeout on resolution
    const originalResolve = resolve;
    const originalReject = reject;
    
    resolve = (value) => {
      clearTimeout(timeoutId);
      originalResolve(value);
    };
    
    reject = (reason) => {
      clearTimeout(timeoutId);
      originalReject(reason);
    };

    img.src = src;
  });
}

/**
 * Custom hook for batch loading image dimensions with progress tracking
 * Supports caching, retry logic, and concurrent loading control
 * 
 * @param imageUrls - Array of image URLs to load dimensions for
 * @param config - Configuration options
 * @returns ImageDimensionsResult with dimensions map and loading state
 */
export function useImageDimensions(
  imageUrls: string[],
  config: Partial<ImageDimensionConfig> = {}
): ImageDimensionsResult {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const [dimensions, setDimensions] = useState<Map<string, ImageDimension>>(new Map());
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  
  const loadingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // **FIX: Better array comparison without sorting original array**
  const imageUrlsRef = useRef<string[]>([]);
  const [urlsHash, setUrlsHash] = useState<string>('');
  
  // Compare arrays by content, not reference
  const currentUrlsHash = JSON.stringify([...imageUrls].sort());
  if (currentUrlsHash !== urlsHash) {
    imageUrlsRef.current = imageUrls;
    setUrlsHash(currentUrlsHash);
  }

  /**
   * Load dimensions for a batch of images with concurrency control
   */
  const loadBatch = useCallback(async (urls: string[], startIndex: number = 0) => {
    const batch = urls.slice(startIndex, startIndex + mergedConfig.batchSize);
    if (batch.length === 0) return;

    const batchPromises = batch.map(async (url) => {
      try {
        // Check cache first
        const cached = dimensionCache.get(url);
        if (cached && Date.now() - cached.timestamp < mergedConfig.cacheDuration) {
          return { url, dimension: cached.dimension, fromCache: true };
        }

        const dimension = await loadImageDimensions(url, mergedConfig.timeout);
        
        // Cache the result
        dimensionCache.set(url, { dimension, timestamp: Date.now() });
        
        return { url, dimension, fromCache: false };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : `Failed to load ${url}`;
        return { url, error: errorMsg };
      }
    });

    const results = await Promise.allSettled(batchPromises);
    
    setDimensions(prev => {
      const newDimensions = new Map(prev);
      
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.dimension) {
          newDimensions.set(result.value.url, result.value.dimension);
        } else if (result.status === 'fulfilled' && result.value.error) {
          // Set error state for failed images
          newDimensions.set(result.value.url, {
            width: 0,
            height: 0,
            aspectRatio: 1,
            isLoaded: false,
            error: result.value.error,
          });
        }
      });
      
      return newDimensions;
    });

    // Update progress
    const loadedCount = Math.min(startIndex + batch.length, urls.length);
    const progress = urls.length > 0 ? (loadedCount / urls.length) * 100 : 100;
    setLoadingProgress(progress);

    // Load next batch if there are more URLs
    if (startIndex + batch.length < urls.length) {
      // Small delay to prevent overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 50));
      await loadBatch(urls, startIndex + batch.length);
    }
  }, [mergedConfig.batchSize, mergedConfig.timeout, mergedConfig.cacheDuration]);

  /**
   * Start loading all images
   */
  const loadAllImages = useCallback(async () => {
    const currentUrls = imageUrlsRef.current;
    if (loadingRef.current || currentUrls.length === 0) return;
    
    loadingRef.current = true;
    abortControllerRef.current = new AbortController();
    
    try {
      // Clear expired cache entries
      clearExpiredCache(mergedConfig.cacheDuration);
      
      // Reset state
      setLoadingProgress(0);
      
      // Filter out empty URLs
      const validUrls = currentUrls.filter(url => url && url.trim() !== '');
      
      if (validUrls.length === 0) {
        setLoadingProgress(100);
        return;
      }

      await loadBatch(validUrls);
      
    } catch (error) {
      console.error('Error loading image dimensions:', error);
    } finally {
      loadingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [loadBatch, mergedConfig.cacheDuration]);

  /**
   * Retry failed images
   */
  const retryFailedImages = useCallback(() => {
    const failedUrls = Array.from(dimensions.entries())
      .filter(([, dim]) => dim.error && !dim.isLoaded)
      .map(([url]) => url);
    
    if (failedUrls.length > 0) {
      setRetryCount(prev => prev + 1);
      
      // Clear failed entries from state
      setDimensions(prev => {
        const newDimensions = new Map(prev);
        failedUrls.forEach(url => newDimensions.delete(url));
        return newDimensions;
      });
      
      // Clear from cache as well
      failedUrls.forEach(url => dimensionCache.delete(url));
      
      // Restart loading
      loadingRef.current = false;
      loadAllImages();
    }
  }, [dimensions, loadAllImages]);

  // **FIX: Use responsive state instead of ref**
  useEffect(() => {
    loadAllImages();
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      loadingRef.current = false;
    };
  }, [loadAllImages, retryCount, urlsHash]); // Use state instead of ref

  // Calculate derived state using the current URLs
  const currentUrls = imageUrlsRef.current;
  const totalImages = currentUrls.length;
  const loadedImages = Array.from(dimensions.values()).filter(dim => dim.isLoaded).length;
  const isAllLoaded = totalImages > 0 && loadedImages === totalImages;
  const currentErrors = Array.from(dimensions.values())
    .filter(dim => dim.error)
    .map(dim => dim.error!)
    .filter((error, index, array) => array.indexOf(error) === index); // Remove duplicates

  return {
    dimensions,
    loadingProgress,
    isAllLoaded,
    errors: currentErrors,
    totalImages,
    loadedImages,
    retryFailedImages,
  };
}

/**
 * Utility hook for single image dimension loading
 */
export function useImageDimension(imageUrl: string): ImageDimension | null {
  const { dimensions } = useImageDimensions([imageUrl]);
  return dimensions.get(imageUrl) || null;
}

/**
 * Utility function to create a dimensions getter for common use cases
 */
export function createDimensionsGetter<T>(
  getDimensions: (item: T) => { width: number; height: number } | null,
  isLoaded: (item: T) => boolean = () => true
) {
  return (item: T) => {
    const dimensions = getDimensions(item);
    if (!dimensions) return null;
    
    return {
      ...dimensions,
      isLoaded: isLoaded(item),
    };
  };
} 