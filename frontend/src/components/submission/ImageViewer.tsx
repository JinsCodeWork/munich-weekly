import React, { useEffect, useMemo, useState, useRef } from "react";
import { getImageCaptionStyles } from '@/styles';
import Image from "next/image";
import { createImageUrl } from "@/lib/utils";
import { useGesture } from '@use-gesture/react';
import useMeasure from 'react-use-measure';

interface ImageViewerProps {
  imageUrl: string;
  description: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * A fullscreen image viewer component with zoom and pan functionality
 * Displays high resolution images with optional captions
 * Supports double-tap to zoom and drag to pan on mobile devices
 */
export function ImageViewer({ imageUrl, description, isOpen, onClose }: ImageViewerProps) {
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0, isPortrait: false });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [ref, bounds] = useMeasure();
  const lastTapRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialPosRef = useRef({ x: 0, y: 0 });
  const initialScaleRef = useRef(1);

  // 检查imageUrl是否有效
  const hasValidImage = imageUrl && imageUrl.trim() !== '';
  
  // 防止背景滚动，但保留文本区域滚动
  useEffect(() => {
    if (isOpen) {
      // 记录当前滚动位置
      const scrollY = window.scrollY;
      
      // 设置body样式防止滚动
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // 恢复body滚动
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        
        // 恢复滚动位置
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);
  
  // 如果没有有效图片，直接关闭viewer
  useEffect(() => {
    if (isOpen && !hasValidImage) {
      console.warn('ImageViewer: No valid image URL provided, closing viewer');
      onClose();
    }
  }, [isOpen, hasValidImage, onClose]);

  // Create high quality image URL (without specifying width/height, letting the Worker adapt based on the original image and screen)
  const highQualityUrl = useMemo(() => {
    if (!hasValidImage) return '';
    
    // For uploaded images, add high quality parameters without limiting dimensions
    if (imageUrl.startsWith('/uploads/') || imageUrl.includes('.r2.dev/')) {
      return createImageUrl(imageUrl, {
        quality: 95,
        format: 'auto', // Use the best format supported by the client
        fit: 'contain' // 强制使用contain，确保完整显示图片
      });
    }
    
    // For external images, use the original URL
    return imageUrl;
  }, [imageUrl, hasValidImage]);
  
  // Preload image to get dimension information
  useEffect(() => {
    if (isOpen && highQualityUrl) {
      const img = new window.Image();
      img.onload = () => {
        const isPortrait = img.naturalHeight > img.naturalWidth;
        setImgDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight,
          isPortrait
        });
      };
      img.src = highQualityUrl;
    }
    
    // Reset zoom and position when opening
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsTransitioning(false);
    }
  }, [isOpen, highQualityUrl]);
  
  // Determine caption style based on description length
  const captionStyle = useMemo(() => {
    if (!description) return null;
    
    const length = description.trim().length;
    
    if (length < 60) {
      return { variant: 'default' as const, maxWidth: 'max-w-[90%]', textAlign: 'center' as const };
    } else if (length < 120) {
      return { variant: 'default' as const, maxWidth: 'max-w-[90%]', textAlign: 'center' as const };
    } else {
      return { variant: 'card' as const, maxWidth: 'max-w-[90%]', textAlign: 'left' as const };
    }
  }, [description]);
  
  // Handle image load completion
  const handleImageLoad = () => {
    setImgLoaded(true);
  };
  
  // Handle Escape key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);
  
  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle double tap for zoom with smooth animation
  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // ms
    
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected - enable transition for smooth animation
      setIsTransitioning(true);
      setScale(scale === 1 ? 2.5 : 1);
      setPosition({ x: 0, y: 0 });
      
      // Remove transition after animation completes
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }
    
    lastTapRef.current = now;
  };

  // Set up gesture handlers
  useGesture(
    {
      onDrag: ({ movement: [mx, my], first }) => {
        if (scale > 1) {
          // Only allow dragging when zoomed in
          if (first) {
            // Store initial position on drag start
            initialPosRef.current = { ...position };
          }
          
          // Calculate bounds for dragging
          const maxX = (bounds.width * scale - bounds.width) / 2;
          const maxY = (bounds.height * scale - bounds.height) / 2;
          
          // Update position with boundaries
          setPosition({
            x: Math.max(-maxX, Math.min(maxX, initialPosRef.current.x + mx / scale)),
            y: Math.max(-maxY, Math.min(maxY, initialPosRef.current.y + my / scale))
          });
        }
      },
      onPinch: ({ offset: [s], first }) => {
        if (first) {
          // Reset position when starting a new pinch gesture
          initialScaleRef.current = scale;
        }
        
        const newScale = Math.max(1, Math.min(4, initialScaleRef.current * s));
        setScale(newScale);
        
        // If zooming out to scale 1, reset position
        if (newScale === 1) {
          setPosition({ x: 0, y: 0 });
        }
      },
      onClick: () => {
        handleDoubleTap();
      }
    },
    {
      target: containerRef,
      eventOptions: { passive: false }
    }
  );
  
  if (!isOpen) return null;

  // Calculate appropriate image dimensions
  const calculateImageDimensions = () => {
    const maxHeight = Math.min(window.innerHeight * 0.7, 800);
    const maxWidth = Math.min(window.innerWidth * 0.9, 1200);
    
    if (!imgDimensions.width || !imgDimensions.height) {
      return { width: maxWidth, height: maxHeight };
    }
    
    const aspectRatio = imgDimensions.width / imgDimensions.height;
    
    if (imgDimensions.isPortrait) {
      // Portrait image, prioritize height
      const height = maxHeight;
      const width = height * aspectRatio;
      return { width, height };
    } else {
      // Landscape image, prioritize width
      const width = maxWidth;
      const height = width / aspectRatio;
      return { width, height };
    }
  };

  const { width, height } = calculateImageDimensions();

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center bg-transparent rounded-lg overflow-hidden">
        {/* Close button */}
        <button 
          className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-80 z-10 transition-all"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Image help text for mobile devices */}
        <div className="absolute top-4 left-4 right-16 flex justify-center z-10 md:hidden">
          <div className="px-3 py-1 bg-black bg-opacity-60 text-white text-xs rounded-full">
            Double-tap to zoom, drag to pan
          </div>
        </div>
        
        {/* Image Container with gesture support */}
        <div 
          className="flex justify-center items-center flex-grow w-full overflow-hidden" 
          ref={containerRef}
          onClick={handleBackdropClick}
        >
          <div
            ref={ref}
            className={`relative flex justify-center items-center ${
              imgDimensions.isPortrait ? 'max-h-[65vh]' : 'max-w-full max-h-[65vh]'
            }`}
            style={{
              touchAction: scale > 1 ? 'none' : 'auto', // Disable browser touch actions when zoomed
            }}
          >
            {/* Use Next.js optimized Image component */}
            <div 
              className="relative"
              style={{ 
                width, 
                height,
                transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                transformOrigin: 'center center',
                // 修复：添加平滑动画效果，无论是放大还是缩小
                transition: isTransitioning || scale === 1 ? 'transform 0.3s ease-out' : 'none'
              }}
              onClick={(e) => e.stopPropagation()} // 防止点击图片时触发背景点击事件
            >
              <Image
                src={highQualityUrl}
                alt={description}
                className="rounded shadow-2xl"
                fill
                sizes="(max-width: 768px) 100vw, 1200px"
                style={{ objectFit: 'contain' }}
                quality={100}
                priority={true}
                onLoad={handleImageLoad}
                unoptimized={false} // Let Next.js optimize the image
              />
            </div>
            
            {/* Loading indicator */}
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
        
        {/* Description - fixed at the bottom, separate from the image */}
        {description && captionStyle && (
          <div className="w-full mt-4 flex justify-center flex-shrink-0" onClick={handleBackdropClick}>
            <div 
              className={getImageCaptionStyles({
                variant: captionStyle.variant,
                maxWidth: captionStyle.maxWidth
              })}
              onClick={(e) => e.stopPropagation()} // 防止点击文本区域时触发背景点击事件
            >
              <div 
                className={`text-white text-lg font-light leading-relaxed italic max-h-[25vh] overflow-y-auto overflow-x-hidden w-full px-1 custom-scrollbar ${captionStyle.textAlign === 'center' ? 'text-center' : 'text-left'}`} 
                onClick={(e) => e.stopPropagation()}
                style={{ 
                  textAlign: captionStyle.textAlign,
                  wordWrap: 'break-word', 
                  textOverflow: 'clip' 
                }}
              >
                &ldquo;{description.trim()}&rdquo;
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 