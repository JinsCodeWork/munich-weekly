import React, { useState, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useImageDimensions } from '@/hooks/useImageDimensions';
import { useSkylineMasonryLayout, type SkylineMasonryConfig } from '@/hooks/useSkylineMasonryLayout';

/**
 * Default loading skeleton component
 */
function DefaultLoadingSkeleton({ columns, gap }: { columns: number; gap: number }) {
  return (
    <div 
      className="grid gap-y-4 animate-pulse" 
      style={{ 
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`
      }}
    >
      {Array.from({ length: columns * 3 }).map((_, i) => (
        <div 
          key={i} 
          className="bg-gray-200 rounded-lg"
          style={{ height: Math.random() * 200 + 150 }}
        />
      ))}
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
      <button
        onClick={onRetry}
        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      >
        Retry
      </button>
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
  renderItem: (item: T, isWide: boolean, aspectRatio: number) => React.ReactNode;
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
 *   renderItem={(item, isWide, aspectRatio) => <Card ... />}
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
    { batchSize: 8, timeout: 8000 }
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

  // Determine current state based on layout mode
  const { isLayoutReady, hasErrors, handleRetry } = useMemo(() => {
    return {
      isLayoutReady: skylineLayoutResult.isLayoutReady,
      hasErrors: false, // Skyline mode has built-in fallbacks
      handleRetry: skylineLayoutResult.forceLayout
    };
  }, [skylineLayoutResult]);

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

  // Show loading state
  if (!isLayoutReady) {
    return (
      <div className={cn('w-full', className)}>
        {loadingComponent || <DefaultLoadingSkeleton columns={currentColumnCount} gap={currentGap} />}
      </div>
    );
  }

  // Render layout
  return (
    <div className={cn('w-full', className)}>
      <div 
        className="relative w-full overflow-hidden"
        style={{ height: skylineLayoutResult.containerHeight + 16 }}
      >
        {skylineLayoutResult.layoutItems.map((layoutItem) => {
          const { data: item, x, y, width, height, isWide, aspectRatio } = layoutItem;
          
          return (
            <div 
              key={layoutItem.id}
              className="absolute overflow-hidden"
              style={{
                left: x,
                top: y,
                width: width,
                height: height,
                ...(onItemClick ? { cursor: 'pointer' } : {})
              }}
              onClick={() => onItemClick?.(item)}
            >
              {renderItem(item, isWide, aspectRatio)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MasonryGallery; 