/**
 * Masonry Layout Component Styles
 * JavaScript-based masonry layout with dynamic column height calculation
 * Enhanced with modern responsive design and improved spacing
 */

import { cn } from '@/lib/utils';
import { CONTAINER_CONFIG } from './container';

/**
 * Enhanced breakpoint configuration for responsive masonry layout
 * Aligned with modern responsive design principles
 */
export const masonryBreakpoints = {
  mobile: {
    maxWidth: 767,
    columns: 2,
  },
  tablet: {
    minWidth: 768,
    maxWidth: 1023,
    columns: 3,
  },
  desktop: {
    minWidth: 1024,
    maxWidth: 1535,
    columns: 4,
  },
  ultrawide: {
    minWidth: 1536,
    columns: 5,
  },
} as const;

/**
 * Enhanced masonry configuration with improved spacing
 */
export const masonryConfig = {
  gap: CONTAINER_CONFIG.masonry.gap, // 24px for better visual separation
  columnWidth: CONTAINER_CONFIG.masonry.columnWidth, // 300px
  wideImageThreshold: 1.6, // Slightly lower threshold for better detection
} as const;

/**
 * Wide image detection threshold
 * Images with aspect ratio >= 16:9 (1.78) are considered wide
 */
export const WIDE_IMAGE_THRESHOLD = 16 / 9; // 1.778

/**
 * Get masonry container styles for JavaScript-based layout
 * Uses CSS Grid for column structure, JavaScript calculates positioning
 */
export function getMasonryLayoutStyles({
  columnCount = 4,
  className,
}: {
  columnCount?: number;
  className?: string;
} = {}) {
  return cn(
    // Grid container for columns
    'grid auto-rows-max',
    
    // Dynamic column count classes
    columnCount === 2 && 'grid-cols-2',
    columnCount === 3 && 'grid-cols-3',
    columnCount === 4 && 'grid-cols-4',
    columnCount === 5 && 'grid-cols-5',
    
    // Performance optimizations
    'will-change-contents',
    
    className
  );
}

/**
 * Get masonry column styles
 * Each column is a flex container that stacks items vertically
 */
export function getMasonryColumnStyles({
  className,
}: {
  className?: string;
} = {}) {
  return cn(
    // Flex column for vertical stacking
    'flex flex-col',
    
    className
  );
}

/**
 * Get masonry item styles with consistent card appearance
 * Regular items fit within their column, wide images need special handling
 */
export function getMasonryItemStyles({
  className,
}: {
  className?: string;
} = {}) {
  return cn(
    // Base card styling - consistent appearance
    'bg-white rounded-lg overflow-hidden cursor-pointer',
    'border border-gray-200 shadow-sm hover:shadow-md',
    'transition-shadow duration-200',
    
    // Block display for proper spacing
    'block',
    
    className
  );
}

/**
 * Get wide image container styles
 * Wide images span across 2 columns and need special positioning
 */
export function getWideImageContainerStyles({
  className,
}: {
  className?: string;
} = {}) {
  return cn(
    // Span 2 columns
    'col-span-2',
    
    // Relative positioning for proper layout
    'relative',
    
    // Ensure proper width calculation
    'w-full',
    
    className
  );
}

/**
 * Get wide image specific styles for enhanced visual appearance
 */
export function getWideImageStyles({
  className,
}: {
  className?: string;
} = {}) {
  return cn(
    // Enhanced shadow for wide images
    'shadow-md hover:shadow-lg',
    
    // Subtle border enhancement
    'border-2 border-gray-100 hover:border-gray-200',
    
    // Smooth transitions
    'transition-all duration-300',
    
    className
  );
}

/**
 * Responsive column count utilities
 */
export const responsiveColumnClasses = {
  mobile: {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
  },
  desktop: {
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3', 
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
  },
} as const;

/**
 * Get responsive masonry container with breakpoint-aware column counts
 */
export function getResponsiveMasonryStyles({
  mobileColumns = 2,
  desktopColumns = 4,
  className,
}: {
  mobileColumns?: 2 | 3;
  desktopColumns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
} = {}) {
  return cn(
    // Base grid container
    'grid auto-rows-max w-full',
    
    // Mobile columns
    responsiveColumnClasses.mobile[mobileColumns],
    
    // Desktop columns
    responsiveColumnClasses.desktop[desktopColumns],
    
    // Performance optimizations
    'will-change-contents',
    
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
 * Get responsive column count based on screen width
 */
export function getColumnCount(screenWidth: number): number {
  return screenWidth >= masonryBreakpoints.desktop.minWidth 
    ? masonryBreakpoints.desktop.columns 
    : masonryBreakpoints.mobile.columns;
}

/**
 * Generate masonry layout configuration object for JavaScript layout
 */
export function getMasonryConfig({
  gap = 16,
  columnWidth = 280,
  mobileColumns = 2,
  desktopColumns = 4,
  breakpoint = 1024,
}: {
  gap?: number;
  columnWidth?: number;
  mobileColumns?: number;
  desktopColumns?: number;
  breakpoint?: number;
} = {}) {
  return {
    gap,
    columnWidth,
    mobileColumns,
    desktopColumns,
    breakpoint,
    wideImageThreshold: WIDE_IMAGE_THRESHOLD,
  };
}

/**
 * Gap utility classes for dynamic spacing
 */
export const gapClasses = {
  4: 'gap-1',    // 4px
  8: 'gap-2',    // 8px
  12: 'gap-3',   // 12px
  16: 'gap-4',   // 16px
  20: 'gap-5',   // 20px
  24: 'gap-6',   // 24px
} as const;

/**
 * Get gap class from pixel value
 */
export function getGapClass(gap: number): string {
  return gapClasses[gap as keyof typeof gapClasses] || `gap-[${gap}px]`;
} 