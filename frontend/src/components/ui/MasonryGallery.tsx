import React, { useState, useEffect, useMemo } from 'react';
import { cn, getImageUrl } from '@/lib/utils';
import { useImageDimensions } from '@/hooks/useImageDimensions';
import { useMasonryLayout, createDimensionsGetter, type MasonryConfig } from '@/hooks/useMasonryLayout';
import { CONTAINER_CONFIG } from '@/styles/components/container';

/**
 * Props for MasonryGallery component
 */
export interface MasonryGalleryProps<T = unknown> {
  items: T[];
  getImageUrl: (item: T) => string;
  renderItem: (item: T, isWide: boolean, aspectRatio: number) => React.ReactNode;
  className?: string;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  errorComponent?: (errors: string[], onRetry: () => void) => React.ReactNode;
  onItemClick?: (item: T) => void;
  config?: Partial<MasonryConfig>; // Custom masonry configuration
}

/**
 * Default loading skeleton component
 */
function DefaultLoadingSkeleton({ 
  columns, 
  gap 
}: { 
  columns: number; 
  gap: number;
}) {
  const skeletonItems = Array.from({ length: columns * 3 }, (_, index) => (
    <div key={`skeleton-${index}`} className="animate-pulse">
      <div className="bg-gray-200 rounded-lg overflow-hidden">
        <div 
          className="w-full bg-gray-300"
          style={{ 
            height: `${200 + (index % 4) * 50}px` 
          }}
        />
        <div className="p-4 space-y-2">
          <div className="h-4 bg-gray-300 rounded w-3/4" />
          <div className="h-3 bg-gray-300 rounded w-1/2" />
        </div>
      </div>
    </div>
  ));

  return (
    <div 
      className={cn(
        'grid auto-rows-max',
        columns === 2 ? 'grid-cols-2' : 
        columns === 3 ? 'grid-cols-3' : 
        columns === 4 ? 'grid-cols-4' : 'grid-cols-2 lg:grid-cols-4'
      )}
      style={{ gap: `${gap}px` }}
    >
      {skeletonItems}
    </div>
  );
}

/**
 * Default empty state component
 */
function DefaultEmptyState() {
  return (
    <div className="text-center py-12">
      <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
        <svg
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-2">No items to display</h3>
      <p className="text-sm text-gray-500">
        There are currently no items available to show in the gallery.
      </p>
    </div>
  );
}

/**
 * Default error component
 */
function DefaultErrorComponent({ 
  errors, 
  onRetry 
}: { 
  errors: string[]; 
  onRetry: () => void;
}) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto h-8 w-8 text-red-400 mb-4">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-2">
        Failed to load some images
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        {errors.length} image(s) failed to load. You can try again.
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      >
        Retry Failed Images
      </button>
    </div>
  );
}

/**
 * Loading progress component
 */
function LoadingProgress({ 
  progress, 
  loadedCount, 
  totalCount 
}: { 
  progress: number; 
  loadedCount: number; 
  totalCount: number;
}) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto max-w-xs">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Loading images...</span>
          <span>{loadedCount}/{totalCount}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-2">
          {Math.round(progress)}% complete
        </div>
      </div>
    </div>
  );
}

/**
 * Wide image wrapper component
 */
// NOTE: This component is currently unused but kept for potential future use
// function WideImageContainer({ 
//   children, 
//   className 
// }: { 
//   children: React.ReactNode; 
//   className?: string;
// }) {
//   return (
//     <div className={cn('col-span-2', className)}>
//       {children}
//     </div>
//   );
// }

/**
 * MasonryGallery - JavaScript-based masonry layout with wide image spanning
 * 
 * This component uses dynamic column height calculation to achieve true masonry layout
 * similar to Pinterest/Instagram. Wide images (aspect ratio >= 16:9) span two columns.
 * 
 * @example
 * ```tsx
 * <MasonryGallery
 *   items={submissions}
 *   getImageUrl={(item) => item.imageUrl}
 *   renderItem={(item, isWide, aspectRatio) => (
 *     <SubmissionCard submission={item} isWide={isWide} />
 *   )}
 * />
 * ```
 */
export function MasonryGallery<T = unknown>({
  items,
  getImageUrl: getItemImageUrl,
  renderItem,
  className,
  loadingComponent,
  emptyComponent,
  errorComponent,
  onItemClick,
  config,
}: MasonryGalleryProps<T>) {
  
  // Use custom config or fall back to default
  const masonryConfig = useMemo(() => {
    return config ? {
      ...CONTAINER_CONFIG.masonry,
      ...config
    } : CONTAINER_CONFIG.masonry;
  }, [config]);
  
  const [currentColumnCount, setCurrentColumnCount] = useState<number>(masonryConfig.columns.desktop);
  const [currentGap, setCurrentGap] = useState<number>(
    typeof masonryConfig.gap === 'number' ? masonryConfig.gap : masonryConfig.gap.desktop
  );

  // Track screen width for responsive column calculation and gap
  useEffect(() => {
    const updateResponsiveValues = () => {
      const width = window.innerWidth;
      let newColumnCount: number;
      let newGap: number;
      
      if (width < 768) {
        // Mobile
        newColumnCount = masonryConfig.columns.mobile;
        newGap = typeof masonryConfig.gap === 'number' ? masonryConfig.gap : masonryConfig.gap.mobile;
      } else if (width < 1024) {
        // Tablet
        newColumnCount = masonryConfig.columns.tablet;
        newGap = typeof masonryConfig.gap === 'number' ? masonryConfig.gap : masonryConfig.gap.tablet;
      } else {
        // Desktop
        newColumnCount = masonryConfig.columns.desktop;
        newGap = typeof masonryConfig.gap === 'number' ? masonryConfig.gap : masonryConfig.gap.desktop;
      }
      
      setCurrentColumnCount(newColumnCount);
      setCurrentGap(newGap);
    };

    updateResponsiveValues();
    window.addEventListener('resize', updateResponsiveValues);
    return () => window.removeEventListener('resize', updateResponsiveValues);
  }, [masonryConfig.columns.mobile, masonryConfig.columns.tablet, masonryConfig.columns.desktop, masonryConfig.gap]);

  // Extract image URLs for dimension loading
  const imageUrls = useMemo(() => {
    return items.map(item => {
      const url = getItemImageUrl(item);
      return getImageUrl(url); // Process URL through utility function
    });
  }, [items, getItemImageUrl]);

  // Load image dimensions
  const {
    dimensions,
    loadingProgress,
    isAllLoaded,
    errors,
    totalImages,
    loadedImages,
    retryFailedImages,
  } = useImageDimensions(imageUrls);

  // Create dimensions getter for masonry layout
  const getDimensions = useMemo(() => {
    return createDimensionsGetter<T>(
      (item: T) => {
        const url = getImageUrl(getItemImageUrl(item));
        const dimension = dimensions.get(url);
        if (!dimension) return null;
        return {
          width: dimension.width,
          height: dimension.height,
        };
      },
      (item: T) => {
        const url = getImageUrl(getItemImageUrl(item));
        const dimension = dimensions.get(url);
        return dimension?.isLoaded ?? false;
      }
    );
  }, [dimensions, getItemImageUrl]);

  // Calculate masonry layout using absolute positioning
  const {
    layoutItems,
    containerHeight,
    isLayoutReady,
  } = useMasonryLayout(items, {
    columnWidth: masonryConfig.columnWidth,
    gap: masonryConfig.gap,
    mobileColumns: masonryConfig.columns.mobile,
    tabletColumns: masonryConfig.columns.tablet,
    desktopColumns: masonryConfig.columns.desktop,
    wideImageThreshold: 16 / 9, // 1.778
    mobileBreakpoint: 768,
    tabletBreakpoint: 1024,
  }, getDimensions);

  // Show loading state
  if (!isAllLoaded) {
    return (
      <div className={cn('w-full', className)}>
        {loadingComponent || (
          <>
            <LoadingProgress 
              progress={loadingProgress} 
              loadedCount={loadedImages} 
              totalCount={totalImages} 
            />
            <DefaultLoadingSkeleton 
              columns={currentColumnCount} 
              gap={currentGap} 
            />
          </>
        )}
      </div>
    );
  }

  // Show empty state
  if (items.length === 0) {
    return (
      <div className={cn('w-full', className)}>
        {emptyComponent || <DefaultEmptyState />}
      </div>
    );
  }

  // Show error state if there are errors
  if (errors.length > 0) {
    return (
      <div className={cn('w-full', className)}>
        {errorComponent ? errorComponent(errors, retryFailedImages) : <DefaultErrorComponent errors={errors} onRetry={retryFailedImages} />}
      </div>
    );
  }

  // Show layout when ready
  if (!isLayoutReady) {
    return (
      <div className={cn('w-full', className)}>
        <DefaultLoadingSkeleton 
          columns={currentColumnCount} 
          gap={currentGap} 
        />
      </div>
    );
  }

  // Render absolute positioned masonry layout
  return (
    <div className={cn('w-full overflow-hidden', className)}>
      <div 
        className="relative w-full overflow-hidden"
        style={{ height: containerHeight }}
      >
        {layoutItems.map((layoutItem) => {
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