import React, { useState } from "react";
import { Submission, SubmissionStatus } from "@/types/submission";
import { formatDate, cn } from "@/lib/utils";
import { ImageViewer } from "./ImageViewer";
import { Thumbnail } from "@/components/ui/Thumbnail";

interface SubmissionCardProps {
  submission: Submission;
  className?: string;
}

export function SubmissionCard({ submission, className }: SubmissionCardProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Get badge style based on status
  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case SubmissionStatus.APPROVED:
        return (
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Approved
          </span>
        );
      case SubmissionStatus.REJECTED:
        return (
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Rejected
          </span>
        );
      case SubmissionStatus.SELECTED:
        return (
          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Selected
          </span>
        );
      case SubmissionStatus.PENDING:
      default:
        return (
          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Pending
          </span>
        );
    }
  };

  const handleOpenViewer = () => {
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
  };

  return (
    <>
      <div 
        className={cn("bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer", className)}
        onClick={handleOpenViewer}
      >
        {/* Image area */}
        <div className="relative h-48 overflow-hidden">
          <Thumbnail
            src={submission.imageUrl}
            alt={submission.description}
            fill={true}
            objectFit="cover"
            sizes="(max-width: 768px) 100vw, 384px"
            priority={false}
          />
          {/* Status badge */}
          <div className="absolute top-2 right-2">
            {getStatusBadge(submission.status as SubmissionStatus)}
          </div>
          
          {/* Cover badge */}
          {submission.isCover && (
            <div className="absolute top-2 left-2">
              <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Cover
              </span>
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
            {submission.description.split('\n')[0]}
          </h3>
          
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
            {submission.description.split('\n').slice(1).join('\n')}
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <i className="fa-solid fa-calendar-days mr-1"></i>
              <span>{formatDate(submission.submittedAt)}</span>
            </div>
            
            <div className="flex items-center">
              <i className="fa-solid fa-book mr-1"></i>
              <span>Issue {submission.issue.id}</span>
            </div>
            
            {(submission.status === SubmissionStatus.APPROVED || 
              submission.status === SubmissionStatus.SELECTED) && (
              <div className="flex items-center">
                <i className="fa-solid fa-thumbs-up mr-1"></i>
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