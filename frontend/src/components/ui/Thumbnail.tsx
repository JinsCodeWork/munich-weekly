import React, { useState } from "react";
import Image from "next/image";
import { getThumbnailContainerStyles, getThumbnailImageStyles, aspectRatioVariants, objectFitVariants } from "@/styles/components/thumbnail";
import { createImageUrl } from "@/lib/utils";

export interface ThumbnailProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  containerClassName?: string;
  onClick?: () => void;
  priority?: boolean;
  sizes?: string;
  fill?: boolean;
  objectFit?: keyof typeof objectFitVariants;
  quality?: number;
  rounded?: boolean;
  aspectRatio?: keyof typeof aspectRatioVariants | string;
  unoptimized?: boolean;
  fallbackSrc?: string;
  showErrorMessage?: boolean;
  useImageOptimization?: boolean;
}

/**
 * Generic thumbnail component
 * Uses Next.js Image component for image optimization
 * Supports different sizes, ratios and style configurations
 */
export function Thumbnail({
  src,
  alt,
  width = 64,
  height = 64,
  className,
  containerClassName,
  onClick,
  priority = false,
  sizes,
  fill = false,
  objectFit = "cover",
  quality = 80,
  rounded = true,
  aspectRatio = "square",
  unoptimized = false,
  fallbackSrc = '/placeholder.jpg',
  showErrorMessage = false,
  useImageOptimization = true
}: ThumbnailProps) {
  const [hasError, setHasError] = useState(false);
  
  // 添加调试信息，在控制台中打印URL转换前后的结果
  if (src.includes('.r2.dev/')) {
    console.log('原始R2 URL:', src);
  }
  
  // 强制确保生产环境使用完整URL
  const isDevEnv = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  let processedSrc = src;
  
  // 如果是相对路径且不是开发环境，确保添加CDN域名
  if (!isDevEnv && processedSrc.startsWith('/')) {
    processedSrc = `https://img.munichweekly.art${processedSrc}`;
  }
  
  // 根据是否使用图像优化来处理图像URL
  const imageSrc = useImageOptimization && processedSrc.startsWith('/uploads/')
    ? createImageUrl(processedSrc, {
        width: fill ? undefined : width,
        height: fill ? undefined : height,
        quality,
        fit: objectFit === 'cover' ? 'cover' 
           : objectFit === 'contain' ? 'contain'
           : 'contain'
      })
    : processedSrc;
  
  // 打印最终使用的URL
  if (src.includes('.r2.dev/') || src.startsWith('/uploads/')) {
    console.log('最终图片URL:', imageSrc);
  }
    
  const isLocalUpload = src.startsWith('/uploads/');

  const handleError = () => {
    setHasError(true);
    console.error('图片加载失败:', imageSrc);
  };

  return (
    <div
      className={getThumbnailContainerStyles({
        rounded,
        fill,
        aspectRatio,
        className: containerClassName
      })}
      onClick={onClick}
      style={fill ? undefined : { width, height }}
    >
      <Image
        src={hasError ? fallbackSrc : imageSrc}
        alt={alt}
        className={getThumbnailImageStyles({
          objectFit,
          isClickable: !!onClick,
          className: `${className} ${hasError ? 'opacity-50' : ''}`
        })}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={sizes || (fill ? "100vw" : undefined)}
        priority={priority}
        quality={quality}
        unoptimized={isLocalUpload || unoptimized}
        onError={handleError}
      />
      {hasError && showErrorMessage && (
        <div className="absolute inset-0 flex items-center justify-center text-red-500">
          Loading Failed
        </div>
      )}
    </div>
  );
} 