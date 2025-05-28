import { useState, useEffect, useMemo, useCallback } from 'react';
import { CONTAINER_CONFIG } from '@/styles/components/container';

/**
 * Represents an item in the absolute positioned masonry layout
 */
export interface LayoutItem<T = unknown> {
  id: string | number;
  data: T;
  x: number;      // Absolute left position
  y: number;      // Absolute top position  
  width: number;  // Calculated render width
  height: number; // Calculated render height
  span: number;   // Number of columns to span
  aspectRatio: number;
  isWide: boolean;
  isLoaded: boolean;
}

/**
 * Configuration for absolute masonry layout
 */
export interface MasonryConfig {
  columnWidth: number | {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap: number | {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  wideImageThreshold: number; // Aspect ratio threshold for wide images (default: 16/9)
  mobileColumns: number;
  tabletColumns: number;      // Added tablet support
  desktopColumns: number;
  mobileBreakpoint: number;   // Breakpoint for mobile (default: 768px)
  tabletBreakpoint: number;   // Breakpoint for tablet (default: 1024px)
  
  // **WEIGHTED SCORING ALGORITHM PARAMETERS**
  /**
   * Weight exponent (α) for wide image placement bias
   * - α = 1.0: original algorithm (pure y-based)
   * - α < 1.0: favor wide images more (they get lower scores, placed earlier)
   * - α > 1.0: favor narrow images more (wide images get higher scores, placed later)
   * @default 0.9 (slight bias toward wide images)
   */
  wideImageBias?: number;
  
  /**
   * Enable weighted scoring algorithm to prevent wide images from sinking to bottom
   * When false, uses original pure y-based best-fit algorithm
   * @default true
   */
  enableWeightedScoring?: boolean;
}

/**
 * Result of absolute masonry layout calculation
 */
export interface MasonryLayoutResult<T = unknown> {
  layoutItems: LayoutItem<T>[];
  containerHeight: number;
  isLayoutReady: boolean;
  totalItems: number;
  loadedItems: number;
  loadingProgress: number; // 0-100
  forceLayout: () => void; // Function to force re-layout
  columnCount: number; // Current column count
}

/**
 * Default configuration for masonry layout
 * Synchronized with container system for pixel-perfect layout
 */
const DEFAULT_CONFIG: MasonryConfig = {
  columnWidth: CONTAINER_CONFIG.masonry.columnWidth,
  gap: CONTAINER_CONFIG.masonry.gap,
  wideImageThreshold: 16 / 9, // 1.778
  mobileColumns: CONTAINER_CONFIG.masonry.columns.mobile,
  tabletColumns: CONTAINER_CONFIG.masonry.columns.tablet,
  desktopColumns: CONTAINER_CONFIG.masonry.columns.desktop,
  mobileBreakpoint: 768, // Lower breakpoint for better tablet support
  tabletBreakpoint: 1024, // Upper breakpoint for tablet support
  
  // **WEIGHTED SCORING ALGORITHM DEFAULTS**
  wideImageBias: 0.9, // Slight bias toward wide images to prevent sinking
  enableWeightedScoring: true, // Enable the improved algorithm by default
};

/**
 * Custom hook for absolute positioned masonry layout using Greedy Best-Fit algorithm
 * Dynamically selects items to minimize gaps and fill holes optimally
 * 
 * @param items - Array of items to be laid out
 * @param config - Configuration object for layout parameters
 * @returns MasonryLayoutResult with absolute positioned items
 */
export function useMasonryLayout<T = unknown>(
  items: T[],
  config: Partial<MasonryConfig> = {},
  getDimensions: (item: T) => { width: number; height: number; isLoaded: boolean } | null
): MasonryLayoutResult<T> {
  const mergedConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);
  
  const [screenWidth, setScreenWidth] = useState<number>(0);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Track screen width and container width for responsive column calculation
  useEffect(() => {
    const updateDimensions = () => {
      const newScreenWidth = window.innerWidth;
      setScreenWidth(newScreenWidth);
      
      // Calculate effective container width based on vote container settings
      // vote container: max-w-[1600px] with px-2 md:px-4 lg:px-6 padding
      const maxWidth = Math.min(1600, newScreenWidth);
      let padding = 0;
      if (newScreenWidth >= 1024) padding = 24; // lg:px-6
      else if (newScreenWidth >= 768) padding = 16; // md:px-4  
      else padding = 8; // px-2
      
      const effectiveWidth = maxWidth - (padding * 2);
      setContainerWidth(effectiveWidth);
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Calculate current column count based on screen width
  const columnCount = useMemo(() => {
    if (screenWidth === 0) return mergedConfig.desktopColumns; // Server-side default
    if (screenWidth < mergedConfig.mobileBreakpoint) return mergedConfig.mobileColumns;
    if (screenWidth < mergedConfig.tabletBreakpoint) return mergedConfig.tabletColumns;
    return mergedConfig.desktopColumns;
  }, [screenWidth, mergedConfig.mobileBreakpoint, mergedConfig.tabletBreakpoint, mergedConfig.desktopColumns, mergedConfig.mobileColumns, mergedConfig.tabletColumns]);

  // Get current gap based on screen size
  const currentGap = useMemo(() => {
    if (typeof mergedConfig.gap === 'number') {
      return mergedConfig.gap;
    }
    
    if (screenWidth === 0) return mergedConfig.gap.desktop; // Server-side default
    if (screenWidth < mergedConfig.mobileBreakpoint) return mergedConfig.gap.mobile;
    if (screenWidth < mergedConfig.tabletBreakpoint) return mergedConfig.gap.tablet;
    return mergedConfig.gap.desktop;
  }, [screenWidth, mergedConfig.gap, mergedConfig.mobileBreakpoint, mergedConfig.tabletBreakpoint]);

  // Calculate dynamic column width based on container width
  const currentColumnWidth = useMemo(() => {
    if (containerWidth === 0) {
      // Fallback to configured column width if container width not available
      if (typeof mergedConfig.columnWidth === 'number') {
        return mergedConfig.columnWidth;
      }
      
      if (screenWidth === 0) return mergedConfig.columnWidth.desktop;
      if (screenWidth < mergedConfig.mobileBreakpoint) return mergedConfig.columnWidth.mobile;
      if (screenWidth < mergedConfig.tabletBreakpoint) return mergedConfig.columnWidth.tablet;
      return mergedConfig.columnWidth.desktop;
    }
    
    // Dynamic calculation: distribute available width across columns and gaps
    const totalGapWidth = (columnCount - 1) * currentGap;
    const availableWidth = containerWidth - totalGapWidth;
    const dynamicColumnWidth = Math.floor(availableWidth / columnCount);
    
    return dynamicColumnWidth;
  }, [containerWidth, columnCount, currentGap, screenWidth, mergedConfig.columnWidth, mergedConfig.mobileBreakpoint, mergedConfig.tabletBreakpoint]);

  // Prepare items with calculated dimensions
  const preparedItems = useMemo(() => {
    return items.map((item, index) => {
      const dimensions = getDimensions(item);
      
      if (!dimensions) {
        return null;
      }

      const aspectRatio = dimensions.width / dimensions.height;
      const isWide = aspectRatio >= mergedConfig.wideImageThreshold;
      const span = isWide ? Math.min(2, columnCount) : 1;
      
      // Calculate real render dimensions
      const realWidth = span * currentColumnWidth + (span - 1) * currentGap;
      const imageHeight = realWidth / aspectRatio;
      
      // **ENHANCED**: Dynamic content height based on text length and image width
      const submission = item as { description?: string } & Record<string, unknown>; // Type-safe assertion
      const titleText = submission?.description?.split('\n')[0] || '';
      const titleLength = titleText.length;
      
      // Base content height components:
      // - Padding: p-3 sm:p-4 = 24-32px total
      // - Metadata area: ~20-24px
      const basePadding = screenWidth >= mergedConfig.tabletBreakpoint ? 32 : 24;
      const metadataHeight = 24;
      
      // Dynamic title height calculation based on text length and card width
      let titleHeight: number;
      
      if (isWide) {
        // Wide images: larger font, more space, can show up to 3 lines
        const fontSizeBase = screenWidth >= mergedConfig.tabletBreakpoint ? 20 : 16; // text-base/lg
        const maxLines = 3;
        const charsPerLine = Math.floor(realWidth / (fontSizeBase * 0.6)); // Approximate chars per line
        const estimatedLines = Math.min(maxLines, Math.ceil(titleLength / charsPerLine));
        titleHeight = estimatedLines * (fontSizeBase + 4) + 8; // Line height + margin-bottom
      } else {
        // Regular images: smaller font, 2 lines max
        const fontSizeBase = screenWidth >= mergedConfig.tabletBreakpoint ? 16 : 14; // text-sm/base
        const maxLines = 2;
        const charsPerLine = Math.floor(realWidth / (fontSizeBase * 0.6));
        const estimatedLines = Math.min(maxLines, Math.ceil(titleLength / charsPerLine));
        titleHeight = estimatedLines * (fontSizeBase + 4) + 8;
      }
      
      // Total content height with safety margin to prevent overlaps
      const safetyMargin = 12; // Extra padding to ensure no overlaps
      const contentHeight = basePadding + titleHeight + metadataHeight + safetyMargin;
      const realHeight = imageHeight + contentHeight;

      return {
        id: (item as Record<string, unknown>).id as string | number || index,
        data: item,
        realWidth,
        realHeight,
        span,
        aspectRatio,
        isWide,
        isLoaded: dimensions.isLoaded,
      };
    }).filter(Boolean) as Array<{
      id: string | number;
      data: T;
      realWidth: number;
      realHeight: number;
      span: number;
      aspectRatio: number;
      isWide: boolean;
      isLoaded: boolean;
    }>;
  }, [items, getDimensions, columnCount, currentColumnWidth, currentGap, mergedConfig.wideImageThreshold, screenWidth, mergedConfig.tabletBreakpoint]);

  // **GREEDY BEST-FIT ALGORITHM** with absolute positioning and weighted scoring
  // Dynamically selects items to fill gaps optimally and minimize holes
  // Uses weighted scoring (y/span^α) to give wide images fairer placement opportunity
  const layoutResult = useMemo(() => {
    const heights: number[] = Array(columnCount).fill(0);
    const layoutItems: LayoutItem<T>[] = [];
    
    // Only process loaded items
    const loadedItems = preparedItems.filter(item => item.isLoaded);
    const totalItems = preparedItems.length;
    const loadingProgress = totalItems > 0 ? (loadedItems.length / totalItems) * 100 : 0;

    // Create a pool of remaining items to place
    const pool = [...loadedItems];

    // **WEIGHTED SCORING PARAMETERS**
    // Get algorithm parameters from configuration
    const enableWeighted = mergedConfig.enableWeightedScoring ?? DEFAULT_CONFIG.enableWeightedScoring!;
    const α = mergedConfig.wideImageBias ?? DEFAULT_CONFIG.wideImageBias!;

    // **WIDE IMAGE STREAK LIMITING**
    // Prevent wide images from being placed consecutively
    // Enhanced: Require at least 2 narrow images after each wide image
    let wideStreak = 0;           // Counter for consecutive wide images
    let narrowStreak = 0;         // Counter for consecutive narrow images after wide
    const maxWideStreak = 1;      // Maximum consecutive wide images allowed
    const minNarrowAfterWide = 2; // Minimum narrow images required after wide image

    // **GREEDY BEST-FIT MAIN LOOP WITH ENHANCED WIDE IMAGE LIMITING**
    // Choose between weighted scoring and original pure y-based algorithm
    // Plus enhanced wide image streak limiting to ensure fair distribution
    while (pool.length > 0) {
      
      // **CANDIDATE FILTERING WITH ENHANCED WIDE IMAGE LIMITING**
      // If we just placed wide images and haven't placed enough narrow images,
      // force narrow image selection
      let candidates = pool;
      
      if (wideStreak >= maxWideStreak && narrowStreak < minNarrowAfterWide && pool.some(item => !item.isWide)) {
        // Force narrow images: we need at least 2 narrow images after wide
        candidates = pool.filter(item => !item.isWide);
      }

      // **BEST-FIT ALGORITHM** - Find optimal position for remaining candidates
      let bestChoice = {
        item: null as typeof pool[0] | null,
        poolIndex: -1,
        columnStart: 0,
        span: 1,
        y: Infinity,
        score: Infinity
      };

      // For each remaining item in the candidates pool, try all possible positions
      candidates.forEach((item) => {
        const span = item.span;
        const poolIndex = pool.indexOf(item); // Get original index in pool

        // Try placing this item in each possible column position
        for (let columnStart = 0; columnStart <= columnCount - span; columnStart++) {
          // Find the maximum height among the columns this item would span
          const y = Math.max(...heights.slice(columnStart, columnStart + span));
          
          // Calculate score based on algorithm choice
          const score = enableWeighted ? y / Math.pow(span, α) : y;
          
          // Update best choice if this position is better
          if (score < bestChoice.score) {
            bestChoice = {
              item,
              poolIndex,
              columnStart,
              span,
              y,
              score
            };
          }
        }
      });

      // **ITEM PLACEMENT** - Place the best item and update state
      if (bestChoice.item) {
        const item = bestChoice.item;
        
        // Remove the chosen item from the pool
        pool.splice(bestChoice.poolIndex, 1);
        
        // Calculate the new height after placing this item
        const newHeight = bestChoice.y + item.realHeight + currentGap;
        
        // Update the heights of all affected columns
        for (let i = bestChoice.columnStart; i < bestChoice.columnStart + bestChoice.span; i++) {
          heights[i] = newHeight;
        }
        
        // Add the positioned item to the result
        layoutItems.push({
          id: item.id,
          data: item.data,
          x: bestChoice.columnStart * (currentColumnWidth + currentGap),
          y: bestChoice.y,
          width: item.realWidth,
          height: item.realHeight,
          span: item.span,
          aspectRatio: item.aspectRatio,
          isWide: item.isWide,
          isLoaded: item.isLoaded,
        });

        // **UPDATE STREAK COUNTERS WITH ENHANCED LOGIC**
        if (item.isWide) {
          wideStreak += 1;
          narrowStreak = 0; // Reset narrow streak when placing wide image
        } else {
          narrowStreak += 1;
          // Only reset wide streak when we've placed enough narrow images
          if (narrowStreak >= minNarrowAfterWide) {
            wideStreak = 0;
          }
        }
      } else {
        // Safety break if no valid placement found
        console.warn('MasonryLayout: No valid placement found for remaining items');
        break;
      }
    }

    return {
      layoutItems,
      containerHeight: Math.max(...heights, 0),
      isLayoutReady: loadedItems.length === totalItems && totalItems > 0,
      totalItems,
      loadedItems: loadedItems.length,
      loadingProgress,
    };
  }, [preparedItems, columnCount, currentColumnWidth, currentGap, mergedConfig.enableWeightedScoring, mergedConfig.wideImageBias]);

  // Force re-layout when items change significantly
  const forceLayout = useCallback(() => {
    // This function can be used to trigger re-layout when needed
    // Currently serves as a placeholder for future functionality
  }, []);

  return {
    ...layoutResult,
    forceLayout,
    columnCount,
  };
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