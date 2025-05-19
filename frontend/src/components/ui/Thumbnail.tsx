import React, { useState } from "react";
import Image from "next/image";
import { getThumbnailContainerStyles, getThumbnailImageStyles, aspectRatioVariants, objectFitVariants } from "@/styles/components/thumbnail";

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
  showErrorMessage = false
}: ThumbnailProps) {
  const [hasError, setHasError] = useState(false);
  // 处理本地上传的图片路径
  const imageSrc = src;
  const isLocalUpload = src.startsWith('/uploads/');

  const handleError = () => {
    setHasError(true);
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