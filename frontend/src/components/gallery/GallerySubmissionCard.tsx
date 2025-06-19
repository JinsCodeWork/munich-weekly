import React, { useState } from 'react';
import Image from 'next/image';
import { GallerySubmissionCardProps } from '@/api/gallery/types';
import { ImageViewer } from '@/components/submission/ImageViewer';

/**
 * Gallery Submission Card Component - Clean Design
 * Redesigned for pure image display with minimal text below
 * Includes full-screen image viewer functionality
 */
export default function GallerySubmissionCard({ 
  submission, 
  isHero = false,
  className = '' 
}: GallerySubmissionCardProps) {
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // 检查是否有有效图片
  const hasValidImage = submission.imageUrl && submission.imageUrl.trim() !== '';

  // 处理点击打开大图查看器
  const handleOpenViewer = () => {
    if (hasValidImage) {
      setIsViewerOpen(true);
    }
  };

  // 处理关闭大图查看器
  const handleCloseViewer = () => {
    setIsViewerOpen(false);
  };

  // Hero mode (cover image) - Clean with margins
  if (isHero) {
    return (
      <>
        <div className={`relative w-full ${className}`}>
          {/* Cover image with minimal margins for maximum size */}
          <div className="container mx-auto px-1 md:px-3 lg:px-6 py-4">
            <div className="relative w-full max-w-8xl mx-auto">
              {/* Calculate aspect ratio for responsive display */}
              <div 
                className="relative w-full overflow-hidden rounded-lg cursor-pointer hover:opacity-95 transition-opacity duration-300"
                style={{
                  aspectRatio: submission.aspectRatio ? submission.aspectRatio.toString() : '16/9'
                }}
                onClick={handleOpenViewer}
              >
                <Image
                  src={submission.imageUrl}
                  alt={submission.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 98vw, 95vw"
                  className={`object-cover transition-all duration-700 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  priority={true}
                  onLoad={() => setImageLoaded(true)}
                />
                
                {/* Loading placeholder */}
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
                )}

                {/* Hover overlay for visual feedback */}
                <div className="absolute inset-0 bg-black opacity-0 hover:opacity-10 transition-opacity duration-300" />
              </div>
              
              {/* Image info below - clean design */}
              <div className="mt-6 max-w-4xl mx-auto text-center">
                {/* Title */}
                <h2 className="text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-3">
                  {submission.title}
                </h2>
                
                {/* Author */}
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  By {submission.authorName}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Image Viewer for hero image */}
        {hasValidImage && (
          <ImageViewer
            imageUrl={submission.imageUrl}
            description={submission.description || submission.title}
            isOpen={isViewerOpen}
            onClose={handleCloseViewer}
          />
        )}
      </>
    );
  }

  // Regular submission - Vertical layout, much smaller than hero on desktop, full width on mobile
  return (
    <>
      <div className={`w-full ${className}`}>
        {/* Image container - much smaller than hero on desktop, full width on mobile */}
        <div className="relative w-full max-w-2xl mx-auto mb-6 px-1 md:px-0">
          <div 
            className="relative w-full overflow-hidden rounded-lg cursor-pointer hover:opacity-95 transition-opacity duration-300"
            style={{
              aspectRatio: submission.aspectRatio ? submission.aspectRatio.toString() : '4/3'
            }}
            onClick={handleOpenViewer}
          >
            <Image
              src={submission.imageUrl}
              alt={submission.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
              className={`object-cover transition-all duration-500 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
            
            {/* Loading placeholder */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
            )}

            {/* Hover overlay for visual feedback */}
            <div className="absolute inset-0 bg-black opacity-0 hover:opacity-10 transition-opacity duration-300" />
          </div>
          
          {/* Image info below */}
          <div className="mt-4 text-center">
            {/* Title */}
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {submission.title}
            </h3>
            
            {/* Author info */}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {submission.authorName}
            </p>
          </div>
        </div>
      </div>

      {/* Image Viewer for regular submission */}
      {hasValidImage && (
        <ImageViewer
          imageUrl={submission.imageUrl}
          description={submission.description || submission.title}
          isOpen={isViewerOpen}
          onClose={handleCloseViewer}
        />
      )}
    </>
  );
} 