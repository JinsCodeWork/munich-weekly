import { DEFAULT_CONFIG, type ImageDimension } from './types';

/**
 * Cache for image dimensions to avoid repeated loading
 */
export const dimensionCache = new Map<string, { dimension: ImageDimension; timestamp: number }>();

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(maxAge: number) {
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
export function loadImageDimensions(
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
