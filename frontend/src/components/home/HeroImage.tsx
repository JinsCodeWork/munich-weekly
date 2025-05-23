import Image from 'next/image';
import { createImageUrl, cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface HeroImageProps {
  imageUrl: string;
  description: string;
  imageCaption?: string;
  className?: string;
}

/**
 * Large hero image component, displays description and bottom caption on hover
 * Supports click to show/hide text on mobile
 */
export function HeroImage({ imageUrl, description, imageCaption, className }: HeroImageProps) {
  const [imgSrc, setImgSrc] = useState('');
  const [imgError, setImgError] = useState(false);
  const [isTextVisible, setIsTextVisible] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [imageLoading, setImageLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

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

  // 当imageUrl或窗口大小改变时更新图片源
  useEffect(() => {
    try {
      console.log('图片URL:', imageUrl);
      
      // 重置加载状态
      setImageLoading(true);
      setImageLoaded(false);
      
      // 判断是本地静态图片还是上传图片
      const isLocalStaticImage = imageUrl.startsWith('/images/');
      
      // 处理图片URL，使用正确的缓存策略
      let url;
      if (isLocalStaticImage) {
        // 本地静态图片不添加时间戳，允许浏览器缓存
        url = imageUrl;
      } else {
        // 上传图片使用createImageUrl处理，针对移动端优化质量
        const isMobile = windowSize.width > 0 && windowSize.width < 768;
        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
        
        // 移动端使用更激进的高质量设置
        let quality, width;
        
        if (isMobile) {
          // 移动端：更高质量和更大尺寸
          quality = 99; // 最高质量
          width = Math.max(windowSize.width * dpr, 800); // 确保最小800px宽度
        } else {
          // 桌面端：平衡质量和性能
          quality = 92;
          width = undefined; // 让CDN自动选择合适尺寸
        }
        
        url = createImageUrl(imageUrl, { 
          quality,
          width,
          dpr: Math.min(dpr, 3), // 允许更高的DPR
          format: 'auto', // 自动选择最佳格式
          fit: 'cover' // 确保正确的裁剪方式
        });
        
        console.log('图片参数详情:', { 
          isMobile, 
          quality, 
          width, 
          dpr: Math.min(dpr, 3), 
          devicePixelRatio: dpr,
          windowWidth: windowSize.width 
        });
      }
      
      console.log('处理后的图片URL:', url);
      setImgSrc(url);
      setImgError(false);
    } catch (err) {
      console.error('图片URL处理出错:', err);
      setImgError(true);
      setImageLoading(false);
    }
  }, [imageUrl, windowSize]);

  // 处理图片加载完成
  const handleLoad = () => {
    console.log('图片加载完成');
    setImageLoading(false);
    setImageLoaded(true);
  };

  // 处理图片加载错误
  const handleError = () => {
    console.log('图片加载失败，尝试使用默认图片');
    setImageLoading(false);
    if (!imgError) {
      // 如果是自定义图片路径加载失败，尝试加载默认图片
      setImgSrc('/placeholder.jpg');
      setImgError(true);
    }
  };

  // 处理点击事件（主要用于移动设备）
  const handleClick = () => {
    // 只在移动设备上启用点击切换
    const isMobile = windowSize.width > 0 && windowSize.width < 768;
    if (isMobile) {
      setIsTextVisible(prev => !prev);
      console.log('移动端点击切换文字显示:', !isTextVisible);
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
      {/* 加载动画 - 在图片加载时显示 */}
      {imageLoading && (
        <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600 font-sans text-lg">Loading featured photography...</p>
        </div>
      )}
      
      {imgSrc ? (
        <Image
          src={imgSrc}
          fill
          priority
          alt="Munich Weekly Featured Photography"
          className={cn(
            "object-cover transition-all duration-700 group-hover:scale-105",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          onError={handleError}
          onLoad={handleLoad}
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
      
      {/* 中间主要描述文本 - 只在图片加载完成后显示 */}
      {imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="font-heading text-white text-center text-xl md:text-2xl lg:text-3xl font-bold italic px-6 max-w-3xl tracking-wide
                       opacity-0 transform translate-y-4 transition-all duration-500
                       md:group-hover:opacity-100 md:group-hover:translate-y-0
                       text-active:opacity-100 text-active:translate-y-0">
            {description}
          </p>
        </div>
      )}
      
      {/* 底部图片说明 - 只在图片加载完成后显示 */}
      {imageCaption && imageLoaded && (
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