import React, { useState, useMemo, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useImageDimensions, useSubmissionDimensions } from '@/hooks/useImageDimensions';
import { useSkylineMasonryLayout, type SkylineMasonryConfig } from '@/hooks/useSkylineMasonryLayout';
import { Button } from '@/components/ui/Button';
import { Submission } from '@/types/submission';
import { useAuth } from '@/context/AuthContext';

/**
 * Generic type guard to check if items are Submission objects
 */
function isSubmissionArray<T>(items: T[]): items is T[] & Submission[] {
  return items.length > 0 && 
         items.every(item => 
           typeof (item as unknown as Submission)?.imageUrl === 'string' && 
           typeof (item as unknown as Submission)?.description === 'string' &&
           typeof (item as unknown as Submission)?.id === 'number'
         );
}

/**
 * Default loading skeleton component with progressive loading support
 */
function DefaultLoadingSkeleton({ columns, gap }: { columns: number; gap: number }) {
  return (
    <div className="space-y-4">
      {/* Optimized loading message for mobile users */}
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-3"></div>
        <p className="text-sm text-gray-600">Preparing gallery layout...</p>
        <p className="text-xs text-gray-500 mt-1">First images will appear shortly</p>
      </div>
      
      <div 
        className="grid gap-y-4 animate-pulse" 
        style={{ 
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: `${gap}px`
        }}
      >
        {Array.from({ length: columns * 2 }).map((_, i) => ( // Reduced from 3 to 2 rows for faster perceived loading
          <div 
            key={i} 
            className="bg-gray-200 rounded-lg"
            style={{ height: Math.random() * 150 + 100 }} // Slightly smaller skeletons
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Default empty component
 */
function DefaultEmptyComponent() {
  return (
    <div className="text-center text-gray-500 py-12">
      <p>No items to display</p>
    </div>
  );
}

/**
 * Default error component
 */
function DefaultErrorComponent({ errors, onRetry }: { errors: string[]; onRetry: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto h-8 w-8 text-red-400 mb-4">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-2">
        Layout Error
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        {errors.length > 0 ? errors[0] : 'Unknown error occurred'}
      </p>
      <Button 
        onClick={onRetry}
        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700 transition-colors"
      >
        Retry
      </Button>
    </div>
  );
}

/**
 * Props for MasonryGallery component
 */
export interface MasonryGalleryProps<T = unknown> {
  items: T[];
  getImageUrl: (item: T) => string;
  getSubmissionId: (item: T) => string | number;
  renderItem: (item: T, isWide: boolean, aspectRatio: number, isLoaded: boolean) => React.ReactNode;
  className?: string;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  errorComponent?: (errors: string[], onRetry: () => void) => React.ReactNode;
  onItemClick?: (item: T) => void;
  config?: Partial<SkylineMasonryConfig>;
  issueId?: number | null;
}

/**
 * MasonryGallery - Skyline layout component with backend ordering + frontend positioning
 * **ENHANCED: Now automatically detects and optimizes for Submission objects with stored dimensions**
 * 
 * Architecture:
 * - Backend calculates optimal item ordering for 2-col and 4-col layouts
 * - Frontend uses Skyline algorithm for precise pixel positioning
 * - **NEW: Automatically uses stored dimensions when available (Submission objects)**
 * - **NEW: Falls back to dynamic fetching for legacy data or other object types**
 * - Built-in caching mechanism for performance optimization
 * 
 * @example
 * ```tsx
 * <MasonryGallery
 *   issueId={issueId}
 *   items={submissions}
 *   getImageUrl={(item) => item.imageUrl}
 *   getSubmissionId={(item) => item.id}
 *   renderItem={(item, isWide, aspectRatio, isLoaded) => 
 *     <Card isImageLoaded={isLoaded} ... />
 *   }
 * />
 * ```
 */
export function MasonryGallery<T = unknown>({
  items,
  getImageUrl: getItemImageUrl,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getSubmissionId: _getSubmissionId, // Used by skyline hook internally
  renderItem,
  className,
  loadingComponent,
  emptyComponent,
  errorComponent,
  onItemClick,
  config,
  issueId,
}: MasonryGalleryProps<T>) {
  
  // **NEW: Get user authentication context for admin features**
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  // Use different configs based on layout mode
  const skylineConfig = useMemo(() => {
    return config || {};
  }, [config]);

  const [currentColumnCount] = useState<number>(4);
  const [currentGap] = useState<number>(12);

  // **FIX: Use state-based comparison to allow proper updates while preventing infinite loops**
  const [itemsHash, setItemsHash] = useState<string>('');
  const itemsRef = useRef<T[]>([]);
  
  // Compare items by content, including all data changes (like vote counts)
  const currentItemsHash = JSON.stringify(items);
  if (currentItemsHash !== itemsHash) {
    itemsRef.current = items;
    setItemsHash(currentItemsHash);
  }

  // **FIX: Stabilize mobile detection to prevent batch loading issues**
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    // Initialize with immediate detection
    return typeof window !== 'undefined' && window.innerWidth < 768;
  });
  
  // Update mobile detection with window resize listener
  useEffect(() => {
    const updateMobileStatus = () => {
      const mobile = typeof window !== 'undefined' && window.innerWidth < 768;
      setIsMobile(mobile);
    };
    
    // Set initial value (in case SSR/hydration differs)
    updateMobileStatus();
    
    // Listen for resize events
    window.addEventListener('resize', updateMobileStatus);
    return () => window.removeEventListener('resize', updateMobileStatus);
  }, []);

  // **MOBILE DEBUG**: Add comprehensive logging for troubleshooting  
  const batchSize = isMobile ? 4 : 6;
  const timeout = isMobile ? 8000 : 6000;
  const progressiveThreshold = Math.min(4, Math.ceil(items.length * 0.3));

  // **FIX: Only log on actual changes to prevent spam**
  const configRef = useRef({ isMobile, batchSize, timeout, progressiveThreshold, issueId });
  if (configRef.current.issueId !== issueId || configRef.current.isMobile !== isMobile) {
    // Configuration updated - removed debug logging for cleaner console
    configRef.current = { isMobile, batchSize, timeout, progressiveThreshold, issueId };
  }

  // **NEW: Smart dimension loading - Use optimized hook for Submission objects**
  const isSubmissions = isSubmissionArray(items);
  
  // **DEBUG: Log submission detection and data structure**
  useEffect(() => {
    console.log(`🔍 MasonryGallery DEBUG - Data Analysis:`, {
      totalItems: items.length,
      isSubmissions,
      issueId,
      firstItemSample: items.length > 0 ? {
        type: typeof items[0],
        hasImageUrl: !!(items[0] as unknown as Submission)?.imageUrl,
        hasDescription: !!(items[0] as unknown as Submission)?.description, 
        hasId: !!(items[0] as unknown as Submission)?.id,
        hasImageWidth: !!(items[0] as unknown as Submission)?.imageWidth,
        hasImageHeight: !!(items[0] as unknown as Submission)?.imageHeight,
        hasAspectRatio: !!(items[0] as unknown as Submission)?.aspectRatio,
        actualData: items[0]
      } : null
    });
    
    // Check all items for dimension data availability
    if (items.length > 0) {
      const withDimensions = items.filter(item => 
        (item as unknown as Submission)?.imageWidth && 
        (item as unknown as Submission)?.imageHeight && 
        (item as unknown as Submission)?.aspectRatio
      ).length;
      
      console.log(`📊 Dimension Data Analysis:`, {
        itemsWithStoredDimensions: withDimensions,
        totalItems: items.length,
        percentageOptimized: items.length > 0 ? (withDimensions / items.length * 100).toFixed(1) + '%' : '0%'
      });
    }
  }, [items, isSubmissions, issueId]);
  
  // **OPTIMIZATION: Use submission-aware hook when possible**
  const optimizedDimensionsResult = useSubmissionDimensions(
    isSubmissions ? (items as Submission[]) : [],
    { 
      batchSize,
      timeout,
      progressiveThreshold,
      enableProgressiveLoading: true,
      preferStoredDimensions: true,
    }
  );

  // **FALLBACK: Use legacy hook for non-submission objects**
  const legacyDimensionsResult = useImageDimensions(
    !isSubmissions ? items.map(getItemImageUrl) : [],
    { 
      batchSize,
      timeout,
      progressiveThreshold,
      enableProgressiveLoading: true,
    }
  );

  // **SMART SELECTION: Choose the appropriate result based on data type**
  const frontendDimensionsResult = isSubmissions ? optimizedDimensionsResult : legacyDimensionsResult;

  // **PERFORMANCE LOGGING: Track optimization effectiveness**
  const lastOptimizationRef = useRef({ 
    storedCount: 0, 
    dynamicCount: 0, 
    optimizationPercentage: 0,
    isSubmissions: false 
  });
  
  useEffect(() => {
    const { storedDimensionsCount, dynamicFetchCount, totalImages } = frontendDimensionsResult;
    const optimizationPercentage = totalImages > 0 ? (storedDimensionsCount / totalImages) * 100 : 0;
    const current = { 
      storedCount: storedDimensionsCount, 
      dynamicCount: dynamicFetchCount, 
      optimizationPercentage,
      isSubmissions 
    };
    
    // Only log when optimization metrics change significantly
    if (Math.abs(current.optimizationPercentage - lastOptimizationRef.current.optimizationPercentage) > 5 ||
        current.isSubmissions !== lastOptimizationRef.current.isSubmissions) {
      
      console.log(`🎯 MasonryGallery Performance:`, {
        mode: isSubmissions ? 'OPTIMIZED (Submissions)' : 'LEGACY (Generic)',
        stored: storedDimensionsCount,
        dynamic: dynamicFetchCount,
        total: totalImages,
        optimization: `${optimizationPercentage.toFixed(1)}%`
      });
    }
    
    lastOptimizationRef.current = current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frontendDimensionsResult.storedDimensionsCount, frontendDimensionsResult.dynamicFetchCount, frontendDimensionsResult.totalImages, isSubmissions]);

  // **FIX: Use direct access to latest dimensions**
  const skylineGetDimensions = useMemo(() => {
    return (item: T) => {
      const url = getItemImageUrl(item);
      const dimension = frontendDimensionsResult.dimensions.get(url);
      
      // **DEBUG: Detailed dimension tracking for issue resolution**
      if (dimension && (url.includes('1190') || url.includes('1785'))) {
        console.log(`🔍 Dimension Debug for ${url.substring(0, 50)}...`, {
          storedWidth: dimension.width,
          storedHeight: dimension.height,
          storedAspectRatio: dimension.aspectRatio,
          calculatedAspectRatio: dimension.width / dimension.height,
          fromStored: dimension.fromStored,
          isLoaded: dimension.isLoaded,
          submissionData: isSubmissions ? (item as unknown as Submission) : 'Not submission'
        });
      }
      
      return dimension ? { 
        width: dimension.width, 
        height: dimension.height,
        aspectRatio: dimension.aspectRatio,
        isLoaded: dimension.isLoaded
      } : null;
    };
  }, [getItemImageUrl, frontendDimensionsResult.dimensions, isSubmissions]);

  const skylineLayoutResult = useSkylineMasonryLayout(
    items,
    issueId ?? null,
    skylineConfig,
    skylineGetDimensions
  );

  // Determine current state based on progressive and complete loading
  const { isLayoutReady, isProgressiveReady, hasErrors, handleRetry } = useMemo(() => {
    const hasBackendOrdering = skylineLayoutResult.orderingSource !== 'fallback';
    const hasSufficientImages = frontendDimensionsResult.isProgressiveReady;
    const isProgressiveLayoutReady = skylineLayoutResult.isProgressiveReady;
    
    return {
      isLayoutReady: skylineLayoutResult.isLayoutReady,
      isProgressiveReady: hasBackendOrdering && hasSufficientImages && isProgressiveLayoutReady,
      hasErrors: false, // Skyline mode has built-in fallbacks
      handleRetry: skylineLayoutResult.forceLayout
    };
  }, [skylineLayoutResult, frontendDimensionsResult]);

  // **MOBILE FALLBACK**: Force display after timeout to prevent infinite loading
  const [forceDisplay, setForceDisplay] = useState(false);
  
  useEffect(() => {
    if (items.length > 0 && !isProgressiveReady && !isLayoutReady) {
      const timeoutId = setTimeout(() => {
        // Force display timeout - removed debug logging
        setForceDisplay(true);
      }, 10000); // 10 second timeout for mobile
      
      return () => clearTimeout(timeoutId);
    }
  }, [items.length, isProgressiveReady, isLayoutReady]);

  // Reset force display when we get proper layout
  useEffect(() => {
    if (isProgressiveReady || isLayoutReady) {
      setForceDisplay(false);
    }
  }, [isProgressiveReady, isLayoutReady]);

  // **MOBILE DEBUG**: Log layout states
  const lastLayoutRef = useRef({ isLayoutReady: false, isProgressiveReady: false, forceDisplay: false, layoutItemsCount: 0 });
  
  useEffect(() => {
    const current = {
      isLayoutReady,
      isProgressiveReady,
      forceDisplay,
      layoutItemsCount: skylineLayoutResult.layoutItems.length
    };
    
    // Layout state tracking - removed debug logging for cleaner console
    lastLayoutRef.current = current;
  }, [isLayoutReady, isProgressiveReady, forceDisplay, skylineLayoutResult.layoutItems.length]);

  // Performance tracking for progressive loading
  useEffect(() => {
    // Performance tracking - removed debug logging for cleaner console  
  }, [frontendDimensionsResult.isProgressiveReady, skylineLayoutResult.isProgressiveReady, isLayoutReady, frontendDimensionsResult.progressiveLoadedCount, frontendDimensionsResult.totalImages]);

  // Handle empty state
  if (items.length === 0) {
    return (
      <div className={cn('w-full', className)}>
        {emptyComponent || <DefaultEmptyComponent />}
      </div>
    );
  }

  // Show error state if there are errors
  if (hasErrors) {
    return (
      <div className={cn('w-full', className)}>
        {errorComponent ? 
          errorComponent(
            ['Layout calculation failed'],
            handleRetry
          ) : 
          <DefaultErrorComponent 
            errors={['Layout calculation failed']} 
            onRetry={handleRetry} 
          />
        }
      </div>
    );
  }

  // Show loading state only if we don't have progressive content ready AND haven't hit timeout
  if (!isProgressiveReady && !isLayoutReady && !forceDisplay) {
    // Loading state - removed debug logging for cleaner console
    return (
      <div className={cn('w-full', className)}>
        {loadingComponent || <DefaultLoadingSkeleton columns={currentColumnCount} gap={currentGap} />}
      </div>
    );
  }

  // **CRITICAL DEBUG**: Log rendering decision
  // Rendering gallery - removed debug logging for cleaner console

  // Render progressive or complete layout (or forced display after timeout)
  return (
    <div className={cn('w-full', className)}>
      {/* **NEW: Performance indicator for admin users only** */}
      {isAdmin && isSubmissions && (
        <div className="mb-2 text-xs text-gray-500 bg-gray-50 rounded p-2">
          📊 Optimized: {frontendDimensionsResult.storedDimensionsCount} stored, {frontendDimensionsResult.dynamicFetchCount} dynamic 
          ({frontendDimensionsResult.totalImages > 0 ? ((frontendDimensionsResult.storedDimensionsCount / frontendDimensionsResult.totalImages) * 100).toFixed(1) : 0}% optimized)
        </div>
      )}
      
      <div 
        className="relative w-full overflow-hidden"
        style={{ height: skylineLayoutResult.containerHeight + 16 }}
      >
        {skylineLayoutResult.layoutItems.map((layoutItem) => {
          const { data: item, x, y, width, height, isWide, aspectRatio, isLoaded } = layoutItem;
          
          return (
            <div 
              key={layoutItem.id}
              className={cn(
                "absolute overflow-hidden transition-opacity duration-300",
                // Progressive loading effect: show loading state for unloaded images
                !isLoaded && !isLayoutReady && !forceDisplay ? "opacity-75" : "opacity-100"
              )}
              style={{
                left: x,
                top: y,
                width: width,
                height: height,
                ...(onItemClick ? { cursor: 'pointer' } : {})
              }}
              onClick={() => onItemClick?.(item)}
            >
              {renderItem(item, isWide, aspectRatio, isLoaded || forceDisplay)}
            </div>
          );
        })}
        
        {/* Progress indicator for progressive loading */}
        {(isProgressiveReady || forceDisplay) && !isLayoutReady && (
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-gray-600 to-gray-800 h-1 opacity-75">
            <div 
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${skylineLayoutResult.loadingProgress}%` }}
            />
          </div>
        )}
        
        {/* Mobile timeout indicator */}
        {forceDisplay && !isLayoutReady && (
          <div className="absolute top-2 left-0 right-0 text-center">
            <div className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
              Images loading in background...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MasonryGallery; 