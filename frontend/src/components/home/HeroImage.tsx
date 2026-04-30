import Image from 'next/image';
import { createImageUrl, cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface HeroImageProps {
  imageUrl: string;
  description: string;
  imageCaption?: string;
  className?: string;
  lastUpdated?: string | null; // 添加配置更新时间，用于破解图片缓存
}

/**
 * Large hero image component, displays description and bottom caption on hover
 * Supports click to show/hide text on mobile
 */
export function HeroImage({ imageUrl, description, imageCaption, className, lastUpdated }: HeroImageProps) {
  const [imgSrc, setImgSrc] = useState('');
  const [imgError, setImgError] = useState(false);
  const [isTextVisible, setIsTextVisible] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    if (typeof window !== 'undefined') {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Update image source when imageUrl, window size, or config update time changes
  useEffect(() => {
    try {
      const isLocalStaticImage = imageUrl.startsWith('/images/');
      
      // 处理图片URL，使用正确的缓存策略
      let url;
      if (isLocalStaticImage) {
        // Local static image: add timestamp to break cache if config was updated
        if (lastUpdated) {
          const timestamp = new Date(lastUpdated).getTime();
          url = `${imageUrl}?v=${timestamp}`;
        } else {
          // No update time, add current timestamp as fallback
          url = `${imageUrl}?v=${Date.now()}`;
        }
      } else {
        // 上传图片使用createImageUrl处理，针对移动端优化质量
        const isMobile = windowSize.width > 0 && windowSize.width < 768;
        const quality = isMobile ? 98 : 95; // 移动端使用更高质量
        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
        
        url = createImageUrl(imageUrl, { 
          quality, 
          dpr: Math.min(dpr, 3), // 提高DPR限制，支持更高分辨率设备
          format: 'auto', // 自动选择最佳格式
          fit: 'contain' // 确保hero图片不被裁剪
        });
        
        // For uploaded images, also add version parameter
        if (lastUpdated) {
          const timestamp = new Date(lastUpdated).getTime();
          url += (url.includes('?') ? '&' : '?') + `v=${timestamp}`;
        }
      }

      setImgSrc(url);
      setImgError(false);
    } catch {
      setImgError(true);
    }
  }, [imageUrl, windowSize, lastUpdated]);

  // Handle image load error
  const handleError = () => {
    if (!imgError) {
      // If custom image path failed to load, try loading default image
      setImgSrc('/placeholder.jpg');
      setImgError(true);
    }
  };

  // Handle click event (mainly for mobile devices)
  const handleClick = () => {
    // Only enable click toggle on mobile devices
    const isMobile = windowSize.width > 0 && windowSize.width < 768;
    if (isMobile) {
      setIsTextVisible(prev => !prev);
    }
  };

  return (
    <div 
      className={cn(
        "relative w-full h-[70vh] min-h-[500px] max-h-[800px] group overflow-hidden cursor-pointer md:cursor-default",
        isTextVisible && "text-active", // 添加激活类，用于移动端
        className
      )}
      onClick={handleClick}
    >
      {imgSrc ? (
        <Image
          src={imgSrc}
          fill
          priority
          alt="Munich Weekly Featured Photography"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          onError={handleError}
          unoptimized={imgSrc.startsWith('/images/')} // 本地静态图片不优化
          sizes="100vw" // 添加sizes属性以优化响应式图片
        />
      ) : (
        // 图片加载失败或没有URL时显示默认占位符
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <p className="text-gray-500">图片加载中或无法显示</p>
        </div>
      )}
      
      {/* 悬停时的暗色遮罩 - 同时支持移动端点击 */}
      <div className="absolute inset-0 bg-black/0 transition-all duration-500 
                      md:group-hover:bg-black/50 
                      text-active:bg-black/50"></div>
      
      {/* 中间主要描述文本 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="font-heading text-white text-center text-xl md:text-2xl lg:text-3xl font-bold italic px-6 max-w-3xl tracking-wide
                     opacity-0 transform translate-y-4 transition-all duration-500
                     md:group-hover:opacity-100 md:group-hover:translate-y-0
                     text-active:opacity-100 text-active:translate-y-0">
          {description}
        </p>
      </div>
      
      {/* 底部图片说明 */}
      {imageCaption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent py-6 px-4 md:px-8 
                        opacity-0 transform translate-y-6 transition-all duration-500
                        md:group-hover:opacity-100 md:group-hover:translate-y-0
                        text-active:opacity-100 text-active:translate-y-0">
          <div className="text-white/90 text-sm md:text-base text-right">
            <p className="font-sans font-light">{imageCaption}</p>
          </div>
        </div>
      )}
    </div>
  );
} 