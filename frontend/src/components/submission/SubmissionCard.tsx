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
  displayContext?: 'default' | 'voteView';
  onVoteSuccess?: (submissionId: number) => void;
}

/**
 * Card component for displaying submission content 
 * Includes thumbnail image, status badge, description and metadata
 */
export function SubmissionCard({ submission, className, displayContext = 'default', onVoteSuccess }: SubmissionCardProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const handleOpenViewer = () => {
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
  };
  
  // Process the image URL to ensure it has the correct server prefix
  const imageUrl = submission.imageUrl;
  const displayUrl = getImageUrl(imageUrl);
  
  // Check if this is a local upload (for rendering decisions)
  const isLocalUpload = imageUrl.startsWith('/uploads/');
  
  // Debug information
  console.log("SubmissionCard original URL:", imageUrl);
  console.log("SubmissionCard display URL:", displayUrl);

  // Determine if status badge should be shown based on context
  const showStatusBadge = 
    displayContext === 'default' || 
    (displayContext === 'voteView' && 
      (submission.status === SubmissionStatus.SELECTED || submission.isCover)); // In voteView, only show 'selected' or 'cover' badge

  return (
    <>
      <div 
        className={getSubmissionCardStyles(className)}
        onClick={handleOpenViewer}
      >
        {/* Image area */}
        <div className={getSubmissionCardElementStyles('imageContainer')}>
          {isLocalUpload ? (
            // Use standard img tag for local uploads
            <img
              src={displayUrl}
              alt={submission.description}
              className="w-full h-full object-cover"
            />
          ) : (
            // Use Thumbnail component for remote images
            <Thumbnail
              src={displayUrl}
              alt={submission.description}
              fill={true}
              objectFit="cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, 384px"
              priority={false}
            />
          )}
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

        {/* Content area */}
        <div className={cn(getSubmissionCardElementStyles('contentContainer'), "sm:py-4 py-2")}>
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
                  <i className={`fa-solid fa-calendar-days ${getSubmissionCardElementStyles('metaIcon')}`}></i>
                  <span>{formatDate(submission.submittedAt)}</span>
                </div>
                
                <div className={cn(getSubmissionCardElementStyles('metaItem'), "hidden sm:flex")}>
                  <i className={`fa-solid fa-book ${getSubmissionCardElementStyles('metaIcon')}`}></i>
                  <span>Issue {submission.issue.id}</span>
                </div>
                
                {/* 移动端只显示投票数 */}
                <div className={cn(getSubmissionCardElementStyles('metaItem'), "sm:hidden w-full text-xs")}>
                  <i className={`fa-solid fa-thumbs-up ${getSubmissionCardElementStyles('metaIcon')}`}></i>
                  <span>{submission.voteCount} votes</span>
                </div>
              </>
            )}
            
            {/* Vote count and VoteButton for voteView context */}
            {displayContext === 'voteView' ? (
              <div className={`${getSubmissionCardElementStyles('metaItem')} w-full flex justify-between items-center`}>
                <span className="text-sm text-gray-700 font-medium">
                  {submission.voteCount} votes
                </span>
                <VoteButton 
                  submissionId={submission.id} 
                  onVoteSuccess={onVoteSuccess} 
                  initialVoteCount={submission.voteCount}
                  className="ml-2 sm:text-sm text-xs sm:py-2 py-1"
                />
              </div>
            ) : (
              /* Default display for vote count when not in voteView - 只在非移动端显示 */
              <div className={cn(getSubmissionCardElementStyles('metaItem'), "hidden sm:flex")}>
                <i className={`fa-solid fa-thumbs-up ${getSubmissionCardElementStyles('metaIcon')}`}></i>
                <span>{submission.voteCount} votes</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      <ImageViewer 
        imageUrl={submission.imageUrl}
        description={submission.description}
        isOpen={isViewerOpen}
        onClose={handleCloseViewer}
      />
    </>
  );
} 