import React, { useState } from "react";
import { Submission, SubmissionStatus } from "@/types/submission";
import { formatDate, getImageUrl } from "@/lib/utils";
import { ImageViewer } from "./ImageViewer";
import { Thumbnail } from "@/components/ui/Thumbnail";
import { StatusBadge } from "@/components/ui/Badge";
import { getSubmissionCardStyles, getSubmissionCardElementStyles } from "@/styles/components/card";
import { mapSubmissionStatusToBadge } from "@/styles/components/badge";
import { VoteButton } from '@/components/voting/VoteButton';
import { cn } from "@/lib/utils";

interface SubmissionCardProps {
  submission: Submission;
  className?: string;
  displayContext?: 'default' | 'voteView' | 'previousResults';
  onVoteSuccess?: (submissionId: number, newVoteCount?: number) => void;
  onVoteCancelled?: (submissionId: number, newVoteCount?: number) => void;
}

/**
 * Card component for displaying submission content 
 * Includes thumbnail image, status badge, description and metadata
 */
export function SubmissionCard({ submission, className, displayContext = 'default', onVoteSuccess, onVoteCancelled }: SubmissionCardProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const handleOpenViewer = () => {
    // 只有在有有效图片时才打开查看器
    if (hasValidImage) {
      setIsViewerOpen(true);
    }
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
  };
  
  // Process the image URL to ensure it has the correct server prefix
  const imageUrl = submission.imageUrl;
  
  // 检查imageUrl是否为空或无效
  const hasValidImage = imageUrl && imageUrl.trim() !== '';
  
  // 只有在有有效图片URL时才处理URL
  const displayUrl = hasValidImage ? getImageUrl(imageUrl) : '';
  
  // 为查看大图准备的URL，不添加大小限制参数
  const fullImageUrl = hasValidImage ? getImageUrl(imageUrl) : '';
  
  // Debug information
  console.log("SubmissionCard original URL:", imageUrl);
  console.log("SubmissionCard has valid image:", hasValidImage);
  console.log("SubmissionCard display URL:", displayUrl);

  // Determine if status badge should be shown based on context
  const showStatusBadge = 
    displayContext === 'default' || 
    (displayContext === 'voteView' && 
      (submission.status === SubmissionStatus.SELECTED || submission.isCover)) || // In voteView, only show 'selected' or 'cover' badge
    (displayContext === 'previousResults' && 
      (submission.status === SubmissionStatus.SELECTED || submission.isCover)); // In previousResults, only show 'selected' or 'cover' badge

  // 防止投票按钮点击事件冒泡
  const handleButtonContainerClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <>
      <div 
        className={getSubmissionCardStyles(className)}
        onClick={handleOpenViewer}
      >
        {/* Image area */}
        <div className={getSubmissionCardElementStyles('imageContainer')}>
          <Thumbnail
            src={displayUrl || '/placeholder.svg'}
            alt={submission.description}
            fill={true}
            aspectRatio="auto"
            objectFit="contain"
            autoDetectAspectRatio={true}
            preserveAspectRatio={true}
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, 384px"
            priority={false}
            unoptimized={imageUrl.startsWith('/uploads/')}
            showErrorMessage={true}
            fallbackSrc="/placeholder.svg"
            quality={85}
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

        {/* Content area - 减小移动端的间距 */}
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
                {/* 在移动端隐藏日期和Issue信息 */}
                <div className={cn(getSubmissionCardElementStyles('metaItem'), "hidden sm:flex")}>
                  <span>{formatDate(submission.submittedAt)}</span>
                </div>
                
                <div className={cn(getSubmissionCardElementStyles('metaItem'), "hidden sm:flex")}>
                  <span>Issue {submission.issue.id}</span>
                </div>
                
                {/* 移动端只显示投票数 */}
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