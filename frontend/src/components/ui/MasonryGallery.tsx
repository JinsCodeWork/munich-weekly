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

  const frontendDimensionsResult = useImageDimensions(
    items.map(getItemImageUrl),
    { 
      batchSize: 6, // Slightly increased for better balance between speed and mobile performance
      timeout: 6000, // Reduced timeout for faster mobile experience
      progressiveThreshold: Math.min(6, Math.ceil(items.length * 0.4)), // 40% or 6 items
      enableProgressiveLoading: true,
    }
  );

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

  // Performance tracking for progressive loading
  useEffect(() => {
    if (frontendDimensionsResult.isProgressiveReady && skylineLayoutResult.isProgressiveReady) {
      const progressiveTime = performance.now();
      console.log(`🚀 Progressive Layout Ready: ${progressiveTime.toFixed(2)}ms - ${frontendDimensionsResult.progressiveLoadedCount}/${frontendDimensionsResult.totalImages} images loaded`);
    }
    
    if (isLayoutReady) {
      const completeTime = performance.now();
      console.log(`✅ Complete Layout Ready: ${completeTime.toFixed(2)}ms - All ${frontendDimensionsResult.totalImages} images loaded`);
    }
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

  // Show loading state only if we don't have progressive content ready
  if (!isProgressiveReady && !isLayoutReady) {
    return (
      <div className={cn('w-full', className)}>
        {loadingComponent || <DefaultLoadingSkeleton columns={currentColumnCount} gap={currentGap} />}
      </div>
    );
  }

  // Render progressive or complete layout
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
                !isLoaded && !isLayoutReady ? "opacity-75" : "opacity-100"
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
              {renderItem(item, isWide, aspectRatio, isLoaded)}
            </div>
          );
        })}
        
        {/* Progress indicator for progressive loading */}
        {isProgressiveReady && !isLayoutReady && (
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-gray-600 to-gray-800 h-1 opacity-75">
            <div 
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${skylineLayoutResult.loadingProgress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default MasonryGallery; 