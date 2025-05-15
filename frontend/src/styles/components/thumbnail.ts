/**
 * Thumbnail component styles
 * Defines styles for image thumbnails and containers
 */

import { cn } from '@/lib/utils';

/**
 * Aspect ratio classes for different image formats
 */
export const aspectRatioVariants = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
  landscape: 'aspect-[4/3]',
  widescreen: 'aspect-[16/9]',
};

/**
 * Object fit variations for image content
 */
export const objectFitVariants = {
  cover: 'object-cover',
  contain: 'object-contain',
  fill: 'object-fill',
  none: 'object-none',
  scaleDown: 'object-scale-down',
};

/**
 * Get thumbnail container classes
 */
export function getThumbnailContainerStyles({
  rounded = true,
  fill = false,
  aspectRatio = 'square',
  className,
}: {
  rounded?: boolean;
  fill?: boolean;
  aspectRatio?: keyof typeof aspectRatioVariants | string;
  className?: string;
} = {}) {
  // Calculate aspect ratio class
  const aspectRatioClass = aspectRatio in aspectRatioVariants 
    ? aspectRatioVariants[aspectRatio as keyof typeof aspectRatioVariants]
    : aspectRatio; // Support custom ratio classes
  
  return cn(
    'relative overflow-hidden',
    rounded && 'rounded',
    fill ? aspectRatioClass : '',
    className
  );
}

/**
 * Get thumbnail image classes
 */
export function getThumbnailImageStyles({
  objectFit = 'cover',
  isClickable = false,
  className,
}: {
  objectFit?: keyof typeof objectFitVariants;
  isClickable?: boolean;
  className?: string;
} = {}) {
  return cn(
    objectFitVariants[objectFit],
    isClickable && 'cursor-pointer',
    className
  );
} 