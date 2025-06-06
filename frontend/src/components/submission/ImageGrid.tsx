import React, { useState } from "react";
import { Submission } from "@/types/submission";
import { Thumbnail } from "@/components/ui/Thumbnail";
import { ImageViewer } from "./ImageViewer";

interface ImageGridProps {
  submissions: Submission[];
  columns?: number;
  gap?: number;
  aspectRatio?: "square" | "video" | "portrait" | "auto" | "mixed" | string;
  className?: string;
  layoutMode?: 'uniform' | 'masonry' | 'adaptive';
}

/**
 * 图片网格组件，用于展示多张图片
 * 自适应不同屏幕尺寸，支持点击查看大图
 * 现在支持自动检测图片比例和智能布局
 */
export function ImageGrid({ 
  submissions, 
  columns = 3, 
  gap = 4, 
  aspectRatio = "auto",
  className,
  layoutMode = 'adaptive'
}: ImageGridProps) {
  const [selectedImage, setSelectedImage] = useState<Submission | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const handleOpenImage = (submission: Submission) => {
    // 只有在有有效图片时才打开查看器
    if (submission.imageUrl && submission.imageUrl.trim() !== '') {
      setSelectedImage(submission);
      setIsViewerOpen(true);
    }
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
  };

  // 计算网格列数的 Tailwind 类
  const getGridColsClass = () => {
    switch (columns) {
      case 1: return "grid-cols-1";
      case 2: return "grid-cols-1 sm:grid-cols-2";
      case 3: return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";
      case 4: return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
      case 5: return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
      default: return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";
    }
  };

  // 计算间距的 Tailwind 类
  const getGapClass = () => {
    switch (gap) {
      case 0: return "gap-0";
      case 1: return "gap-1";
      case 2: return "gap-2";
      case 3: return "gap-3";
      case 4: return "gap-4";
      case 5: return "gap-5";
      case 6: return "gap-6";
      case 8: return "gap-8";
      default: return "gap-4";
    }
  };

  // 根据布局模式确定容器类
  const getLayoutClass = () => {
    switch (layoutMode) {
      case 'uniform':
        return `grid ${getGridColsClass()} ${getGapClass()}`;
      case 'masonry':
        // Masonry布局需要特殊处理，这里先用grid代替
        return `grid ${getGridColsClass()} ${getGapClass()}`;
      case 'adaptive':
      default:
        // 自适应布局，根据内容调整
        return `grid ${getGridColsClass()} ${getGapClass()}`;
    }
  };

  // 为混合模式计算每个图片的宽高比
  const getItemAspectRatio = (index: number) => {
    if (aspectRatio !== 'mixed') return aspectRatio;
    
    // 混合模式：创建有趣的布局模式
    const patterns = ['square', 'portrait', 'landscape', 'widescreen'];
    return patterns[index % patterns.length];
  };

  // 智能选择objectFit策略
  const getObjectFitForItem = (submission: Submission, itemAspectRatio: string) => {
    // 如果没有图片URL，使用默认值
    if (!submission.imageUrl || submission.imageUrl.trim() === '') {
      return 'contain';
    }
    
    // 在网格布局中，我们通常希望减少空白，提供更紧凑的视觉效果
    // 但是需要根据图片类型做智能调整
    
    if (aspectRatio === 'auto') {
      // 自动模式：让Thumbnail组件自己决定
      return 'contain'; // 传递给Thumbnail，由其智能选择
    }
    
    // 对于固定容器比例，根据常见图片类型优化
    switch (itemAspectRatio) {
      case 'square':
        // 正方形容器：大多数图片都可以用cover以减少空白
        return 'cover';
      case 'widescreen':
      case 'video':
        // 16:9容器：适合横向图片，使用contain显示完整内容
        return 'contain';
      case 'tallportrait':
        // 9:16容器：适合竖向图片，可以用cover
        return 'cover';
      case 'landscape':
        // 4:3容器：平衡显示
        return 'contain';
      case 'portrait':
        // 3:4容器：竖向图片容器
        return 'cover';
      default:
        return 'contain';
    }
  };

  return (
    <>
      <div className={`${getLayoutClass()} ${className || ""}`}>
        {submissions.map((submission, index) => (
          <div key={submission.id} className="group relative">
            <Thumbnail
              src={submission.imageUrl || '/placeholder.svg'}
              alt={submission.description || 'No description'}
              fill={true}
              
              // 🎯 性能优化：优先使用存储的图片尺寸数据
              precomputedDimensions={submission.imageWidth && submission.imageHeight ? {
                width: submission.imageWidth,
                height: submission.imageHeight,
                aspectRatio: submission.aspectRatio || (submission.imageWidth / submission.imageHeight)
              } : undefined}
              
              aspectRatio={aspectRatio === 'mixed' ? getItemAspectRatio(index) : aspectRatio}
              objectFit={getObjectFitForItem(submission, getItemAspectRatio(index))}
              autoDetectAspectRatio={!submission.imageWidth || !submission.imageHeight}
              preserveAspectRatio={true}
              className="transition-all duration-300 group-hover:brightness-90"
              containerClassName="cursor-pointer"
              onClick={() => handleOpenImage(submission)}
              sizes={`(max-width: 640px) 100vw, (max-width: 768px) 50vw, ${columns > 3 ? '25vw' : '33vw'}`}
              showErrorMessage={true}
              fallbackSrc="/placeholder.svg"
              quality={85}
            />
            
            {/* 图片信息悬停效果 - 改进样式 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent 
                            opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end">
              <div className="p-3 w-full">
                <p className="text-white text-sm font-medium line-clamp-2 drop-shadow-md">
                  {submission.description.split('\n')[0]}
                </p>
                
                {/* 可选：显示图片尺寸信息（调试用） */}
                {process.env.NODE_ENV === 'development' && (
                  <p className="text-white/70 text-xs mt-1">
                    ID: {submission.id}
                  </p>
                )}
              </div>
            </div>

            {/* 加载状态指示 */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-black/50 text-white text-xs px-2 py-1 rounded">
                点击查看
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 图片查看器 */}
      {selectedImage && selectedImage.imageUrl && selectedImage.imageUrl.trim() !== '' && (
        <ImageViewer
          imageUrl={selectedImage.imageUrl}
          description={selectedImage.description}
          isOpen={isViewerOpen}
          onClose={handleCloseViewer}
        />
      )}
    </>
  );
} 