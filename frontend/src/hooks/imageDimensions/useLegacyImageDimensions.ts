import { useState, useEffect, useCallback, useRef } from 'react';

import { clearExpiredCache, dimensionCache, loadImageDimensions } from './cache';
import { DEFAULT_CONFIG, type ImageDimension, type ImageDimensionConfig, type ImageDimensionsResult } from './types';

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
