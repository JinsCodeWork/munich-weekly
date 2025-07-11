import React, { useState } from "react";
import { Submission, SubmissionStatus } from "@/types/submission";
import { formatDate, getImageUrl } from "@/lib/utils";
import { ImageViewer } from "./ImageViewer";
import { Thumbnail } from "@/components/ui/Thumbnail";
import { StatusBadge } from "@/components/ui/Badge";
import { getSubmissionCardStyles, getSubmissionCardElementStyles } from "@/styles/components/card";
import { mapSubmissionStatusToBadge } from "@/styles/components/badge";
import { getMasonryItemStyles } from "@/styles/components/masonry";
import { VoteButton } from '@/components/voting/VoteButton';
import { useImageAspectRatio } from '@/hooks/useImageAspectRatio';
import { cn } from "@/lib/utils";

interface SubmissionCardProps {
  submission: Submission;
  className?: string;
  displayContext?: 'default' | 'voteView' | 'previousResults';
  onVoteSuccess?: (submissionId: number, newVoteCount?: number) => void;
  onVoteCancelled?: (submissionId: number, newVoteCount?: number) => void;
  /**
   * Layout mode - determines styling approach
   * 'masonry' applies masonry-specific styling with wide image detection
   * 'grid' uses traditional grid layout
   */
  layoutMode?: 'masonry' | 'grid';
}

/**
 * Card component for displaying submission content 
 * Includes thumbnail image, status badge, description and metadata
 * Enhanced with masonry layout support and intelligent wide image detection
 */
export function SubmissionCard({ 
  submission, 
  className, 
  displayContext = 'default', 
  onVoteSuccess, 
  onVoteCancelled,
  layoutMode = 'grid'
}: SubmissionCardProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  
  // Wide image detection for masonry layout
  const { imageData, handleImageLoad: onImageLoad } = useImageAspectRatio();
  const isWide = imageData.isWide;
  const isLoaded = imageData.isLoaded;

  const handleOpenViewer = () => {
    // 只有在有有效图片时才打开查看器
    if (hasValidImage) {
      setIsViewerOpen(true);
    }
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
  };

  /**
   * Handle image load for masonry layout optimization
   * Called when the thumbnail image finishes loading
   */
  const handleImageLoad = (width: number, height: number, aspectRatio: number) => {
    // Pass dimensions to the wide image detection hook
    onImageLoad(width, height);
    
    // Development logging for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('SubmissionCard Image Loaded:', {
        submissionId: submission.id,
        dimensions: `${width}x${height}`,
        aspectRatio: aspectRatio.toFixed(3),
        isWide: aspectRatio >= 16/9,
        layoutMode,
      });
    }
  };
  
  // Process the image URL to ensure it has the correct server prefix
  const imageUrl = submission.imageUrl;
  
  // 检查imageUrl是否为空或无效
  const hasValidImage = imageUrl && imageUrl.trim() !== '';
  
  // 只有在有有效图片URL时才处理URL
  const displayUrl = hasValidImage ? getImageUrl(imageUrl) : '';
  
  // 为查看大图准备的URL，不添加大小限制参数
  const fullImageUrl = hasValidImage ? getImageUrl(imageUrl) : '';
  


  // Determine if status badge should be shown based on context
  const showStatusBadge = 
    displayContext === 'default' || 
    (displayContext === 'voteView' && 
      (submission.status === SubmissionStatus.SELECTED || submission.isCover)) || // In voteView, only show 'selected' or 'cover' badge
    (displayContext === 'previousResults' && 
      (submission.status === SubmissionStatus.SELECTED || submission.isCover)); // In previousResults, only show 'selected' or 'cover' badge

  // Prevent vote button click events from bubbling up
  const handleButtonContainerClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  // Determine container styling based on layout mode
  const containerStyles = layoutMode === 'masonry' 
    ? getMasonryItemStyles({ 
        className
      })
    : getSubmissionCardStyles({ 
        isWide: isWide && isLoaded,
        layoutContext: 'default',
        className 
      });

  return (
    <>
      <div 
        className={containerStyles}
        onClick={handleOpenViewer}
      >
        {/* Image area */}
        <div 
          className={layoutMode === 'masonry' 
            ? getSubmissionCardElementStyles('imageContainerMasonry') 
            : getSubmissionCardElementStyles('imageContainer')
          }
          style={layoutMode === 'masonry' && isLoaded && imageData?.aspectRatio 
            ? { aspectRatio: imageData.aspectRatio.toString() }
            : undefined
          }
        >
          <Thumbnail
            src={displayUrl || '/placeholder.svg'}
            alt={submission.description}
            fill={true}
            
            // 🎯 性能优化：在瀑布流模式下优先使用存储的图片尺寸数据
            precomputedDimensions={layoutMode === 'masonry' && submission.imageWidth && submission.imageHeight ? {
              width: submission.imageWidth,
              height: submission.imageHeight,
              aspectRatio: submission.aspectRatio || (submission.imageWidth / submission.imageHeight)
            } : undefined}
            
            aspectRatio={layoutMode === 'masonry' ? 'auto' : 'square'}
            autoDetectAspectRatio={layoutMode === 'masonry' && (!submission.imageWidth || !submission.imageHeight)}
            preserveAspectRatio={layoutMode === 'masonry'}
            objectFit={layoutMode === 'masonry' ? 'contain' : 'cover'}
            objectPosition={layoutMode === 'grid' ? 'center' : undefined}
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, 384px"
            priority={false}
            unoptimized={imageUrl.startsWith('/uploads/')}
            showErrorMessage={true}
            fallbackSrc="/placeholder.svg"
            quality={85}
            onImageLoad={layoutMode === 'masonry' ? handleImageLoad : undefined}
          />
          
          {/* Status badge - conditional rendering */}
          {showStatusBadge && (
            <div className={getSubmissionCardElementStyles('badgeTopRight')}>
              <StatusBadge status={mapSubmissionStatusToBadge(submission.status)} />
            </div>
          )}
          
          {/* Cover badge - always show if submission.isCover is true, regardless of displayContext for this particular badge */}
          {submission.isCover && (
            <div className={getSubmissionCardElementStyles('badgeTopLeft')}>
              <StatusBadge status="cover" />
            </div>
          )}
        </div>

        {/* Content area - Reduce spacing on mobile */}
        <div className={cn(getSubmissionCardElementStyles('contentContainer'), "sm:py-4 py-1")}>
          <h3 className={cn(getSubmissionCardElementStyles('title'), "sm:text-lg text-base sm:mb-1 mb-0")}>
            {submission.description.split('\n')[0]}
          </h3>
          
          <p className={cn(getSubmissionCardElementStyles('description'), "hidden sm:block")}>
            {submission.description.split('\n').slice(1).join('\n')}
          </p>
          
          <div className={cn(getSubmissionCardElementStyles('metaContainer'), "sm:mt-3 mt-1")}>
            {displayContext === 'default' && (
              <>
                {/* Hide date and Issue info on mobile */}
                <div className={cn(getSubmissionCardElementStyles('metaItem'), "hidden sm:flex")}>
                  <span>{formatDate(submission.submittedAt)}</span>
                </div>
                
                <div className={cn(getSubmissionCardElementStyles('metaItem'), "hidden sm:flex")}>
                  <span>Issue {submission.issue.id}</span>
                </div>
                
                {/* Show only vote count on mobile */}
                <div className={cn(getSubmissionCardElementStyles('metaItem'), "sm:hidden w-full text-xs")}>
                  <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                  </svg>
                  <span>{submission.voteCount} votes</span>
                </div>
              </>
            )}
            
            {/* Vote count and VoteButton for voteView context */}
            {displayContext === 'voteView' ? (
              <div className={`${getSubmissionCardElementStyles('metaItem')} w-full flex items-center`}>
                <div className="flex-grow mr-2">
                  <span className="text-sm text-gray-700 font-medium whitespace-nowrap">
                    {submission.voteCount} votes
                  </span>
                </div>
                <div 
                  className="flex-shrink-0 z-10" 
                  onClick={handleButtonContainerClick}
                >
                  <VoteButton 
                    submissionId={submission.id} 
                    onVoteSuccess={onVoteSuccess}
                    onVoteCancelled={onVoteCancelled}
                    initialVoteCount={submission.voteCount}
                    className="sm:text-sm text-xs sm:py-2 py-1 min-w-[70px]"
                  />
                </div>
              </div>
            ) : displayContext === 'previousResults' ? (
              // Vote count display for previousResults context (read-only, no voting button)
              <div className={`${getSubmissionCardElementStyles('metaItem')} w-full flex items-center justify-center`}>
                <span className="text-sm text-gray-700 font-medium">
                  {submission.voteCount} votes
                </span>
              </div>
            ) : (
              // Default display for vote count when not in voteView or previousResults - only shown on non-mobile
              <div className={cn(getSubmissionCardElementStyles('metaItem'), "hidden sm:flex")}> 
                <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                </svg>
                <span>{submission.voteCount} votes</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 只有在有有效图片时才显示ImageViewer */}
      {hasValidImage && fullImageUrl && (
        <ImageViewer
          imageUrl={fullImageUrl}
          description={submission.description}
          isOpen={isViewerOpen}
          onClose={handleCloseViewer}
        />
      )}
    </>
  );
} 