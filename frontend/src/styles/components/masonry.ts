/**
 * Masonry Layout Component Styles
 * Uses CSS Grid with dense packing for optimal masonry layout with true column spanning
 */

import { cn } from '@/lib/utils';

/**
 * Breakpoint configuration for responsive masonry layout
 */
export const masonryBreakpoints = {
  mobile: {
    maxWidth: 'max-width: 639px',
    columns: 2,
  },
  desktop: {
    minWidth: 'min-width: 1024px', 
    columns: 4,
  },
} as const;

/**
 * Wide image detection threshold
 * Images with aspect ratio >= 16:9 (1.78) are considered wide
 */
export const WIDE_IMAGE_THRESHOLD = 16 / 9; // 1.778

/**
 * Get masonry container styles using CSS Grid with auto-placement
 */
export function getMasonryContainerStyles({
  gap = 4,
  className,
}: {
  gap?: number;
  className?: string;
} = {}) {
  return cn(
    // CSS Grid masonry layout
    'grid',
    'grid-cols-2 lg:grid-cols-4',
    'auto-rows-max',
    'grid-flow-row-dense', // Dense packing for better space utilization
    
    // Fix: Prevent items from stretching to row height
    'items-start', // This prevents grid items from stretching vertically
    
    // Gap configuration
    `gap-${gap} lg:gap-6`,
    
    // Performance optimizations
    'will-change-contents',
    
    className
  );
}

/**
 * Get masonry item styles with consistent card appearance
 * Wide images span 2 columns using CSS Grid
 */
export function getMasonryItemStyles({
  isWideImage = false,
  className,
}: {
  isWideImage?: boolean;
  className?: string;
} = {}) {
  return cn(
    // Base card styling - consistent with grid layout
    'bg-white rounded-lg overflow-hidden cursor-pointer',
    'border border-gray-200 shadow-sm hover:shadow-md',
    'transition-shadow',
    
    // Wide image spanning - this actually works in CSS Grid!
    isWideImage && 'col-span-2',
    
    className
  );
}

/**
 * Get wide image specific styles - now just for subtle visual enhancement
 * No longer needs special borders since grid handles the spanning
 */
export function getWideImageStyles({
  className,
}: {
  className?: string;
} = {}) {
  return cn(
    // Subtle enhancement for wide images (optional)
    // Keep it minimal to maintain consistency
    className
  );
}

/**
 * Utility function to determine if an image should be treated as wide
 */
export function isWideImage(aspectRatio: number): boolean {
  return aspectRatio >= WIDE_IMAGE_THRESHOLD;
}

/**
 * Get responsive column count based on current breakpoint
 */
export function getColumnCount(isMobile: boolean): number {
  return isMobile ? masonryBreakpoints.mobile.columns : masonryBreakpoints.desktop.columns;
}

/**
 * Generate masonry layout configuration object
 */
export function getMasonryConfig(gap: number = 4) {
  return {
    container: {
      gap,
      breakpoints: masonryBreakpoints,
    },
    item: {
      wideThreshold: WIDE_IMAGE_THRESHOLD,
      gap,
    },
  };
} 