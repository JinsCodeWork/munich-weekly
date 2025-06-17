import React, { useState } from "react";
import { Submission, SubmissionStatus } from "@/types/submission";
import { formatDate, getImageUrl, cn } from "@/lib/utils";
import { ImageViewer } from "./ImageViewer";
import { Thumbnail } from "@/components/ui/Thumbnail";
import { StatusBadge } from "@/components/ui/Badge";
import { 
  // 🎯 恢复 getAspectRatioStyle，因为瀑布流布局需要外层容器宽高比
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
  /**
   * Indicates if the image dimensions have been loaded (for progressive loading)
   * @default true
   */
  isImageLoaded?: boolean;
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
  showWideIndicator = false,
  isImageLoaded = true
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
  
  // 调试信息：特别标记3648x5472的处理 - 减少输出频率
  if (process.env.NODE_ENV === 'development' && 
      imageUrl && 
      (imageUrl.includes('3648') || imageUrl.includes('5472')) &&
      submission.imageWidth && submission.imageHeight) {
    console.log('MasonrySubmissionCard - 3648x5472 图片处理:', {
      aspectRatio: aspectRatio.toFixed(3),
      isWide,
      imageUrl: imageUrl.substring(0, 50) + '...',
      willUseCover: true,
      willUseTopPosition: true,
      // 🎯 新增：显示是否使用了预计算数据
      hasPrecomputedData: !!(submission.imageWidth && submission.imageHeight),
      storedWidth: submission.imageWidth,
      storedHeight: submission.imageHeight,
      storedAspectRatio: submission.aspectRatio
    });
  }
  
  // 🚨 Debug: Add detailed processing strategy debug info for all images
  if (process.env.NODE_ENV === 'development') {
    const objectFitStrategy = aspectRatio < 1 ? 'contain (portrait full display)' : 'cover (landscape fill container)';
    const imageType = aspectRatio < 1 ? 'portrait' : (aspectRatio >= 1.9 ? 'ultra-wide' : 'landscape');
    
    if (aspectRatio >= 1.9 || aspectRatio < 1) { // Only output debug info for ultra-wide and portrait images
      console.log(`🖼️ ${imageType} processing debug:`, {
        inputAspectRatio: aspectRatio.toFixed(3),
        imageType: imageType,
        imageClassification: (() => {
          if (aspectRatio > 2.1) return 'ultrawide (21:9+)';
          if (aspectRatio > 1.9) return 'cinema (1.9-2.1)';
          if (aspectRatio > 1.6) return 'widescreen (16:9)';
          if (aspectRatio >= 1) return 'landscape';
          if (aspectRatio > 0.69) return 'portrait (3:4)';
          return 'tall portrait (9:16)';
        })(),
        containerAspectRatio: aspectRatio.toString(),
        thumbnailParams: {
          objectFit: objectFitStrategy,
          objectPosition: aspectRatio > 1.6 ? 'center' : 'top',
          preserveAspectRatio: false,
          autoDetectAspectRatio: false
        },
        submissionId: submission.id,
        imageUrl: imageUrl?.substring(0, 50) + '...',
        expectedEffect: aspectRatio < 1 ? 'Portrait full display, no cropping' : 'Landscape fill container, no gray padding'
      });
    }
  }
  
  // 🚨 Debug: Add detailed analysis for images with aspect ratio issues
  if (process.env.NODE_ENV === 'development' && 
      submission.imageWidth && submission.imageHeight && submission.aspectRatio) {
    const storedRatio = submission.aspectRatio;
    const calculatedRatio = submission.imageWidth / submission.imageHeight;
    const ratioDifference = Math.abs(storedRatio - calculatedRatio);
    
    // If stored aspect ratio differs significantly from calculated ratio, there's an issue
    if (ratioDifference > 0.1) {
      console.error('🚨 Aspect ratio data anomaly:', {
        imageUrl: imageUrl.substring(0, 50) + '...',
        submissionId: submission.id,
        storedData: {
          width: submission.imageWidth,
          height: submission.imageHeight,
          storedAspectRatio: storedRatio.toFixed(3)
        },
        calculatedResult: {
          calculatedAspectRatio: calculatedRatio.toFixed(3),
          shouldBePortrait: calculatedRatio < 1,
          shouldBeLandscape: calculatedRatio > 1
        },
        inputAspectRatio: aspectRatio.toFixed(3),
        deviationLevel: ratioDifference.toFixed(3),
        possibleIssue: ratioDifference > 0.5 ? 'Width and height may be swapped' : 'Data slightly inconsistent'
      });
    }
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
            "relative overflow-hidden",
            // Unified image container styles for both wide and regular images
            "w-full",
            // Progressive loading effects
            !isImageLoaded && "animate-pulse"
          )}
          style={getAspectRatioStyle(aspectRatio)}
        >
          {/* Progressive loading overlay */}
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 z-5">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              </div>
            </div>
          )}
          
          {/* 🎯 Conditional rendering: Only render Thumbnail when valid image exists */}
          {hasValidImage ? (
            <Thumbnail
              src={displayUrl}
              alt={submission.description}
              fill={true}
              
              // 🎯 Performance optimization: Prioritize stored image dimension data
              precomputedDimensions={submission.imageWidth && submission.imageHeight ? {
                width: submission.imageWidth,
                height: submission.imageHeight,
                aspectRatio: submission.aspectRatio || (submission.imageWidth / submission.imageHeight)
              } : undefined}
              
              // 🚨 Fix double aspect ratio conflict: Use passed aspectRatio instead of "auto"
              // This prevents Thumbnail from internal aspect ratio detection, avoiding conflicts with outer container
              aspectRatio={(() => {
                // Determine corresponding ratio type based on input aspectRatio value
                // 🔧 Fix: Keep consistent with detectAspectRatio function classification logic
                if (aspectRatio > 2.1) return 'ultrawide';       // Ultra-wide images 21:9 and above
                if (aspectRatio > 1.9) return 'cinema';          // Cinema ratio images between 1.9-2.1
                if (aspectRatio > 1.6) return 'widescreen';      // Widescreen images between 1.6-1.9 (including 16:9)
                if (aspectRatio > 1.1) return 'landscape';       // Landscape images between 1.1-1.6
                if (aspectRatio > 0.9) return 'square';          // Near-square images 0.9-1.1
                if (aspectRatio > 0.69) return 'portrait';       // Portrait range 0.69-0.9
                return 'tallportrait';                           // Tall portrait below 0.69
              })()}
              autoDetectAspectRatio={false} // Disable auto-detection, use explicitly specified ratio above
              preserveAspectRatio={false} // 🔧 Critical fix: Disable Thumbnail's intelligent objectFit logic
              // 🔧 Fix: Intelligently select objectFit based on image type
              objectFit={(() => {
                if (aspectRatio < 1) {
                  // Portrait: Use contain for full display, avoid cropping
                  return 'contain';
                } else {
                  // Landscape and ultra-wide: Use cover to fill container, avoid gray padding
                  return 'cover';
                }
              })()} 
              // 🔧 Fix ultra-wide image positioning: Ultra-wide images use center positioning for better centering
              objectPosition={(() => {
                if (aspectRatio > 1.6) return 'center'; // Widescreen and ultra-wide images centered
                return 'top'; // Other images use top positioning
              })()}
              sizes={isWide 
                ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 580px"
                : "(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 280px"
              }
              priority={false}
              unoptimized={imageUrl.startsWith('/uploads/')}
              showErrorMessage={true}
              fallbackSrc="/placeholder.svg"
              quality={isWide ? 90 : 85}
              className={cn(
                "transition-opacity duration-500",
                !isImageLoaded && "opacity-60"
              )}
            />
          ) : (
            // 🎯 Show placeholder for invalid images, avoid invalid calculations in Thumbnail component
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400 text-sm">No Image</span>
            </div>
          )}
          
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

          {/* Hover overlay for enhanced visual feedback - Disabled on mobile */}
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
            // Limit all titles to single line display to avoid layout issues
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