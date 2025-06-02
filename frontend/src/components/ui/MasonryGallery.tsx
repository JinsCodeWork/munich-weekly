import React, { useState, useMemo, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useImageDimensions } from '@/hooks/useImageDimensions';
import { useSkylineMasonryLayout, type SkylineMasonryConfig } from '@/hooks/useSkylineMasonryLayout';
import { Button } from '@/components/ui/Button';

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
    <div className="text-center py-8">
      <p className="text-gray-500">No items to display</p>
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
  getSubmissionId: (item: T) => number; // Required for skyline API
  renderItem: (item: T, isWide: boolean, aspectRatio: number, isLoaded: boolean) => React.ReactNode;
  className?: string;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  errorComponent?: (errors: string[], onRetry: () => void) => React.ReactNode;
  onItemClick?: (item: T) => void;
  config?: Partial<SkylineMasonryConfig>;
  issueId: number; // Required for skyline API
}

/**
 * MasonryGallery - Skyline layout component with backend ordering + frontend positioning
 * 
 * Architecture:
 * - Backend calculates optimal item ordering for 2-col and 4-col layouts
 * - Frontend uses Skyline algorithm for precise pixel positioning
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
  
  // Use different configs based on layout mode
  const skylineConfig = useMemo(() => {
    return config || {};
  }, [config]);

  const [currentColumnCount] = useState<number>(4);
  const [currentGap] = useState<number>(12);

  // Frontend mode: Use image dimensions + skyline layout
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

  const frontendDimensionsResult = useImageDimensions(
    items.map(getItemImageUrl),
    { 
      batchSize,
      timeout,
      progressiveThreshold,
      enableProgressiveLoading: true,
    }
  );

  // **MOBILE DEBUG**: Log dimensions loading progress
  const lastProgressRef = useRef({ progressiveLoadedCount: 0, errorCount: 0, isProgressiveReady: false });
  
  useEffect(() => {
    const { isProgressiveReady, progressiveLoadedCount, errors } = frontendDimensionsResult;
    const current = { progressiveLoadedCount, errorCount: errors.length, isProgressiveReady };
    const last = lastProgressRef.current;
    
    // Only log errors for debugging - removed other logs for cleaner console
    if (errors.length > last.errorCount) {
      console.warn(`⚠️ Image loading errors:`, errors.slice(last.errorCount, errors.length));
    }
    
    lastProgressRef.current = current;
  }, [frontendDimensionsResult.isProgressiveReady, frontendDimensionsResult.isAllLoaded, frontendDimensionsResult.progressiveLoadedCount, frontendDimensionsResult.errors.length, isMobile]);

  // **FIX: Use direct access to latest dimensions**
  const skylineGetDimensions = useMemo(() => {
    return (item: T) => {
      const url = getItemImageUrl(item);
      const dimension = frontendDimensionsResult.dimensions.get(url);
      return dimension ? { 
        width: dimension.width, 
        height: dimension.height,
        isLoaded: dimension.isLoaded
      } : null;
    };
  }, [getItemImageUrl, frontendDimensionsResult.dimensions]);

  const skylineLayoutResult = useSkylineMasonryLayout(
    items,
    issueId,
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
  }, [isLayoutReady, isProgressiveReady, forceDisplay, skylineLayoutResult]);

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