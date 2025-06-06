import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { getThumbnailContainerStyles, getThumbnailImageStyles, aspectRatioVariants, objectFitVariants, objectPositionVariants, detectAspectRatio } from "@/styles/components/thumbnail";
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
  objectPosition?: keyof typeof objectPositionVariants;
  quality?: number;
  rounded?: boolean;
  aspectRatio?: keyof typeof aspectRatioVariants | string | 'auto';
  unoptimized?: boolean;
  fallbackSrc?: string;
  showErrorMessage?: boolean;
  useImageOptimization?: boolean;
  autoDetectAspectRatio?: boolean;
  preserveAspectRatio?: boolean;
  /**
   * Callback function called when image loads with natural dimensions
   * Useful for masonry layouts that need aspect ratio information
   */
  onImageLoad?: (width: number, height: number, aspectRatio: number) => void;
  /**
   * 预计算的图片尺寸信息 - 优先级最高
   * 当提供此信息时，将跳过所有自动检测逻辑，直接使用存储的比例数据
   * @since v2.0 - Performance optimization for masonry layouts
   */
  precomputedDimensions?: {
    width: number;
    height: number;
    aspectRatio: number;
  };
  /**
   * 是否优先使用预计算数据
   * @default true
   */
  preferPrecomputedData?: boolean;
}

/**
 * Generic thumbnail component
 * Uses Next.js Image component for image optimization
 * Supports different sizes, ratios and style configurations
 * Now includes automatic aspect ratio detection for better display of various image sizes
 * Enhanced with onImageLoad callback for masonry layout support
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
  objectPosition,
  quality = 80,
  rounded = true,
  aspectRatio = "auto",
  unoptimized = false,
  fallbackSrc = '/placeholder.svg',
  showErrorMessage = false,
  useImageOptimization = true,
  autoDetectAspectRatio = true,
  preserveAspectRatio = true,
  onImageLoad,
  precomputedDimensions,
  preferPrecomputedData = true
}: ThumbnailProps) {
  const [hasError, setHasError] = useState(false);
  const [detectedRatio, setDetectedRatio] = useState<keyof typeof aspectRatioVariants | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // 响应式屏幕尺寸检测
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // 初始检查
    checkIsMobile();
    
    // 监听窗口大小变化
    window.addEventListener('resize', checkIsMobile);
    
    // 清理事件监听器
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
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
    // 🎯 性能优化：如果有预计算数据，直接使用，跳过检测
    if (precomputedDimensions && preferPrecomputedData) {
      const detectedType = detectAspectRatio(
        precomputedDimensions.width, 
        precomputedDimensions.height
      );
      setDetectedRatio(detectedType);
      setImageLoaded(true);
      
      // 触发回调，使用存储的精确数据
      if (onImageLoad) {
        onImageLoad(
          precomputedDimensions.width, 
          precomputedDimensions.height, 
          precomputedDimensions.aspectRatio
        );
      }
      
      // 调试日志：显示使用了预计算数据 - 减少日志频率
      if (process.env.NODE_ENV === 'development' && !detectedRatio) {
        console.log('Thumbnail: Using precomputed dimensions', {
          src: src.substring(0, 30) + '...',
          width: precomputedDimensions.width,
          height: precomputedDimensions.height,
          aspectRatio: precomputedDimensions.aspectRatio.toFixed(3),
          detectedType
        });
      }
      return;
    }
    
    // 原有逻辑：对于没有预计算数据的情况，使用自动检测
    if (!isValidSrc || !autoDetectAspectRatio) return;
    
    const img = new window.Image();
    img.onload = () => {
      const detected = detectAspectRatio(img.naturalWidth, img.naturalHeight);
      setDetectedRatio(detected);
      setImageLoaded(true);
      
      // Calculate actual aspect ratio and call callback if provided
      const actualAspectRatio = img.naturalWidth / img.naturalHeight;
      if (onImageLoad) {
        onImageLoad(img.naturalWidth, img.naturalHeight, actualAspectRatio);
      }
      
      // Debug log (can be removed in production)
      if (process.env.NODE_ENV === 'development') {
        console.log(`Thumbnail: Dynamic detection completed ${img.naturalWidth}x${img.naturalHeight}, ratio: ${detected}`);
      }
    };
    img.onerror = () => {
      setImageLoaded(true);
    };
    
    // 使用处理过的图片源进行检测
    const processedSrc = getProcessedSrc();
    img.src = processedSrc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // 🎯 优化依赖数组：只在关键数据变化时重新执行
    precomputedDimensions?.width, 
    precomputedDimensions?.height, 
    precomputedDimensions?.aspectRatio,
    preferPrecomputedData, 
    src, 
    autoDetectAspectRatio, 
    isValidSrc
    // 故意省略 detectedRatio, getProcessedSrc, onImageLoad 避免无限循环
    // getProcessedSrc 是稳定的 useCallback，onImageLoad 通常来自父组件且可能频繁变化
    // detectedRatio 是本组件的状态，加入会导致循环
  ]);
  
  // 确定最终使用的宽高比
  const finalAspectRatio = (() => {
    // 🎯 优先级1: 使用预计算的宽高比数据 (性能优化)
    if (precomputedDimensions && preferPrecomputedData) {
      const detectedType = detectAspectRatio(
        precomputedDimensions.width, 
        precomputedDimensions.height
      );
      // 如果指定了固定的 aspectRatio，使用指定的；否则使用检测到的类型
      return aspectRatio !== 'auto' ? aspectRatio : detectedType;
    }
    
    // 🎯 优先级2: 使用传入的固定 aspectRatio
    if (aspectRatio !== 'auto') return aspectRatio;
    
    // 🎯 优先级3: 使用自动检测的结果 (fallback for legacy data)
    if (detectedRatio && autoDetectAspectRatio) return detectedRatio;
    
    return 'square'; // 后备选项
  })();
  
  // 获取容器宽高比的数值
  const getContainerAspectRatio = (aspectRatio: string): number | null => {
    const ratioMap: Record<string, number> = {
      'square': 1,
      'portrait': 3/4,
      'landscape': 4/3,
      'widescreen': 16/9,
      'video': 16/9,
      'tallportrait': 9/16,
      'ultrawide': 21/9,
      'classic': 5/4,
      'cinema': 2.35
    };
    return ratioMap[aspectRatio] || null;
  };
  
  // 获取图片宽高比的数值
  const getImageAspectRatio = (detectedRatio: string): number | null => {
    const ratioMap: Record<string, number> = {
      'square': 1,
      'portrait': 3/4,
      'landscape': 4/3,
      'widescreen': 16/9,
      'video': 16/9,
      'tallportrait': 9/16,
      'ultrawide': 21/9,
      'classic': 5/4,
      'cinema': 2.35
    };
    return ratioMap[detectedRatio] || null;
  };
  
  // 确定最终使用的objectFit - 重新设计的智能选择逻辑
  const finalObjectFit = (() => {
    // 如果明确禁止保持原图比例，直接使用传入的objectFit
    if (preserveAspectRatio === false) return objectFit;
    
    // 如果检测到了图片比例，根据具体比例制定策略
    if (detectedRatio && autoDetectAspectRatio) {
      const containerAspectRatio = getContainerAspectRatio(finalAspectRatio as string);
      const imageAspectRatio = getImageAspectRatio(detectedRatio);
      
      // 新的优化策略：优先显示图片全貌，减少裁切
      switch (detectedRatio) {
        case 'widescreen': // 16:9 横图
        case 'ultrawide': // 21:9 超宽图
        case 'cinema': // 电影比例
          // 横向图片（包括16:9）优先完整显示，避免裁切
          return 'contain';
          
        case 'landscape': // 4:3 横图
        case 'classic': // 5:4 横图
          // 常见横向比例，优先完整显示
          if (finalAspectRatio === 'square') {
            // 在正方形容器中，稍微裁切以减少上下空白，但仍然优先显示主要内容
            return 'contain';
          }
          return 'contain'; // 其他情况完整显示
          
        case 'square': // 1:1 正方形
          // 正方形图片在任何容器中都尽量显示全图
          if (finalAspectRatio === 'square') {
            return 'cover'; // 同比例容器，可以填充
          }
          return 'contain'; // 其他容器完整显示
          
        case 'portrait': // 3:4 竖图
          // 竖图可以适度裁切来适应卡片布局
          if (finalAspectRatio === 'square') {
            return 'cover'; // 在正方形容器中裁切，适应卡片布局
          }
          if (finalAspectRatio === 'portrait') {
            return 'cover'; // 同比例容器，填充
          }
          // 其他情况也可以适度裁切，因为竖图影响显示效果
          return 'cover';
          
        case 'tallportrait': // 9:16 竖图
          // 对于超长竖图(如3648x5472)，如果容器比例和图片比例匹配，使用cover填充
          // 如果比例不匹配，使用contain显示完整图片
          if (containerAspectRatio && imageAspectRatio) {
            const ratioDifference = Math.abs(containerAspectRatio - imageAspectRatio) / Math.max(containerAspectRatio, imageAspectRatio);
            // 如果比例差异很小（< 5%），使用cover填充以避免灰色背景
            if (ratioDifference < 0.05) {
              return 'cover';
            }
          }
          // 比例差异较大时才使用contain
          return 'contain';
          
        default:
          // 对于其他比例，使用通用智能逻辑，偏向于显示完整图片
          if (containerAspectRatio && imageAspectRatio) {
            // 如果是横向图片（宽度大于高度），优先完整显示
            if (imageAspectRatio > 1.2) {
              return 'contain';
            }
            // 如果是竖向图片（高度大于宽度），始终裁切避免左右填充
            if (imageAspectRatio < 0.8) {
              return 'cover';
            }
            
            const ratioDifference = Math.abs(containerAspectRatio - imageAspectRatio) / Math.max(containerAspectRatio, imageAspectRatio);
            
            // 对于接近正方形的图片（0.8 <= 宽高比 <= 1.2）
            if (imageAspectRatio >= 0.8 && imageAspectRatio <= 1.2) {
              // 如果比例差异很小，使用cover填充
              if (ratioDifference < 0.1) {
                return 'cover';
              }
              // 否则根据容器比例决定：如果容器更偏向横向，显示完整图片
              if (containerAspectRatio > 1) {
                return 'contain';
              }
              // 如果容器偏向竖向，进行裁切
              return 'cover';
            }
          }
          
          // 默认情况：如果无法确定比例，根据检测到的比例类型决定
          // 这里已经排除了明确的横向和竖向情况，大概率是接近正方形的
          return 'contain';
          break;
      }
    }
    
    // 默认情况：优先显示完整图片
    return 'contain';
  })();
  
  // 确定最终使用的objectPosition - 智能定位逻辑
  const finalObjectPosition = (() => {
    // 如果用户明确指定了objectPosition，优先使用用户指定的
    if (objectPosition) return objectPosition;
    
    // 根据图片类型和objectFit来智能选择定位
    if (detectedRatio && autoDetectAspectRatio) {
      // 对于使用contain的横向图片，根据屏幕尺寸和图片比例决定定位
      if (finalObjectFit === 'contain') {
        switch (detectedRatio) {
          case 'widescreen': // 16:9 横图
            // 16:9图片在电脑端居中显示，移动端也居中显示
            return 'center';
            
          case 'ultrawide': // 21:9 超宽图
          case 'cinema': // 电影比例
            // 超宽图片始终居中显示
            return 'center';
            
          case 'landscape': // 4:3 横图
          case 'classic': // 5:4 横图
            // 移动端：所有横向图片都居中显示
            if (isMobile) {
              return 'center';
            }
            // 电脑端：4:3、5:4等图片使用top定位，避免上方留空下方裁切
            return 'top';
          
          case 'square': // 1:1 正方形
            // 正方形图片始终居中显示
            return 'center';
            
          case 'portrait': // 3:4 竖图
          case 'tallportrait': // 9:16 竖图
            // 竖图始终使用居中定位
            return 'center';
            
          default:
            // 其他情况根据宽高比和屏幕尺寸判断
            const imageAspectRatio = getImageAspectRatio(detectedRatio);
            if (imageAspectRatio && imageAspectRatio > 1.1) {
              // 横向图片
              if (isMobile) {
                return 'center'; // 移动端横向图片居中
              }
              // 电脑端：只有非常接近16:9的图片才居中，其他都向上对齐
              const sixteenNineRatio = 16/9; // ≈ 1.778
              const tolerance = 0.08; // 与detectAspectRatio保持一致的适中容差
              if (Math.abs(imageAspectRatio - sixteenNineRatio) <= tolerance) {
                return 'center'; // 接近16:9的图片居中
              }
              return 'top'; // 其他所有横向图片向上对齐
            }
            return 'center';
        }
      }
      
      // 对于cover的图片，一般使用center定位
      if (finalObjectFit === 'cover') {
        return 'center';
      }
    }
    
    // 默认居中定位
    return 'center';
  })();
  
  // 安全检查：确保finalObjectPosition是有效值
  const validPositions: (keyof typeof objectPositionVariants)[] = ['center', 'top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
  const safeObjectPosition = validPositions.includes(finalObjectPosition as keyof typeof objectPositionVariants) ? finalObjectPosition : 'center';
  
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
            objectPosition: safeObjectPosition,
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
  
  // 打印最终使用的参数（调试用） - 减少日志输出
  if (process.env.NODE_ENV === 'development' && 
      (src.includes('.r2.dev/') || src.startsWith('/uploads/')) &&
      precomputedDimensions) { // 只在使用预计算数据时输出一次
    const imageAspectRatio = detectedRatio ? getImageAspectRatio(detectedRatio) : null;
    const sixteenNineRatio = 16/9;
    const isCloseToSixteenNine = imageAspectRatio ? Math.abs(imageAspectRatio - sixteenNineRatio) <= 0.08 : false;
    
    console.log('Thumbnail参数 (预计算):', {
      src: src.substring(0, 50) + '...',
      detectedRatio,
      imageAspectRatio: imageAspectRatio ? imageAspectRatio.toFixed(3) : null,
      isCloseToSixteenNine,
      finalAspectRatio,
      finalObjectFit,
      finalObjectPosition,
      usingPrecomputed: !!precomputedDimensions
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
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      )}
      
      <Image
        src={hasError ? fallbackSrc : imageSrc}
        alt={alt}
        className={getThumbnailImageStyles({
          objectFit: finalObjectFit,
          objectPosition: safeObjectPosition,
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