import React, { useState } from "react";
import { Submission, SubmissionStatus } from "@/types/submission";
import { formatDate, getImageUrl, cn } from "@/lib/utils";
import { ImageViewer } from "./ImageViewer";
import { Thumbnail } from "@/components/ui/Thumbnail";
import { StatusBadge } from "@/components/ui/Badge";
import { 
  getAspectRatioStyle 
} from "@/styles/components/card";
import { mapSubmissionStatusToBadge } from "@/styles/components/badge";
import { VoteButton } from '@/components/voting/VoteButton';

/**
 * Props for MasonrySubmissionCard component
 */
interface MasonrySubmissionCardProps {
  submission: Submission;
  isWide: boolean;
  aspectRatio: number;
  displayContext?: 'default' | 'voteView' | 'previousResults';
  onVoteSuccess?: (submissionId: number, newVoteCount?: number) => void;
  onVoteCancelled?: (submissionId: number, newVoteCount?: number) => void;
  className?: string;
  /**
   * Enable hover effects and interactive animations
   * @default true
   */
  enableHoverEffects?: boolean;
  /**
   * Show wide image indicator badge
   * @default false
   */
  showWideIndicator?: boolean;
}

/**
 * MasonrySubmissionCard - Submission card optimized for masonry layout
 * 
 * This component is specifically designed for use within MasonryGallery.
 * It handles wide image layout, dynamic aspect ratios, and proper styling
 * for different display contexts (voting, results, default).
 * 
 * Key features:
 * - Dynamic aspect ratio based on loaded image dimensions
 * - Wide image detection with enhanced styling
 * - Context-aware display (voting, results, default view)
 * - Proper image loading with fallbacks
 * - Responsive design with mobile optimizations
 * - Accessibility features (ARIA labels, keyboard navigation)
 * 
 * @example
 * ```tsx
 * <MasonrySubmissionCard
 *   submission={submission}
 *   isWide={true}
 *   aspectRatio={2.5}
 *   displayContext="voteView"
 *   onVoteSuccess={handleVoteSuccess}
 * />
 * ```
 */
export function MasonrySubmissionCard({ 
  submission, 
  isWide,
  aspectRatio,
  displayContext = 'default', 
  onVoteSuccess, 
  onVoteCancelled,
  className,
  enableHoverEffects = true,
  showWideIndicator = false
}: MasonrySubmissionCardProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const handleOpenViewer = () => {
    if (hasValidImage) {
      setIsViewerOpen(true);
    }
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
  };

  // Process the image URL to ensure it has the correct server prefix
  const imageUrl = submission.imageUrl;
  
  // Validate image URL
  const hasValidImage = imageUrl && imageUrl.trim() !== '';
  
  // Process URLs for display and full viewing
  const displayUrl = hasValidImage ? getImageUrl(imageUrl) : '';
  const fullImageUrl = hasValidImage ? getImageUrl(imageUrl) : '';
  
  // 调试信息：特别标记3648x5472的处理
  if (imageUrl && (imageUrl.includes('3648') || imageUrl.includes('5472'))) {
    console.log('MasonrySubmissionCard - 3648x5472 图片处理:', {
      aspectRatio: aspectRatio.toFixed(3),
      isWide,
      imageUrl: imageUrl.substring(0, 50) + '...',
      willUseCover: true,
      willUseTopPosition: true
    });
  }
  
  // Determine badge visibility based on context
  const showStatusBadge = 
    displayContext === 'default' || 
    (displayContext === 'voteView' && 
      (submission.status === SubmissionStatus.SELECTED || submission.isCover)) ||
    (displayContext === 'previousResults' && 
      (submission.status === SubmissionStatus.SELECTED || submission.isCover));

  // Prevent vote button click events from bubbling up
  const handleButtonContainerClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  // Container styling with masonry-specific optimizations
  const containerStyles = cn(
    // Unified basic card styles for both wide and regular images
    'group cursor-pointer bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-gray-200 hover:border-gray-300',
    // Critical: Force width constraints to prevent text from widening the card
    'w-full min-w-0 max-w-full',
    // Add margin bottom for shadow space on desktop/tablet
    'mb-2 sm:mb-3',
    // Remove scaling animation, only keep shadow and border transitions
    className
  );

  // Render vote count display for different contexts
  const renderVoteInterface = () => {
    if (displayContext === 'voteView') {
      return (
        <div className="w-full flex items-center justify-between min-w-0 max-w-full">
          <div className="flex-grow mr-2 min-w-0">
            <span className="text-sm font-medium text-gray-700 break-words">
              {submission.voteCount} votes
            </span>
          </div>
          <div 
            className="z-10 flex-shrink-0"
            onClick={handleButtonContainerClick}
          >
            <VoteButton 
              submissionId={submission.id} 
              onVoteSuccess={onVoteSuccess}
              onVoteCancelled={onVoteCancelled}
              initialVoteCount={submission.voteCount}
              className="text-xs sm:text-sm px-3 py-1 min-w-[60px]"
            />
          </div>
        </div>
      );
    }
    
    if (displayContext === 'previousResults') {
      return (
        <div className="w-full flex items-center justify-center min-w-0 max-w-full">
          <span className="text-sm font-medium text-gray-700 break-words text-center">
            {submission.voteCount} votes
          </span>
        </div>
      );
    }
    
    // Default context vote display
    return (
      <div className={cn("flex items-center min-w-0", "hidden sm:flex")}> 
        <svg 
          className="w-4 h-4 mr-2 flex-shrink-0" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
        </svg>
        <span className="break-words">{submission.voteCount} votes</span>
      </div>
    );
  };

  return (
    <>
      <article 
        className={containerStyles}
        onClick={handleOpenViewer}
        role="button"
        tabIndex={0}
        aria-label={`View submission: ${submission.description.split('\n')[0]}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpenViewer();
          }
        }}
      >
        {/* Image container with dynamic aspect ratio */}
        <div 
          className={cn(
            "relative overflow-hidden bg-gray-100",
            // Unified image container styles for both wide and regular images
            "w-full"
          )}
          style={getAspectRatioStyle(aspectRatio)}
        >
          <Thumbnail
            src={displayUrl || '/placeholder.svg'}
            alt={submission.description}
            fill={true}
            aspectRatio="auto" // Let Thumbnail handle aspect ratio detection
            autoDetectAspectRatio={true} // Enable aspect ratio detection
            preserveAspectRatio={true} // Preserve image aspect ratio
            // 智能选择objectFit：对于瀑布流布局，优先避免灰色背景
            objectFit={aspectRatio >= 1 ? "cover" : "cover"} // 统一使用cover避免灰色背景
            // 竖图使用top定位，优先显示上半部分内容
            objectPosition={aspectRatio >= 1 ? "top" : "top"}
            sizes={isWide 
              ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 580px"
              : "(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 280px"
            }
            priority={false}
            unoptimized={imageUrl.startsWith('/uploads/')}
            showErrorMessage={true}
            fallbackSrc="/placeholder.svg"
            quality={isWide ? 90 : 85}
            className="" // Remove transform animations for better performance
          />
          
          {/* Status badge - conditional rendering */}
          {showStatusBadge && (
            <div className={cn(
              "absolute top-2 right-2 z-10",
              // Unified badge positioning for all image types
            )}>
              <StatusBadge status={mapSubmissionStatusToBadge(submission.status)} />
            </div>
          )}
          
          {/* Cover badge - always show if submission.isCover is true */}
          {submission.isCover && (
            <div className={cn(
              "absolute top-2 left-2 z-10",
              // Unified badge positioning for all image types
            )}>
              <StatusBadge status="cover" />
            </div>
          )}

          {/* Wide image indicator (optional) */}
          {showWideIndicator && isWide && (
            <div className="absolute top-2 right-2 z-5 bg-black/20 text-white text-xs px-2 py-1 rounded">
              Wide
            </div>
          )}

          {/* Hover overlay for enhanced visual feedback - 移动端禁用 */}
          {enableHoverEffects && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity duration-200" />
          )}
        </div>

        {/* Content area with responsive spacing */}
        <div className={cn(
          "p-3 sm:p-4",
          // Critical: Prevent content from expanding card width
          "w-full min-w-0 max-w-full overflow-hidden",
          // Unified content area styles for all image types
        )}>
          {/* Title with dynamic text clamping based on image width */}
          <h3 className={cn(
            "font-medium text-gray-900 mb-2",
            // Dynamic text size based on image width
            isWide ? "text-base sm:text-lg" : "text-sm sm:text-base",
            // 限制所有标题为单行显示，避免布局问题
            "line-clamp-1",
            // Force width constraints to prevent card expansion
            "w-full min-w-0 max-w-full overflow-hidden",
            // Use word-break for better text flow without forcing harsh breaks
            "break-words hyphens-auto"
          )}
          style={{
            // Only use standard word breaking, not break-all
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            // Remove break-all which was too aggressive
          }}
          >
            {submission.description.split('\n')[0]}
          </h3>
          
          {/* Metadata container */}
          <div className={cn(
            "flex items-center justify-between text-xs text-gray-500 mt-2",
            // Critical: Prevent metadata from expanding card width
            "w-full min-w-0 max-w-full",
            // Unified metadata container styles
          )}>
            {displayContext === 'default' && (
              <>
                {/* Desktop metadata */}
                <div className={cn("flex items-center min-w-0", "hidden sm:flex")}>
                  <span className="break-words">{formatDate(submission.submittedAt)}</span>
                </div>
                
                <div className={cn("flex items-center min-w-0", "hidden sm:flex")}>
                  <span className="break-words">Issue {submission.issue.id}</span>
                </div>
                
                {/* Mobile vote count only */}
                <div className={cn("flex items-center min-w-0", "sm:hidden w-full text-xs")}>
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                  </svg>
                  <span className="break-words">{submission.voteCount} votes</span>
                </div>
              </>
            )}
            
            {/* Context-specific vote interface */}
            {(displayContext === 'voteView' || displayContext === 'previousResults') && (
              <div className={cn("flex items-center min-w-0 max-w-full", "w-full")}>
                {renderVoteInterface()}
              </div>
            )}
            
            {/* Default context vote display for desktop */}
            {displayContext === 'default' && renderVoteInterface()}
          </div>
        </div>
      </article>

      {/* Full-screen image viewer */}
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