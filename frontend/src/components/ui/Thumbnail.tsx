import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

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
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  quality?: number;
  rounded?: boolean;
  aspectRatio?: "square" | "video" | "portrait" | string;
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
  // Calculate container style based on aspectRatio
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "square":
        return "aspect-square";
      case "video":
        return "aspect-video";
      case "portrait":
        return "aspect-[3/4]";
      default:
        return aspectRatio; // Support custom ratio classes like "aspect-[16/9]"
    }
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        rounded && "rounded",
        fill ? getAspectRatioClass() : "",
        containerClassName
      )}
      onClick={onClick}
      style={fill ? undefined : { width, height }}
    >
      <Image
        src={src}
        alt={alt}
        className={cn(
          `object-${objectFit}`,
          onClick && "cursor-pointer",
          className
        )}
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