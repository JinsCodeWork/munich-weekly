/**
 * MasonryGrid Component
 * 
 * A responsive masonry layout component using CSS columns for optimal performance.
 * Automatically handles wide image detection and column spanning.
 * 
 * Features:
 * - CSS columns-based layout (better performance than JavaScript solutions)
 * - Responsive: 2 columns on mobile, 4 columns on desktop
 * - Automatic wide image detection (≥16:9 aspect ratio)
 * - Break-inside-avoid for proper item rendering
 * - Customizable gap and styling
 */

import React from 'react';
import { getMasonryLayoutStyles } from '@/styles/components/masonry';
import { cn } from '@/lib/utils';

export interface MasonryGridProps {
  children: React.ReactNode;
  
  /**
   * Gap between masonry items (in Tailwind spacing units)
   * @default 4
   */
  gap?: number;
  
  /**
   * Additional CSS classes for the container
   */
  className?: string;
  
  /**
   * Custom column configuration (optional, uses responsive defaults)
   * @default { mobile: 2, desktop: 4 }
   */
  columns?: {
    mobile: number;
    desktop: number;
  };
  
  /**
   * Loading state indicator
   */
  isLoading?: boolean;
  
  /**
   * Empty state content when no children
   */
  emptyState?: React.ReactNode;
}

/**
 * MasonryGrid - Main masonry layout component
 * 
 * @example
 * ```tsx
 * <MasonryGrid gap={6}>
 *   {submissions.map(submission => (
 *     <SubmissionCard key={submission.id} submission={submission} />
 *   ))}
 * </MasonryGrid>
 * ```
 */
export function MasonryGrid({
  children,
  gap = 4,
  className,
  columns = { mobile: 2, desktop: 4 },
  isLoading = false,
  emptyState,
}: MasonryGridProps) {
  
  // Count children to determine if we should show empty state
  const childrenCount = React.Children.count(children);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full">
        <MasonryLoadingSkeleton gap={gap} columns={columns} />
      </div>
    );
  }
  
  // Show empty state if no children
  if (childrenCount === 0) {
    return (
      <div className="w-full">
        {emptyState || <DefaultEmptyState />}
      </div>
    );
  }

  return (
    <div
      className={getMasonryLayoutStyles({
        columnCount: columns.desktop,
        className,
      })}
      style={{ gap: `${gap * 4}px` }}
    >
      {children}
    </div>
  );
}

/**
 * Loading skeleton for masonry grid
 * Shows placeholder items while content is loading
 */
function MasonryLoadingSkeleton({ 
  gap, 
  columns 
}: { 
  gap: number; 
  columns: { mobile: number; desktop: number };
}) {
  // Generate skeleton items (show more on desktop)
  const skeletonCount = typeof window !== 'undefined' && window.innerWidth >= 1024 
    ? columns.desktop * 2 
    : columns.mobile * 3;
    
  const skeletonItems = Array.from({ length: skeletonCount }, (_, index) => (
    <div
      key={`skeleton-${index}`}
      className="animate-pulse"
    >
      <div className="bg-gray-200 rounded-lg overflow-hidden border border-gray-200">
        <div 
          className="w-full bg-gray-300"
          style={{ 
            // Random heights for more realistic skeleton
            height: `${180 + (index % 3) * 60}px` 
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
      className={getMasonryLayoutStyles({ columnCount: columns.desktop })}
      style={{ gap: `${gap * 4}px` }}
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
      <div className="mx-auto h-12 w-12 text-gray-400">
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
      <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions</h3>
      <p className="mt-1 text-sm text-gray-500">
        No submissions are currently available for display.
      </p>
    </div>
  );
}

/**
 * MasonryItem wrapper component for individual masonry items
 * Handles the break-inside-avoid and spacing automatically
 * 
 * @example
 * ```tsx
 * <MasonryGrid>
 *   <MasonryItem isWideImage={true}>
 *     <SubmissionCard submission={submission} />
 *   </MasonryItem>
 * </MasonryGrid>
 * ```
 */
export function MasonryItem({
  children,
  isWideImage = false,
  className,
}: {
  children: React.ReactNode;
  isWideImage?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // Grid item spanning for wide images
        isWideImage && 'col-span-2',
        className
      )}
    >
      {children}
    </div>
  );
}

export default MasonryGrid; 