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
  video: 'aspect-video', // 16:9
  portrait: 'aspect-[3/4]', // 3:4
  landscape: 'aspect-[4/3]', // 4:3
  widescreen: 'aspect-[16/9]', // 16:9
  tallportrait: 'aspect-[9/16]', // 9:16 (手机竖图)
  ultrawide: 'aspect-[21/9]', // 21:9 超宽屏
  classic: 'aspect-[5/4]', // 5:4 经典照片比例
  cinema: 'aspect-[2.35/1]', // 电影宽屏比例
  auto: '', // 自动适应，不强制比例
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
 * Object position variations for image content
 */
export const objectPositionVariants = {
  center: 'object-center',
  top: 'object-top',
  bottom: 'object-bottom',
  left: 'object-left',
  right: 'object-right',
  'top-left': 'object-left-top',
  'top-right': 'object-right-top',
  'bottom-left': 'object-left-bottom',
  'bottom-right': 'object-right-bottom',
};

/**
 * 根据图片尺寸自动检测最适合的宽高比
 * @param width - 图片宽度
 * @param height - 图片高度
 * @returns 最适合的宽高比类型
 */
export function detectAspectRatio(width: number, height: number): keyof typeof aspectRatioVariants {
  if (!width || !height) return 'square';
  
  const ratio = width / height;
  
  // 定义容差范围 - 为16:9使用更宽松但仍然精确的容差
  const moderateTolerance = 0.08; // 16:9的适中容差 (允许更多接近16:9的图片)
  const normalTolerance = 0.1;    // 其他比例的正常容差
  const tightTolerance = 0.06;    // 为portrait/tallportrait使用更严格的容差
  
  if (Math.abs(ratio - 1) < normalTolerance) return 'square'; // 1:1
  if (Math.abs(ratio - 16/9) < moderateTolerance) return 'widescreen'; // 16:9 (适中)
  if (Math.abs(ratio - 9/16) < normalTolerance) return 'tallportrait'; // 9:16
  if (Math.abs(ratio - 4/3) < normalTolerance) return 'landscape'; // 4:3
  if (Math.abs(ratio - 3/4) < tightTolerance) return 'portrait'; // 3:4 (使用更严格的容差)
  if (Math.abs(ratio - 21/9) < normalTolerance) return 'ultrawide'; // 21:9
  if (Math.abs(ratio - 5/4) < normalTolerance) return 'classic'; // 5:4
  if (Math.abs(ratio - 2.35) < normalTolerance) return 'cinema'; // 电影比例
  
  // 如果不匹配任何预设比例，根据宽高关系选择最接近的
  if (ratio > 2.1) return 'ultrawide'; // 21:9及以上的超宽图片
  if (ratio > 1.9) return 'cinema';    // 1.9-2.1之间的电影比例图片
  if (ratio > 1.6) return 'widescreen'; // 1.6-1.9之间的宽屏图片（包括16:9）
  if (ratio > 1.1) return 'landscape'; // 1.1-1.6之间的横向图片
  if (ratio > 0.9) return 'square'; // 接近正方形
  
  // 优化竖图检测：为portrait和tallportrait提供更精确的边界
  // 3:4 = 0.75, 9:16 = 0.5625
  // 3648/5472 ≈ 0.667 应该被分类为tallportrait
  if (ratio > 0.69) return 'portrait'; // 0.69-0.9 为portrait范围（比3:4稍宽的竖图）
  
  return 'tallportrait'; // 0.69以下的所有竖图都归为tallportrait
}

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
  objectPosition = 'center',
  isClickable = false,
  className,
}: {
  objectFit?: keyof typeof objectFitVariants;
  objectPosition?: keyof typeof objectPositionVariants;
  isClickable?: boolean;
  className?: string;
} = {}) {
  return cn(
    objectFitVariants[objectFit],
    objectPositionVariants[objectPosition],
    isClickable && 'cursor-pointer',
    className
  );
} 