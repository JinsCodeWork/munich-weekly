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

  // Track screen width for responsive column calculation
  useEffect(() => {
    const updateScreenWidth = () => {
      setScreenWidth(window.innerWidth);
    };

    updateScreenWidth();
    window.addEventListener('resize', updateScreenWidth);
    return () => window.removeEventListener('resize', updateScreenWidth);
  }, []);

  // Calculate current column count based on screen width
  const columnCount = useMemo(() => {
    if (screenWidth === 0) return mergedConfig.desktopColumns; // Server-side default
    if (screenWidth < mergedConfig.mobileBreakpoint) return mergedConfig.mobileColumns;
    if (screenWidth < mergedConfig.tabletBreakpoint) return mergedConfig.tabletColumns;
    return mergedConfig.desktopColumns;
  }, [screenWidth, mergedConfig.mobileBreakpoint, mergedConfig.tabletBreakpoint, mergedConfig.desktopColumns, mergedConfig.mobileColumns, mergedConfig.tabletColumns]);

  // Get current column width based on screen size
  const currentColumnWidth = useMemo(() => {
    if (typeof mergedConfig.columnWidth === 'number') {
      return mergedConfig.columnWidth;
    }
    
    if (screenWidth === 0) return mergedConfig.columnWidth.desktop; // Server-side default
    if (screenWidth < mergedConfig.mobileBreakpoint) return mergedConfig.columnWidth.mobile;
    if (screenWidth < mergedConfig.tabletBreakpoint) return mergedConfig.columnWidth.tablet;
    return mergedConfig.columnWidth.desktop;
  }, [screenWidth, mergedConfig.columnWidth, mergedConfig.mobileBreakpoint, mergedConfig.tabletBreakpoint]);

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

  // **GREEDY BEST-FIT ALGORITHM** with absolute positioning
  // Dynamically selects items to fill gaps optimally and minimize holes
  const layoutResult = useMemo(() => {
    const heights: number[] = Array(columnCount).fill(0);
    const layoutItems: LayoutItem<T>[] = [];
    
    // Only process loaded items
    const loadedItems = preparedItems.filter(item => item.isLoaded);
    const totalItems = preparedItems.length;
    const loadingProgress = totalItems > 0 ? (loadedItems.length / totalItems) * 100 : 0;

    // Create a pool of remaining items to place
    const pool = [...loadedItems];

    // **GREEDY BEST-FIT MAIN LOOP**
    // Instead of placing items in order, dynamically choose the item that can be placed at the lowest Y position
    while (pool.length > 0) {
      let bestChoice = { 
        itemIndex: -1, 
        y: Infinity, 
        columnStart: 0, 
        span: 0 
      };
      
      // For each remaining item in the pool, try all possible positions
      pool.forEach((item, itemIndex) => {
        const span = item.span;
        
        // Try all possible starting columns for this item
        for (let startCol = 0; startCol <= columnCount - span; startCol++) {
          // Calculate Y position if placing item at startCol
          const y = Math.max(...heights.slice(startCol, startCol + span));
          
          // Choose the placement that results in the lowest Y position
          // If Y positions are equal, prefer smaller span (narrower items) to fill gaps better
          if (
            y < bestChoice.y ||
            (y === bestChoice.y && span < bestChoice.span)
          ) {
            bestChoice = { 
              itemIndex, 
              y, 
              columnStart: startCol, 
              span 
            };
          }
        }
      });
      
      // Remove the chosen item from the pool and place it
      const chosenItem = pool.splice(bestChoice.itemIndex, 1)[0];
      
      // Calculate absolute coordinates
      const x = bestChoice.columnStart * (currentColumnWidth + currentGap);
      
      // Create layout item with absolute positioning
      const layoutItem: LayoutItem<T> = {
        id: chosenItem.id,
        data: chosenItem.data,
        x,
        y: bestChoice.y,
        width: chosenItem.realWidth,
        height: chosenItem.realHeight,
        span: bestChoice.span,
        aspectRatio: chosenItem.aspectRatio,
        isWide: chosenItem.isWide,
        isLoaded: chosenItem.isLoaded,
      };
      
      layoutItems.push(layoutItem);
      
      // Update heights for all columns affected by this item's span
      const newHeight = bestChoice.y + chosenItem.realHeight + currentGap;
      for (let col = bestChoice.columnStart; col < bestChoice.columnStart + bestChoice.span; col++) {
        heights[col] = newHeight;
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
  }, [preparedItems, columnCount, currentColumnWidth, currentGap]);

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