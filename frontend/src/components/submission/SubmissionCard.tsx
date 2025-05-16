import React, { useState } from "react";
import { Submission } from "@/types/submission";
import { formatDate, getImageUrl } from "@/lib/utils";
import { ImageViewer } from "./ImageViewer";
import { Thumbnail } from "@/components/ui/Thumbnail";
import { StatusBadge } from "@/components/ui/Badge";
import { getSubmissionCardStyles, getSubmissionCardElementStyles } from "@/styles/components/card";
import { mapSubmissionStatusToBadge } from "@/styles/components/badge";

interface SubmissionCardProps {
  submission: Submission;
  className?: string;
}

/**
 * Card component for displaying submission content 
 * Includes thumbnail image, status badge, description and metadata
 */
export function SubmissionCard({ submission, className }: SubmissionCardProps) {
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
              sizes="(max-width: 768px) 100vw, 384px"
              priority={false}
            />
          )}
          {/* Status badge */}
          <div className={getSubmissionCardElementStyles('badgeTopRight')}>
            <StatusBadge status={mapSubmissionStatusToBadge(submission.status)} />
          </div>
          
          {/* Cover badge */}
          {submission.isCover && (
            <div className={getSubmissionCardElementStyles('badgeTopLeft')}>
              <StatusBadge status="cover" />
            </div>
          )}
        </div>

        {/* Content area */}
        <div className={getSubmissionCardElementStyles('contentContainer')}>
          <h3 className={getSubmissionCardElementStyles('title')}>
            {submission.description.split('\n')[0]}
          </h3>
          
          <p className={getSubmissionCardElementStyles('description')}>
            {submission.description.split('\n').slice(1).join('\n')}
          </p>
          
          <div className={getSubmissionCardElementStyles('metaContainer')}>
            <div className={getSubmissionCardElementStyles('metaItem')}>
              <i className={`fa-solid fa-calendar-days ${getSubmissionCardElementStyles('metaIcon')}`}></i>
              <span>{formatDate(submission.submittedAt)}</span>
            </div>
            
            <div className={getSubmissionCardElementStyles('metaItem')}>
              <i className={`fa-solid fa-book ${getSubmissionCardElementStyles('metaIcon')}`}></i>
              <span>Issue {submission.issue.id}</span>
            </div>
            
            {/* Display vote count for all statuses */}
            <div className={getSubmissionCardElementStyles('metaItem')}>
              <i className={`fa-solid fa-thumbs-up ${getSubmissionCardElementStyles('metaIcon')}`}></i>
              <span>{submission.voteCount} votes</span>
            </div>
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