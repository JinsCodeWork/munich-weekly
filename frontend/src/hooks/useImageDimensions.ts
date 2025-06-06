import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// **NEW: Import submission types for optimization**
import { Submission, hasStoredDimensions, getSubmissionDimensions } from '@/types/submission';

/**
 * Image dimension data with loading state
 */
export interface ImageDimension {
  width: number;
  height: number;
  aspectRatio: number;
  isLoaded: boolean;
  error?: string;
  fromStored?: boolean; // **NEW: Indicates if dimensions came from stored backend data**
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
  // Progressive loading support
  isProgressiveReady: boolean; // True when progressive threshold is reached
  progressiveLoadedCount: number; // Number of images loaded for progressive display
  // **NEW: Optimization metrics**
  storedDimensionsCount: number; // Number of dimensions loaded from stored data
  dynamicFetchCount: number; // Number of dimensions fetched dynamically
}

/**
 * Configuration for image dimension loading
 */
export interface ImageDimensionConfig {
  timeout: number; // Timeout for each image load in milliseconds
  retryAttempts: number; // Number of retry attempts for failed images
  batchSize: number; // Number of images to load concurrently
  cacheDuration: number; // Cache duration in milliseconds
  // Progressive loading configuration
  progressiveThreshold?: number; // Number of images to load before enabling progressive display
  enableProgressiveLoading?: boolean; // Enable progressive loading feature
  // **NEW: Optimization configuration**
  preferStoredDimensions?: boolean; // Prefer stored dimensions from backend over dynamic fetching
}

/**
 * Default configuration optimized for mobile performance
 */
const DEFAULT_CONFIG: ImageDimensionConfig = {
  timeout: 6000, // Reduced from 10s to 6s for faster mobile experience
  retryAttempts: 2,
  batchSize: 4, // Reduced from 6 to 4 for mobile optimization
  cacheDuration: 24 * 60 * 60 * 1000, // 24 hours
  progressiveThreshold: 6, // Start progressive display after 6 images
  enableProgressiveLoading: true,
  preferStoredDimensions: true, // **NEW: Default to preferring stored dimensions**
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
        fromStored: false, // **NEW: Mark as dynamically fetched**
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
 * **NEW: Optimized hook for submissions with backend dimension support**
 * Uses stored dimensions when available, falls back to dynamic fetching for legacy data
 * 
 * @param submissions - Array of submission objects that may contain stored dimensions
 * @param config - Configuration options including progressive loading
 * @returns ImageDimensionsResult with optimized dimension loading
 */
export function useSubmissionDimensions(
  submissions: Submission[],
  config: Partial<ImageDimensionConfig> = {}
): ImageDimensionsResult {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const [dimensions, setDimensions] = useState<Map<string, ImageDimension>>(new Map());
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [storedCount, setStoredCount] = useState(0);
  const [dynamicCount, setDynamicCount] = useState(0);
  
  const loadingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Progressive loading state
  const [progressiveLoadedCount, setProgressiveLoadedCount] = useState(0);
  
  // Extract image URLs and stored dimensions
  const submissionData = useMemo(() => {
    return submissions.map(submission => ({
      url: submission.imageUrl,
      storedDimensions: getSubmissionDimensions(submission),
      hasStored: hasStoredDimensions(submission)
    }));
  }, [submissions]);
  
  // Track data changes
  const [dataHash, setDataHash] = useState<string>('');
  const dataRef = useRef<typeof submissionData>([]);
  
  // Compare data by content
  const currentDataHash = JSON.stringify(submissionData);
  if (currentDataHash !== dataHash) {
    dataRef.current = submissionData;
    setDataHash(currentDataHash);
    // Reset progressive counter when data changes
    setProgressiveLoadedCount(0);
    setStoredCount(0);
    setDynamicCount(0);
  }

  /**
   * **OPTIMIZATION: Process stored dimensions immediately, then dynamic fetch remaining**
   */
  const processSubmissionDimensions = useCallback(async () => {
    const currentData = dataRef.current;
    if (loadingRef.current || currentData.length === 0) return;
    
    loadingRef.current = true;
    abortControllerRef.current = new AbortController();
    
    try {
      // Clear expired cache entries
      clearExpiredCache(mergedConfig.cacheDuration);
      
      // Reset state
      setLoadingProgress(0);
      setProgressiveLoadedCount(0);
      setStoredCount(0);
      setDynamicCount(0);
      
      const newDimensions = new Map<string, ImageDimension>();
      let storedDimensionsCount = 0;
      let progressiveCount = 0;
      const urlsNeedingDynamicFetch: string[] = [];
      
      // **PHASE 1: Process stored dimensions (instant)**
      for (const item of currentData) {
        if (item.hasStored && item.storedDimensions && mergedConfig.preferStoredDimensions) {
          const dimension: ImageDimension = {
            width: item.storedDimensions.width,
            height: item.storedDimensions.height,
            aspectRatio: item.storedDimensions.aspectRatio,
            isLoaded: true,
            fromStored: true, // **NEW: Mark as from stored data**
          };
          
          newDimensions.set(item.url, dimension);
          storedDimensionsCount++;
          progressiveCount++;
          
          // Cache stored dimensions
          dimensionCache.set(item.url, { dimension, timestamp: Date.now() });
        } else if (item.url && item.url.trim() !== '') {
          urlsNeedingDynamicFetch.push(item.url);
        }
      }
      
      // Update state with stored dimensions
      setDimensions(newDimensions);
      setStoredCount(storedDimensionsCount);
      setProgressiveLoadedCount(progressiveCount);
      
      // Calculate initial progress
      const totalUrls = currentData.length;
      const initialProgress = totalUrls > 0 ? (storedDimensionsCount / totalUrls) * 100 : 100;
      setLoadingProgress(initialProgress);
      
      console.log(`📊 Dimension Optimization: ${storedDimensionsCount} stored, ${urlsNeedingDynamicFetch.length} dynamic, ${((storedDimensionsCount / totalUrls) * 100).toFixed(1)}% optimized`);
      
      // **PHASE 2: Dynamic fetch for remaining URLs (if any)**
      if (urlsNeedingDynamicFetch.length > 0) {
        await loadBatchUrls(urlsNeedingDynamicFetch, newDimensions, progressiveCount, storedDimensionsCount, totalUrls);
      }
      
    } catch (error) {
      console.error('Error processing submission dimensions:', error);
    } finally {
      loadingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [mergedConfig.cacheDuration, mergedConfig.preferStoredDimensions]);

  /**
   * Load dimensions for URLs that need dynamic fetching
   */
  const loadBatchUrls = useCallback(async (
    urls: string[], 
    existingDimensions: Map<string, ImageDimension>,
    initialProgressiveCount: number,
    initialStoredCount: number,
    totalItems: number
  ) => {
    let currentProgressiveCount = initialProgressiveCount;
    let currentDynamicCount = 0;
    
    for (let i = 0; i < urls.length; i += mergedConfig.batchSize) {
      const batch = urls.slice(i, i + mergedConfig.batchSize);
      
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
        let newlyLoadedCount = 0;
        
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.dimension) {
            const wasNew = !newDimensions.has(result.value.url);
            newDimensions.set(result.value.url, result.value.dimension);
            if (wasNew) {
              newlyLoadedCount++;
              currentDynamicCount++;
            }
          } else if (result.status === 'fulfilled' && result.value.error) {
            // Set error state for failed images
            newDimensions.set(result.value.url, {
              width: 0,
              height: 0,
              aspectRatio: 1,
              isLoaded: false,
              error: result.value.error,
              fromStored: false,
            });
          }
        });
        
        // Update progressive counter
        if (newlyLoadedCount > 0) {
          currentProgressiveCount += newlyLoadedCount;
          setProgressiveLoadedCount(currentProgressiveCount);
        }
        
        return newDimensions;
      });

      // Update progress based on total processed items
      const processedCount = initialStoredCount + Math.min(i + batch.length, urls.length);
      const progress = totalItems > 0 ? (processedCount / totalItems) * 100 : 100;
      setLoadingProgress(progress);
      
      // Update dynamic count
      setDynamicCount(currentDynamicCount);

      // Add delay between batches for mobile optimization
      if (i + batch.length < urls.length) {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const delay = isMobile ? 300 : 100;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }, [mergedConfig.batchSize, mergedConfig.timeout, mergedConfig.cacheDuration]);

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
      
      // Reset progressive counter
      setProgressiveLoadedCount(0);
      setStoredCount(0);
      setDynamicCount(0);
      
      // Restart processing
      loadingRef.current = false;
      processSubmissionDimensions();
    }
  }, [dimensions, processSubmissionDimensions]);

  // Process submissions when data changes
  useEffect(() => {
    processSubmissionDimensions();
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      loadingRef.current = false;
    };
  }, [processSubmissionDimensions, retryCount, dataHash]);

  // Calculate derived state
  const currentData = dataRef.current;
  const totalImages = currentData.length;
  const loadedImages = Array.from(dimensions.values()).filter(dim => dim.isLoaded).length;
  const isAllLoaded = totalImages > 0 && loadedImages === totalImages;
  const currentErrors = Array.from(dimensions.values())
    .filter(dim => dim.error)
    .map(dim => dim.error!)
    .filter((error, index, array) => array.indexOf(error) === index); // Remove duplicates

  // Progressive loading calculations
  const progressiveThreshold = mergedConfig.progressiveThreshold || DEFAULT_CONFIG.progressiveThreshold!;
  const enableProgressive = mergedConfig.enableProgressiveLoading ?? DEFAULT_CONFIG.enableProgressiveLoading ?? true;
  const isProgressiveReady = enableProgressive && 
    progressiveLoadedCount >= Math.min(progressiveThreshold, totalImages);

  return {
    dimensions,
    loadingProgress,
    isAllLoaded,
    errors: currentErrors,
    totalImages,
    loadedImages,
    retryFailedImages,
    // Progressive loading results
    isProgressiveReady,
    progressiveLoadedCount,
    // **NEW: Optimization metrics**
    storedDimensionsCount: storedCount,
    dynamicFetchCount: dynamicCount,
  };
}

// **EXISTING: Legacy hook maintained for backward compatibility**
/**
 * Custom hook for batch loading image dimensions with progressive loading support
 * Supports caching, retry logic, concurrent loading control, and progressive display
 * 
 * @param imageUrls - Array of image URLs to load dimensions for
 * @param config - Configuration options including progressive loading
 * @returns ImageDimensionsResult with dimensions map, loading state, and progressive indicators
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
  
  // Progressive loading state
  const [progressiveLoadedCount, setProgressiveLoadedCount] = useState(0);
  
  // **FIX: Better array comparison without sorting original array**
  const imageUrlsRef = useRef<string[]>([]);
  const [urlsHash, setUrlsHash] = useState<string>('');
  
  // Compare arrays by content, not reference
  const currentUrlsHash = JSON.stringify([...imageUrls].sort());
  if (currentUrlsHash !== urlsHash) {
    imageUrlsRef.current = imageUrls;
    setUrlsHash(currentUrlsHash);
    // Reset progressive counter when URLs change
    setProgressiveLoadedCount(0);
  }

  /**
   * Load dimensions for a batch of images with concurrency control and progressive updates
   */
  const loadBatch = useCallback(async (urls: string[], startIndex: number = 0) => {
    const batch = urls.slice(startIndex, startIndex + mergedConfig.batchSize);
    if (batch.length === 0) return;

    // **FIX: Mobile-specific optimizations for connection stability**
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const isFirstBatch = startIndex === 0;
    
    // Reduce concurrency for mobile, especially for first batch
    let effectiveBatch = batch;
    if (isMobile && isFirstBatch) {
      // For mobile first batch, load only 2 images at once to prevent connection saturation
      effectiveBatch = batch.slice(0, 2);
    }

    const batchPromises = effectiveBatch.map(async (url) => {
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
      let newlyLoadedCount = 0;
      
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.dimension) {
          const wasNew = !newDimensions.has(result.value.url);
          newDimensions.set(result.value.url, result.value.dimension);
          if (wasNew) newlyLoadedCount++;
        } else if (result.status === 'fulfilled' && result.value.error) {
          // Set error state for failed images
          newDimensions.set(result.value.url, {
            width: 0,
            height: 0,
            aspectRatio: 1,
            isLoaded: false,
            error: result.value.error,
            fromStored: false, // **NEW: Legacy method is never from stored**
          });
        }
      });
      
      // Update progressive counter
      if (newlyLoadedCount > 0) {
        setProgressiveLoadedCount(prev => prev + newlyLoadedCount);
      }
      
      return newDimensions;
    });

    // Update progress based on actual processed batch size
    const loadedCount = Math.min(startIndex + effectiveBatch.length, urls.length);
    const progress = urls.length > 0 ? (loadedCount / urls.length) * 100 : 100;
    setLoadingProgress(progress);

    // **FIX: Handle remaining images from reduced first batch**
    const nextStartIndex = startIndex + effectiveBatch.length;
    
    // If we reduced the first batch on mobile, process the remaining images from the first batch
    if (isMobile && isFirstBatch && effectiveBatch.length < batch.length) {
      const remainingFirstBatch = batch.slice(effectiveBatch.length);
      
      // Small delay before processing remaining first batch images
      await new Promise(resolve => setTimeout(resolve, 200));
      await loadBatch([...remainingFirstBatch, ...urls.slice(startIndex + batch.length)], 0);
      return;
    }

    // Load next batch if there are more URLs
    if (nextStartIndex < urls.length) {
      // **FIX: Longer delay for mobile to prevent connection saturation**
      const delay = isMobile ? 300 : 100; // Longer delay for mobile
      await new Promise(resolve => setTimeout(resolve, delay));
      await loadBatch(urls, nextStartIndex);
    }
  }, [mergedConfig.batchSize, mergedConfig.timeout, mergedConfig.cacheDuration]);

  /**
   * Start loading all images with progressive support
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
      setProgressiveLoadedCount(0);
      
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
      
      // Reset progressive counter
      setProgressiveLoadedCount(0);
      
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

  // Progressive loading calculations
  const progressiveThreshold = mergedConfig.progressiveThreshold || DEFAULT_CONFIG.progressiveThreshold!;
  const enableProgressive = mergedConfig.enableProgressiveLoading ?? DEFAULT_CONFIG.enableProgressiveLoading ?? true;
  const isProgressiveReady = enableProgressive && 
    progressiveLoadedCount >= Math.min(progressiveThreshold, totalImages);

  return {
    dimensions,
    loadingProgress,
    isAllLoaded,
    errors: currentErrors,
    totalImages,
    loadedImages,
    retryFailedImages,
    // Progressive loading results
    isProgressiveReady,
    progressiveLoadedCount,
    // **NEW: Legacy method has no stored dimensions**
    storedDimensionsCount: 0,
    dynamicFetchCount: loadedImages,
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
      fromStored: false, // **NEW: Manual dimensions are not from stored data**
    };
  };
} 