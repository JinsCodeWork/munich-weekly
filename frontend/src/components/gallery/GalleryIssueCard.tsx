import React from 'react';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import { GalleryIssueCardProps } from '@/api/gallery/types';

/**
 * Gallery Issue Card Component - Simplified Design
 * 简洁的图片+标题展示，去除卡片样式，悬停效果包括图片变灰和标题下划线
 */
export default function GalleryIssueCard({ 
  issue, 
  className = '', 
  onClick 
}: GalleryIssueCardProps) {
  
  // 处理点击事件
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <>
      <div 
        className={`group relative cursor-pointer ${className}`}
        onClick={handleClick}
      >
        {/* 封面图片区域 */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700 mb-3">
          {issue.coverImageUrl ? (
            <Image
              src={issue.coverImageUrl}
              alt={`${issue.issue.title} 封面`}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover transition-all duration-300"
              priority={false}
            />
          ) : (
            // 默认封面设计
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-white/80" />
            </div>
          )}
          
          {/* 悬停遮罩层 */}
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
        </div>
        
        {/* 期刊标题 */}
        <div className="group-hover:cursor-pointer text-center">
          <h3 className="text-base font-medium text-gray-900 dark:text-white relative transition-colors group-hover:text-gray-700 dark:group-hover:text-gray-300 gallery-issue-title inline-block">
            {issue.issue.title}
          </h3>
        </div>
      </div>

      {/* Gallery Issue Hover Styles */}
      <style jsx global>{`
        .gallery-issue-title::after {
          content: '';
          position: absolute;
          height: 1px;
          bottom: -2px;
          left: 0;
          right: 0;
          background-color: currentColor;
          transform-origin: center;
          transition: transform 0.3s ease, opacity 0.3s ease;
          transform: scaleX(0);
          opacity: 0;
        }
        
        .group:hover .gallery-issue-title::after {
          transform: scaleX(1);
          opacity: 1;
        }
      `}</style>
    </>
  );
} 