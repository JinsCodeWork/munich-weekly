import React, { useEffect, useMemo, useState } from "react";
import { getImageCaptionStyles } from '@/styles';
import Image from "next/image";
import { createImageUrl } from "@/lib/utils";

interface ImageViewerProps {
  imageUrl: string;
  description: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 全屏图像查看器组件
 * 显示高分辨率图像和可选的说明文字
 */
export function ImageViewer({ imageUrl, description, isOpen, onClose }: ImageViewerProps) {
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0, isPortrait: false });
  const [imgLoaded, setImgLoaded] = useState(false);
  
  // 创建高质量大图URL（但不指定宽高，让Worker根据原图和屏幕适配）
  const highQualityUrl = useMemo(() => {
    if (!imageUrl) return '';
    
    // 对于上传的图片，添加高质量参数但不限制尺寸
    if (imageUrl.startsWith('/uploads/') || imageUrl.includes('.r2.dev/')) {
      return createImageUrl(imageUrl, {
        quality: 95,
        format: 'auto' // 使用客户端支持的最佳格式
      });
    }
    
    // 对于外部图片，直接使用原URL
    return imageUrl;
  }, [imageUrl]);
  
  // 预加载图片以获取尺寸信息
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
  }, [isOpen, highQualityUrl]);
  
  // 根据描述长度决定标题样式
  const captionStyle = useMemo(() => {
    if (!description) return null;
    
    const length = description.trim().length;
    
    if (length < 60) {
      return { variant: 'default' as const, maxWidth: 'max-w-lg' };
    } else if (length < 120) {
      return { variant: 'default' as const, maxWidth: 'max-w-2xl' };
    } else {
      return { variant: 'card' as const, maxWidth: 'max-w-3xl' };
    }
  }, [description]);
  
  // 图片加载完成
  const handleImageLoad = () => {
    setImgLoaded(true);
  };
  
  // 处理Escape键关闭
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
  
  // 处理背景点击关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  if (!isOpen) return null;

  // 计算合适的图片尺寸
  const calculateImageDimensions = () => {
    const maxHeight = Math.min(window.innerHeight * 0.7, 800);
    const maxWidth = Math.min(window.innerWidth * 0.9, 1200);
    
    if (!imgDimensions.width || !imgDimensions.height) {
      return { width: maxWidth, height: maxHeight };
    }
    
    const aspectRatio = imgDimensions.width / imgDimensions.height;
    
    if (imgDimensions.isPortrait) {
      // 竖向图片，高度优先
      const height = maxHeight;
      const width = height * aspectRatio;
      return { width, height };
    } else {
      // 横向图片，宽度优先
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
        
        {/* Image Container - 使用flex-1自动占用可用空间 */}
        <div className="flex justify-center items-center flex-1 w-full overflow-hidden">
          <div className={`relative flex justify-center items-center ${
            imgDimensions.isPortrait ? 'max-h-[70vh]' : 'max-w-full max-h-[70vh]'
          }`}>
            {/* 使用Next.js优化的Image组件 */}
            <div className="relative" style={{ width, height }}>
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
                unoptimized={false} // 让Next.js优化图片
              />
            </div>
            
            {/* 加载指示器 */}
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
        
        {/* Description - 固定在底部，与图片分离 */}
        {description && captionStyle && (
          <div className="mt-4 w-full flex justify-center">
            <div className={getImageCaptionStyles({
              variant: captionStyle.variant,
              maxWidth: captionStyle.maxWidth
            })}>
              <p className="text-white text-lg font-light leading-relaxed italic">
                &ldquo;{description.trim()}&rdquo;
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 