import React from "react";
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
  aspectRatio = "square"
}: ThumbnailProps) {
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
        src={src}
        alt={alt}
        className={getThumbnailImageStyles({
          objectFit,
          isClickable: !!onClick,
          className
        })}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={sizes || (fill ? "100vw" : undefined)}
        priority={priority}
        quality={quality}
      />
    </div>
  );
} 