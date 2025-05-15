import React, { useState } from "react";
import { Submission } from "@/types/submission";
import { Thumbnail } from "@/components/ui/Thumbnail";
import { ImageViewer } from "./ImageViewer";

interface ImageGridProps {
  submissions: Submission[];
  columns?: number;
  gap?: number;
  aspectRatio?: "square" | "video" | "portrait" | string;
  className?: string;
}

/**
 * 图片网格组件，用于展示多张图片
 * 自适应不同屏幕尺寸，支持点击查看大图
 */
export function ImageGrid({ 
  submissions, 
  columns = 3, 
  gap = 4, 
  aspectRatio = "square",
  className 
}: ImageGridProps) {
  const [selectedImage, setSelectedImage] = useState<Submission | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const handleOpenImage = (submission: Submission) => {
    setSelectedImage(submission);
    setIsViewerOpen(true);
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

  return (
    <>
      <div className={`grid ${getGridColsClass()} ${getGapClass()} ${className || ""}`}>
        {submissions.map((submission) => (
          <div key={submission.id} className="group relative">
            <Thumbnail
              src={submission.imageUrl}
              alt={submission.description}
              fill={true}
              aspectRatio={aspectRatio}
              objectFit="cover"
              className="transition-all duration-300 group-hover:brightness-90"
              containerClassName="cursor-pointer"
              onClick={() => handleOpenImage(submission)}
              sizes={`(max-width: 640px) 100vw, (max-width: 768px) 50vw, ${columns > 3 ? '25vw' : '33vw'}`}
            />
            
            {/* 可选的图片标题或描述悬停效果 */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-end">
              <div className="p-3 w-full translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-white text-sm font-medium truncate drop-shadow-md">
                  {submission.description.split('\n')[0]}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 图片查看器 */}
      {selectedImage && (
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