import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { getThumbnailContainerStyles, getThumbnailImageStyles, aspectRatioVariants, objectFitVariants, detectAspectRatio } from "@/styles/components/thumbnail";
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
  aspectRatio?: keyof typeof aspectRatioVariants | string | 'auto';
  unoptimized?: boolean;
  fallbackSrc?: string;
  showErrorMessage?: boolean;
  useImageOptimization?: boolean;
  autoDetectAspectRatio?: boolean;
  preserveAspectRatio?: boolean;
}

/**
 * Generic thumbnail component
 * Uses Next.js Image component for image optimization
 * Supports different sizes, ratios and style configurations
 * Now includes automatic aspect ratio detection for better display of various image sizes
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
  objectFit = "contain",
  quality = 80,
  rounded = true,
  aspectRatio = "auto",
  unoptimized = false,
  fallbackSrc = '/placeholder.svg',
  showErrorMessage = false,
  useImageOptimization = true,
  autoDetectAspectRatio = true,
  preserveAspectRatio = true
}: ThumbnailProps) {
  const [hasError, setHasError] = useState(false);
  const [detectedRatio, setDetectedRatio] = useState<keyof typeof aspectRatioVariants | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // 检查src是否为空或无效
  const isValidSrc = src && src.trim() !== '';
  
  // 获取处理后的图片源 - 使用useCallback优化
  const getProcessedSrc = useCallback(() => {
    if (!isValidSrc) return fallbackSrc;
    
    const isDevEnv = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    let processedSrc = src;
    
    // 如果是相对路径且不是开发环境，确保添加CDN域名
    if (!isDevEnv && processedSrc.startsWith('/')) {
      processedSrc = `https://img.munichweekly.art${processedSrc}`;
    }
    
    return processedSrc;
  }, [src, isValidSrc, fallbackSrc]);
  
  // 图片尺寸检测
  useEffect(() => {
    if (!isValidSrc || !autoDetectAspectRatio) return;
    
    const img = new window.Image();
    img.onload = () => {
      const detected = detectAspectRatio(img.naturalWidth, img.naturalHeight);
      setDetectedRatio(detected);
      setImageLoaded(true);
      console.log(`图片尺寸检测: ${img.naturalWidth}x${img.naturalHeight}, 检测到比例: ${detected}`);
    };
    img.onerror = () => {
      setImageLoaded(true);
    };
    
    // 使用处理过的图片源进行检测
    const processedSrc = getProcessedSrc();
    img.src = processedSrc;
  }, [src, autoDetectAspectRatio, isValidSrc, getProcessedSrc]);
  
  // 确定最终使用的宽高比
  const finalAspectRatio = (() => {
    if (aspectRatio !== 'auto') return aspectRatio;
    if (detectedRatio && autoDetectAspectRatio) return detectedRatio;
    return 'square'; // 后备选项
  })();
  
  // 确定最终使用的objectFit
  const finalObjectFit = (() => {
    if (!preserveAspectRatio) return objectFit;
    
    // 如果需要保持原图比例，根据容器和图片比例关系选择合适的fit模式
    if (detectedRatio) {
      // 对于竖图 (9:16, 3:4 等)，如果容器不是竖向的，使用contain避免裁剪
      if (['tallportrait', 'portrait'].includes(detectedRatio)) {
        if (!['tallportrait', 'portrait'].includes(finalAspectRatio as string)) {
          return 'contain';
        }
      }
      
      // 对于横图，如果容器不是横向的，使用contain避免裁剪
      if (['widescreen', 'landscape', 'ultrawide', 'cinema'].includes(detectedRatio)) {
        if (!['widescreen', 'landscape', 'ultrawide', 'cinema'].includes(finalAspectRatio as string)) {
          return 'contain';
        }
      }
    }
    
    return objectFit;
  })();
  
  // 如果src为空或无效，直接使用fallback图片
  if (!isValidSrc) {
    console.warn('Thumbnail: Invalid or empty src provided, using fallback image');
    return (
      <div
        className={getThumbnailContainerStyles({
          rounded,
          fill,
          aspectRatio: finalAspectRatio,
          className: containerClassName
        })}
        onClick={onClick}
        style={fill ? undefined : { width, height }}
      >
        <Image
          src={fallbackSrc}
          alt={alt || 'Image not available'}
          className={getThumbnailImageStyles({
            objectFit: finalObjectFit,
            isClickable: !!onClick,
            className: `${className} opacity-50`
          })}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          sizes={sizes || (fill ? "100vw" : undefined)}
          priority={priority}
          quality={quality}
          unoptimized={true}
        />
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs">
          No Image
        </div>
      </div>
    );
  }
  
  const processedSrc = getProcessedSrc();
  
  // 根据是否使用图像优化来处理图像URL
  const imageSrc = useImageOptimization && processedSrc.startsWith('/uploads/')
    ? createImageUrl(processedSrc, {
        width: fill ? undefined : width,
        height: fill ? undefined : height,
        quality,
        // 优化fit参数：对于preserve模式使用contain，否则使用scale-down作为安全选择
        fit: preserveAspectRatio ? 'contain' : 
             (finalObjectFit === 'cover' ? 'scale-down' : 'contain')
      })
    : processedSrc;
  
  // 打印最终使用的参数（调试用）
  if (src.includes('.r2.dev/') || src.startsWith('/uploads/')) {
    console.log('Thumbnail参数:', {
      src: src.substring(0, 50) + '...',
      detectedRatio,
      finalAspectRatio,
      finalObjectFit,
      preserveAspectRatio,
      imageSrc: imageSrc.substring(0, 80) + '...'
    });
  }
    
  const isLocalUpload = src.startsWith('/uploads/');

  const handleError = () => {
    setHasError(true);
    console.error('图片加载失败:', imageSrc);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div
      className={getThumbnailContainerStyles({
        rounded,
        fill,
        aspectRatio: finalAspectRatio,
        className: containerClassName
      })}
      onClick={onClick}
      style={fill ? undefined : { width, height }}
    >
      {/* 加载指示器 */}
      {!imageLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
      
      <Image
        src={hasError ? fallbackSrc : imageSrc}
        alt={alt}
        className={getThumbnailImageStyles({
          objectFit: finalObjectFit,
          isClickable: !!onClick,
          className: `${className} ${hasError ? 'opacity-50' : ''} ${!imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`
        })}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={sizes || (fill ? "100vw" : undefined)}
        priority={priority}
        quality={quality}
        unoptimized={isLocalUpload || unoptimized}
        onError={handleError}
        onLoad={handleImageLoad}
      />
      {hasError && showErrorMessage && (
        <div className="absolute inset-0 flex items-center justify-center text-red-500 text-xs">
          Loading Failed
        </div>
      )}
    </div>
  );
} 