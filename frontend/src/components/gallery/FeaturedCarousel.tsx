'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { FeaturedSubmission } from '@/api/gallery/types';
import { useCarousel } from '@/hooks/useCarousel';
import { useTouchSwipe } from '@/hooks/useTouchSwipe';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { GalleryImageViewer } from './GalleryImageViewer';
import {
  getCarouselStyles,
  getCarouselSlideStyles,
  getCarouselImageStyles,
  getCarouselOverlayStyles,
  getCarouselDescriptionStyles,
  getCarouselControlStyles,
  getCarouselIndicatorsStyles,
  getCarouselIndicatorStyles,
  getCarouselLoadingStyles,
  getCarouselMetaStyles,
  getAutoplayProgressStyles,
} from '@/styles/components/carousel';

interface FeaturedCarouselProps {
  submissions: FeaturedSubmission[];
  autoplayInterval?: number;
  className?: string;
}

/**
 * Featured submissions carousel component
 * Desktop: Hover to show controls and description
 * Mobile: Touch swipe navigation, tap to show description
 */
export default function FeaturedCarousel({
  submissions,
  autoplayInterval = 5000,
  className = '',
}: FeaturedCarouselProps) {
  const [showDescription, setShowDescription] = useState(false);
  const [imageLoadStates, setImageLoadStates] = useState<Record<number, boolean>>({});
  const [progressWidth, setProgressWidth] = useState(0);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<FeaturedSubmission | null>(null);
  
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isDesktop = !isMobile;

  const {
    currentSlide,
    isPlaying,
    isHovered,
    nextSlide,
    previousSlide,
    goToSlide,
    pause,
    play,
    setHovered,
  } = useCarousel({
    itemCount: submissions.length,
    autoplayInterval,
    enabled: submissions.length > 1,
  });

  const touchHandlers = useTouchSwipe({
    onSwipeLeft: nextSlide,
    onSwipeRight: previousSlide,
    onTap: () => {
      if (isMobile) {
        // Mobile: Direct tap opens image viewer
        const currentSubmissionData = submissions[currentSlide];
        setSelectedSubmission(currentSubmissionData);
        setImageViewerOpen(true);
      }
    },
    enabled: isMobile && submissions.length > 0,
  });



  // Handle container hover (desktop only)
  const handleMouseEnter = () => {
    if (isDesktop) {
      setHovered(true);
      setShowDescription(true);
    }
  };

  const handleMouseLeave = () => {
    if (isDesktop) {
      setHovered(false);
      setShowDescription(false);
    }
  };

  // Handle image load states
  const handleImageLoad = (submissionId: number) => {
    setImageLoadStates(prev => ({ ...prev, [submissionId]: true }));
  };

  const handleImageError = (submissionId: number) => {
    setImageLoadStates(prev => ({ ...prev, [submissionId]: false }));
  };

  // Handle image click (desktop only - opens image viewer)
  const handleImageClick = (submission: FeaturedSubmission) => {
    if (isDesktop) {
      setSelectedSubmission(submission);
      setImageViewerOpen(true);
    }
  };

  // Handle image viewer close
  const handleImageViewerClose = () => {
    setImageViewerOpen(false);
    setSelectedSubmission(null);
  };

  // Autoplay progress bar effect
  useEffect(() => {
    if (!isPlaying || isHovered || submissions.length <= 1) {
      setProgressWidth(0);
      return;
    }

    const interval = setInterval(() => {
      setProgressWidth(prev => {
        const increment = 100 / (autoplayInterval / 100);
        return prev >= 100 ? 0 : prev + increment;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, isHovered, autoplayInterval, submissions.length, currentSlide]);

  // Reset progress on slide change
  useEffect(() => {
    setProgressWidth(0);
  }, [currentSlide]);

  // Loading state
  if (submissions.length === 0) {
    return (
      <div className={getCarouselStyles({ size: isMobile ? 'mobile' : 'desktop' })}>
        <div className={getCarouselLoadingStyles()}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading featured submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${getCarouselStyles({ 
        size: isMobile ? 'mobile' : 'desktop' 
      })} ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...(isMobile ? touchHandlers : {})}
    >
      {/* Main carousel slides */}
      {submissions.map((submission, index) => {
        const isActive = index === currentSlide;
        const isLoaded = imageLoadStates[submission.id] === true;
        
        return (
          <div
            key={submission.id}
            className={getCarouselSlideStyles({
              position: isActive ? 'current' : index > currentSlide ? 'next' : 'previous'
            })}
            style={{
              transform: `translateX(${(index - currentSlide) * 100}%)`,
            }}
          >
            {/* Main image */}
            <div 
              className="relative w-full h-full cursor-pointer"
              onClick={() => handleImageClick(submission)}
            >
              <Image
                src={submission.imageUrl}
                alt={submission.description || `Photo by ${submission.authorName}`}
                fill
                className={getCarouselImageStyles({ 
                  hover: isDesktop && isHovered,
                  loading: !isLoaded
                })}
                style={{ objectFit: 'cover' }}
                onLoad={() => handleImageLoad(submission.id)}
                onError={() => handleImageError(submission.id)}
                priority={index === 0}
                sizes="(max-width: 768px) 100vw, 80vw"
              />

              {/* Overlay for description and controls */}
              <div className={getCarouselOverlayStyles({
                visible: showDescription && isActive,
                device: isMobile ? 'mobile' : 'desktop'
              })}>
                {/* Description content */}
                <div className={getCarouselDescriptionStyles({
                  visible: showDescription && isActive,
                  device: isMobile ? 'mobile' : 'desktop'
                })}>
                  {/* Meta information */}
                  <div className={getCarouselMetaStyles()}>
                    <p className="font-medium text-sm">
                      Photo by {submission.authorName}
                    </p>
                    <p className="text-xs opacity-90">
                      {submission.issueTitle}
                    </p>
                  </div>

                  {/* Main description */}
                  {submission.description && (
                    <p className="text-lg font-medium leading-relaxed mt-3 line-clamp-3">
                      {submission.description}
                    </p>
                  )}


                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Desktop navigation controls */}
      {isDesktop && submissions.length > 1 && (
        <>
          <button
            className={getCarouselControlStyles({
              position: 'left',
              visible: isHovered,
              size: 'lg'
            })}
            onClick={previousSlide}
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            className={getCarouselControlStyles({
              position: 'right',
              visible: isHovered,
              size: 'lg'
            })}
            onClick={nextSlide}
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Indicators (dots) */}
      {submissions.length > 1 && (
        <div className={getCarouselIndicatorsStyles({ visible: true })}>
          {submissions.map((_, index) => (
            <button
              key={index}
              className={getCarouselIndicatorStyles({ active: index === currentSlide })}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Play/pause control (desktop only) */}
      {isDesktop && submissions.length > 1 && (
        <button
          className="absolute top-4 right-4 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-black/20 text-white backdrop-blur-sm transition-opacity duration-300 hover:bg-black/30"
          style={{ opacity: isHovered ? 1 : 0 }}
          onClick={isPlaying ? pause : play}
          aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
      )}

      {/* Autoplay progress bar */}
      {isPlaying && !isHovered && submissions.length > 1 && (
        <div className={getAutoplayProgressStyles({ playing: true })}>
          <div 
            className="h-full bg-white transition-all duration-100 ease-linear"
            style={{ width: `${progressWidth}%` }}
          />
                </div>
      )}

      {/* Gallery Image Viewer */}
      <GalleryImageViewer
        submission={selectedSubmission}
        isOpen={imageViewerOpen}
        onClose={handleImageViewerClose}
      />
    </div>
  );
} 