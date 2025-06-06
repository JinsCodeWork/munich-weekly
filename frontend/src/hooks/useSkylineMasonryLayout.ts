import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { layoutApi, type MasonryOrderApiResponse } from '@/api/layout';
import { CONTAINER_CONFIG } from '@/styles/components/container';

/**
 * Represents an item in the Skyline masonry layout
 */
export interface SkylineLayoutItem<T = unknown> {
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
 * Configuration for Skyline masonry layout
 */
export interface SkylineMasonryConfig {
  columnWidth?: number | { mobile: number; tablet: number; desktop: number };
  gap?: number | { mobile: number; tablet: number; desktop: number };
  mobileColumns?: number;
  tabletColumns?: number;
  desktopColumns?: number;
  mobileBreakpoint?: number;
  tabletBreakpoint?: number;
  wideImageThreshold?: number;
}

/**
 * Result of Skyline masonry layout calculation
 */
export interface SkylineMasonryLayoutResult<T = unknown> {
  layoutItems: SkylineLayoutItem<T>[];
  containerHeight: number;
  isLayoutReady: boolean;
  totalItems: number;
  loadedItems: number;
  loadingProgress: number; // 0-100
  columnCount: number;
  forceLayout: () => void;
  // Ordering metadata from backend
  avgAspectRatio: number;
  wideImageCount: number;
  orderingSource: '2col' | '4col' | 'fallback';
  // Progressive loading support
  isProgressiveReady: boolean; // True when progressive layout can be shown
  progressiveItems: number; // Number of items ready for progressive display
}

/**
 * State for the ordering API
 */
interface OrderingState {
  data: MasonryOrderApiResponse | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Default configuration matching the container system
 */
const DEFAULT_CONFIG: Required<SkylineMasonryConfig> = {
  columnWidth: CONTAINER_CONFIG.voteMasonry.columnWidth,
  gap: CONTAINER_CONFIG.voteMasonry.gap,
  mobileColumns: CONTAINER_CONFIG.voteMasonry.columns.mobile,
  tabletColumns: CONTAINER_CONFIG.voteMasonry.columns.tablet,
  desktopColumns: CONTAINER_CONFIG.voteMasonry.columns.desktop,
  mobileBreakpoint: 768,
  tabletBreakpoint: 1024,
  wideImageThreshold: 16 / 9,
};

/**
 * Custom hook for Skyline masonry layout using backend pre-ordering
 * 
 * Benefits:
 * - Backend provides optimal ordering (quality guarantee)  
 * - Frontend handles responsive positioning (performance guarantee)
 * - Simplified API with automatic column detection
 * - O(N·C) Skyline algorithm for efficient positioning
 * 
 * @param items - Array of items to be laid out
 * @param issueId - Issue ID for backend ordering API
 * @param config - Configuration object for layout parameters
 * @param getDimensions - Function to get item dimensions and loading state
 * @returns SkylineMasonryLayoutResult with positioned items
 */
export function useSkylineMasonryLayout<T = unknown>(
  items: T[],
  issueId: number | null,
  config: Partial<SkylineMasonryConfig> = {},
  getDimensions: (item: T) => { width: number; height: number; aspectRatio?: number; isLoaded: boolean } | null
): SkylineMasonryLayoutResult<T> {
  
  const mergedConfig = useMemo(() => {
    return { ...DEFAULT_CONFIG, ...config };
  }, [config]);
  
  const [screenWidth, setScreenWidth] = useState<number>(0);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  
  // Ordering API state
  const [orderingState, setOrderingState] = useState<OrderingState>({
    data: null,
    isLoading: false,
    error: null
  });

  // Prevent duplicate API calls for the same issueId
  const [activeRequest, setActiveRequest] = useState<Promise<MasonryOrderApiResponse> | null>(null);
  const requestIdRef = useRef<number | null>(null);

  // Track screen width and container width for responsive calculations
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

  // Fetch ordering data from backend with duplicate request prevention
  const fetchOrdering = useCallback(async () => {
    if (!issueId) return;

    // Check if request is already in progress for this issueId
    if (requestIdRef.current === issueId && activeRequest) {
      console.log(`🎯 防重复请求: issueId=${issueId} 已在请求中，复用中...`);
      try {
        const response = await activeRequest;
        setOrderingState({
          data: response,
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Failed to fetch masonry ordering from active request:', error);
        setOrderingState({
          data: null,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Unknown ordering error')
        });
      }
      return;
    }

    setOrderingState(prev => ({ ...prev, isLoading: true, error: null }));
    requestIdRef.current = issueId;

    try {
      const requestPromise = layoutApi.getMasonryOrdering(issueId);
      setActiveRequest(requestPromise);
      
      const response = await requestPromise;
      setOrderingState({
        data: response,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Failed to fetch masonry ordering:', error);
      setOrderingState({
        data: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unknown ordering error')
      });
    } finally {
      setActiveRequest(null);
      requestIdRef.current = null;
    }
  }, [issueId, activeRequest]);

  // Effect to fetch ordering when issueId changes
  useEffect(() => {
    if (issueId) {
      fetchOrdering();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueId]); // Intentionally exclude fetchOrdering to prevent infinite loop

  // Calculate current responsive parameters
  const { columnCount, currentColumnWidth, currentGap } = useMemo(() => {
    // Determine column count based on screen width
    let cols: number;
    if (screenWidth === 0) cols = mergedConfig.desktopColumns; // Server-side default
    else if (screenWidth < mergedConfig.mobileBreakpoint) cols = mergedConfig.mobileColumns;
    else if (screenWidth < mergedConfig.tabletBreakpoint) cols = mergedConfig.tabletColumns;
    else cols = mergedConfig.desktopColumns;

    // Get current gap based on screen size
    let gap: number;
    if (typeof mergedConfig.gap === 'number') {
      gap = mergedConfig.gap;
    } else {
      if (screenWidth === 0) gap = mergedConfig.gap.desktop;
      else if (screenWidth < mergedConfig.mobileBreakpoint) gap = mergedConfig.gap.mobile;
      else if (screenWidth < mergedConfig.tabletBreakpoint) gap = mergedConfig.gap.tablet;
      else gap = mergedConfig.gap.desktop;
    }

    // Calculate dynamic column width based on container width
    let colWidth: number;
    if (containerWidth === 0) {
      // Fallback to configured column width if container width not available
      if (typeof mergedConfig.columnWidth === 'number') {
        colWidth = mergedConfig.columnWidth;
      } else {
        if (screenWidth === 0) colWidth = mergedConfig.columnWidth.desktop;
        else if (screenWidth < mergedConfig.mobileBreakpoint) colWidth = mergedConfig.columnWidth.mobile;
        else if (screenWidth < mergedConfig.tabletBreakpoint) colWidth = mergedConfig.columnWidth.tablet;
        else colWidth = mergedConfig.columnWidth.desktop;
      }
    } else {
      // Dynamic calculation: distribute available width across columns and gaps
      const totalGapWidth = (cols - 1) * gap;
      const availableWidth = containerWidth - totalGapWidth;
      colWidth = Math.floor(availableWidth / cols);
    }

    return {
      columnCount: cols,
      currentColumnWidth: colWidth,
      currentGap: gap
    };
  }, [screenWidth, containerWidth, mergedConfig]);

  // Get ordered items based on current column count and backend ordering
  const orderedItems = useMemo(() => {
    if (!orderingState.data || !items.length) {
      return items; // Fallback to original order
    }

    const orderResult = orderingState.data.order;
    const targetOrdering = columnCount <= 2 ? orderResult.orderedIds2col : orderResult.orderedIds4col;
    
    if (!targetOrdering.length) {
      return items; // Fallback if no ordering available
    }

    // Create a map of id -> item for efficient lookup
    const itemsMap = new Map<number, T>();
    items.forEach(item => {
      // Assume items have an id property
      const id = (item as { id?: number }).id;
      if (id) itemsMap.set(id, item);
    });

    // Reorder items according to backend ordering
    const orderedItems: T[] = [];
    const usedItems = new Set<T>();

    // First, add items in the specified order
    targetOrdering.forEach(id => {
      const item = itemsMap.get(id);
      if (item && !usedItems.has(item)) {
        orderedItems.push(item);
        usedItems.add(item);
      }
    });

    // Then add any remaining items that weren't in the ordering
    items.forEach(item => {
      if (!usedItems.has(item)) {
        orderedItems.push(item);
      }
    });

    return orderedItems;
  }, [items, orderingState.data, columnCount]);

  // Determine ordering source for debugging
  const orderingSource = useMemo<'2col' | '4col' | 'fallback'>(() => {
    if (!orderingState.data) return 'fallback';
    return columnCount <= 2 ? '2col' : '4col';
  }, [orderingState.data, columnCount]);

  // **FIX: Stabilize layout calculation with progressive loading support**
  const layoutResult = useMemo(() => {
    const heights: number[] = Array(columnCount).fill(0);
    const layoutItems: SkylineLayoutItem<T>[] = [];
    
    let loadedCount = 0;
    let progressiveReadyCount = 0;
    const totalCount = orderedItems.length;

    // **SKYLINE ALGORITHM** - O(N·C) one-pass positioning with progressive support
    orderedItems.forEach((item) => {
      const dimensions = getDimensions(item);
      
      // **CORE: Use stored aspect ratio directly - no calculation needed**
      let imgWidth: number, imgHeight: number, isLoaded: boolean, aspectRatio: number;
      
      if (!dimensions) {
        // This should not happen for submissions with stored dimensions
        console.warn('No dimensions available for item - this indicates a data issue');
        imgWidth = 400;  
        imgHeight = 300; 
        aspectRatio = 1.33; // Use reasonable fallback
        isLoaded = false;
      } else {
        ({ width: imgWidth, height: imgHeight, isLoaded } = dimensions);
        
        // **CRITICAL: Always use stored aspect ratio - never calculate**
        aspectRatio = dimensions.aspectRatio || 1.33;
        
        // Validate dimensions are positive
        if (!imgWidth || !imgHeight || imgWidth <= 0 || imgHeight <= 0) {
          console.warn('Invalid stored dimensions - using fallback');
          imgWidth = 400;
          imgHeight = 300;
          // Keep using stored aspect ratio even with fallback dimensions
        }
      }

      if (isLoaded) {
        loadedCount++;
        progressiveReadyCount++;
      } else {
        progressiveReadyCount++;
      }

      // Determine if image is wide and calculate span using stored aspect ratio
      const isWide = aspectRatio >= mergedConfig.wideImageThreshold;
      const span = isWide ? Math.min(2, columnCount) : 1;

      // Calculate actual render dimensions
      const realWidth = span * currentColumnWidth + (span - 1) * currentGap;
      
      // **SYNC WITH BACKEND**: Dynamic content height calculation matching backend algorithm
      const submission = item as { description?: string } & Record<string, unknown>;
      const titleText = submission?.description?.split('\n')[0] || '';
      const titleLength = titleText.length;
      
      // Base content height components (matching backend calculation)
      const isTabletOrLarger = screenWidth >= mergedConfig.tabletBreakpoint;
      const basePadding = isTabletOrLarger ? 32 : 24; // p-3 sm:p-4
      const metadataHeight = 24;
      
      // Dynamic title height calculation based on text length and card width
      let titleHeight: number;
      
      if (isWide) {
        // Wide images: larger font, more space, can show up to 3 lines
        const fontSizeBase = isTabletOrLarger ? 20 : 16; // text-base/lg
        const maxLines = 3;
        const charsPerLine = Math.floor(realWidth / (fontSizeBase * 0.6)); // Approximate chars per line
        const estimatedLines = Math.min(maxLines, Math.ceil(titleLength / charsPerLine));
        titleHeight = estimatedLines * (fontSizeBase + 4) + 8; // Line height + margin-bottom
      } else {
        // Regular images: smaller font, 2 lines max
        const fontSizeBase = isTabletOrLarger ? 16 : 14; // text-sm/base
        const maxLines = 2;
        const charsPerLine = Math.floor(realWidth / (fontSizeBase * 0.6));
        const estimatedLines = Math.min(maxLines, Math.ceil(titleLength / charsPerLine));
        titleHeight = estimatedLines * (fontSizeBase + 4) + 8;
      }
      
      // Total content height with safety margin to prevent overlaps (matching backend)
      const safetyMargin = 12; // Extra padding to ensure no overlaps
      const contentHeight = basePadding + titleHeight + metadataHeight + safetyMargin;
      let realHeight = Math.round(realWidth / aspectRatio) + contentHeight;

      // **FIX: Validate calculated height to prevent NaN**
      if (!realHeight || realHeight <= 0 || !isFinite(realHeight)) {
        // Invalid calculated height, using fallback - removed debug logging for cleaner console
        // Use a reasonable fallback height based on card width
        const fallbackHeight = Math.round(realWidth * 0.75) + contentHeight; // 4:3 aspect ratio
        realHeight = fallbackHeight;
      }

      // **SKYLINE BEST-FIT** - Find the best column position
      let bestCol = 0;
      let bestY = Infinity;

      for (let c = 0; c <= columnCount - span; c++) {
        const y = Math.max(...heights.slice(c, c + span));
        if (y < bestY) {
          bestY = y;
          bestCol = c;
        }
      }

      // Calculate absolute positioning
      const x = bestCol * (currentColumnWidth + currentGap);
      const y = bestY;

      // Update column heights
      const newHeight = y + realHeight + currentGap;
      for (let k = bestCol; k < bestCol + span; k++) {
        heights[k] = newHeight;
      }

      // Add positioned item
      layoutItems.push({
        id: (item as { id?: string | number }).id || Math.random(), // Fallback ID
        data: item,
        x,
        y,
        width: realWidth,
        height: realHeight,
        span,
        aspectRatio,
        isWide,
        isLoaded,
      });
    });

    // **FIX: Ensure container height is always a valid number**
    const containerHeight = heights.length > 0 ? Math.max(...heights, 0) : 0;
    
    // **FIX: Validate container height before returning**
    const validContainerHeight = (containerHeight && isFinite(containerHeight)) ? containerHeight : 0;
    
    const loadingProgress = totalCount > 0 ? (loadedCount / totalCount) * 100 : 100;
    
    // Progressive layout readiness calculation
    const progressiveThreshold = Math.min(6, Math.ceil(totalCount * 0.4)); // 40% or 6 items, whichever is smaller
    const isProgressiveLayoutReady = progressiveReadyCount >= progressiveThreshold && progressiveReadyCount > 0;

    return {
      layoutItems,
      containerHeight: validContainerHeight,
      isLayoutReady: loadedCount === totalCount && totalCount > 0,
      totalItems: totalCount,
      loadedItems: loadedCount,
      loadingProgress,
      // Progressive loading metrics
      isProgressiveReady: isProgressiveLayoutReady,
      progressiveItems: progressiveReadyCount,
    };
  }, [orderedItems, columnCount, currentColumnWidth, currentGap, mergedConfig.wideImageThreshold, mergedConfig.tabletBreakpoint, getDimensions, screenWidth]);

  // Force layout recalculation
  const forceLayout = useCallback(() => {
    if (issueId) {
      // Clear any active request and force new calculation
      setActiveRequest(null);
      requestIdRef.current = null;
      setOrderingState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const requestPromise = layoutApi.getMasonryOrdering(issueId);
      setActiveRequest(requestPromise);
      requestIdRef.current = issueId;
      
      requestPromise.then(response => {
        setOrderingState({
          data: response,
          isLoading: false,
          error: null
        });
      }).catch(error => {
        console.error('Failed to fetch masonry ordering:', error);
        setOrderingState({
          data: null,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Unknown ordering error')
        });
      }).finally(() => {
        setActiveRequest(null);
        requestIdRef.current = null;
      });
    }
  }, [issueId]);

  return {
    ...layoutResult,
    columnCount,
    forceLayout,
    avgAspectRatio: orderingState.data?.order.avgAspectRatio || 0,
    wideImageCount: orderingState.data?.order.wideImageCount || 0,
    orderingSource,
  };
} 