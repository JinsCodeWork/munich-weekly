import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// **NEW: Import submission types for optimization**
import { Submission, hasStoredDimensions, getSubmissionDimensions } from '@/types/submission';

import { clearExpiredCache, dimensionCache, loadImageDimensions } from './cache';
import { DEFAULT_CONFIG, type ImageDimension, type ImageDimensionConfig, type ImageDimensionsResult } from './types';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
