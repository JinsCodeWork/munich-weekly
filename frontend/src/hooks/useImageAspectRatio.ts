/**
 * Custom hook for detecting image aspect ratios
 * Determines if images should be displayed as wide images (≥16:9 ratio)
 */

import { useState, useCallback } from 'react';
import { isWideImage, WIDE_IMAGE_THRESHOLD } from '@/styles/components/masonry';

export interface ImageAspectRatioData {
  aspectRatio: number | null;
  isWide: boolean;
  isLoaded: boolean;
  width: number | null;
  height: number | null;
}

export interface UseImageAspectRatioReturn {
  imageData: ImageAspectRatioData;
  handleImageLoad: (width: number, height: number) => void;
  resetImageData: () => void;
}

/**
 * Hook to track image aspect ratio and wide image detection
 * 
 * @returns Object containing image data and handlers
 * 
 * @example
 * ```tsx
 * const { imageData, handleImageLoad } = useImageAspectRatio();
 * 
 * // In your image component:
 * const onImageLoad = (img: HTMLImageElement) => {
 *   handleImageLoad(img.naturalWidth, img.naturalHeight);
 * };
 * 
 * // Use the data:
 * const shouldSpanColumns = imageData.isWide;
 * ```
 */
export function useImageAspectRatio(): UseImageAspectRatioReturn {
  const [imageData, setImageData] = useState<ImageAspectRatioData>({
    aspectRatio: null,
    isWide: false,
    isLoaded: false,
    width: null,
    height: null,
  });

  /**
   * Handle image load completion and calculate aspect ratio
   * @param width - Natural width of the loaded image
   * @param height - Natural height of the loaded image
   */
  const handleImageLoad = useCallback((width: number, height: number) => {
    if (!width || !height || width <= 0 || height <= 0) {
      console.warn('useImageAspectRatio: Invalid image dimensions', { width, height });
      return;
    }

    const aspectRatio = width / height;
    const isWideResult = isWideImage(aspectRatio);

    setImageData({
      aspectRatio,
      isWide: isWideResult,
      isLoaded: true,
      width,
      height,
    });

    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Image aspect ratio detected:', {
        dimensions: `${width}x${height}`,
        aspectRatio: aspectRatio.toFixed(3),
        threshold: WIDE_IMAGE_THRESHOLD.toFixed(3),
        isWide: isWideResult,
        classification: isWideResult ? 'Wide Image (≥16:9)' : 'Normal Image (<16:9)',
      });
    }
  }, []);

  /**
   * Reset image data state
   * Useful when component unmounts or image source changes
   */
  const resetImageData = useCallback(() => {
    setImageData({
      aspectRatio: null,
      isWide: false,
      isLoaded: false,
      width: null,
      height: null,
    });
  }, []);

  return {
    imageData,
    handleImageLoad,
    resetImageData,
  };
}

/**
 * Utility hook for simple wide image detection
 * Returns only the isWide boolean for simpler use cases
 * 
 * @returns Object with isWide boolean and image load handler
 * 
 * @example
 * ```tsx
 * const { isWide, onImageLoad } = useWideImageDetection();
 * ```
 */
export function useWideImageDetection() {
  const { imageData, handleImageLoad } = useImageAspectRatio();

  const onImageLoad = useCallback((width: number, height: number) => {
    handleImageLoad(width, height);
  }, [handleImageLoad]);

  return {
    isWide: imageData.isWide,
    isLoaded: imageData.isLoaded,
    onImageLoad,
  };
}

/**
 * Helper function to extract image dimensions from various sources
 * Supports HTMLImageElement, Next.js Image onLoadingComplete, etc.
 * 
 * @param source - Image element or dimension object
 * @returns Object with width and height, or null if invalid
 */
export function extractImageDimensions(
  source: HTMLImageElement | { naturalWidth: number; naturalHeight: number } | { width: number; height: number }
): { width: number; height: number } | null {
  try {
    // Handle HTMLImageElement
    if ('naturalWidth' in source && 'naturalHeight' in source) {
      return {
        width: source.naturalWidth,
        height: source.naturalHeight,
      };
    }

    // Handle dimension objects
    if ('width' in source && 'height' in source) {
      return {
        width: source.width,
        height: source.height,
      };
    }

    return null;
  } catch (error) {
    console.warn('Failed to extract image dimensions:', error);
    return null;
  }
} 