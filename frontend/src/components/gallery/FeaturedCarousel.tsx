'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { FeaturedSubmission } from '@/api/gallery/types';
import { useCarousel } from '@/hooks/useCarousel';
import { useTouchSwipe } from '@/hooks/useTouchSwipe';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { GalleryImageViewer } from './GalleryImageViewer';
import { createImageUrl } from '@/lib/utils';
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

  // 🎯 图片优化：为轮播场景创建优化的图片URL
  const optimizedSubmissions = useMemo(() => {
    return submissions.map(submission => {
      // 根据设备类型设置不同的优化参数
      const optimizationParams = isMobile ? {
        width: 800,         // 移动端：中等尺寸
        quality: 75,        // 移动端：较低质量，节省流量
        format: 'auto' as const,
        fit: 'cover' as const
      } : {
        width: 1200,        // 桌面端：较高尺寸
        quality: 80,        // 桌面端：中等质量，平衡质量与速度
        format: 'auto' as const,
        fit: 'cover' as const
      };

      // 创建优化的图片URL
      const optimizedImageUrl = createImageUrl(submission.imageUrl, optimizationParams);

      // 🔍 调试信息：显示优化效果
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎯 FeaturedCarousel优化:`, {
          id: submission.id,
          device: isMobile ? 'Mobile' : 'Desktop',
          original: submission.imageUrl.substring(0, 60) + '...',
          optimized: optimizedImageUrl.substring(0, 60) + '...',
          params: optimizationParams
        });
      }

      return {
        ...submission,
        // 保留原始URL用于全屏查看
        originalImageUrl: submission.imageUrl,
        // 使用优化的URL用于轮播显示
        imageUrl: optimizedImageUrl
      };
    });
  }, [submissions, isMobile]);

  // Handle image load states
  const handleImageLoad = (submissionId: number) => {
    setImageLoadStates(prev => ({ ...prev, [submissionId]: true }));
  };

  const handleImageError = (submissionId: number) => {
    console.warn(`Featured carousel image failed to load: submission ID ${submissionId}`);
    setImageLoadStates(prev => ({ ...prev, [submissionId]: false }));
  };

  // Filter out submissions with failed images for stable carousel
  const validSubmissions = useMemo(() => {
    return optimizedSubmissions.filter(submission => {
      const hasValidImage = submission.imageUrl && submission.imageUrl.trim() !== '';
      const hasNotFailed = imageLoadStates[submission.id] !== false;
      return hasValidImage && hasNotFailed;
    });
  }, [optimizedSubmissions, imageLoadStates]);

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
    itemCount: validSubmissions.length,
    autoplayInterval,
    enabled: validSubmissions.length > 1,
  });

  const touchHandlers = useTouchSwipe({
    onSwipeLeft: nextSlide,
    onSwipeRight: previousSlide,
    onTap: () => {
      if (isMobile) {
        // Mobile: Direct tap opens image viewer with original high-quality URL
        const currentSubmissionData = validSubmissions[currentSlide];
        if (currentSubmissionData) {
          // Restore original URL for fullscreen viewing
          setSelectedSubmission({
            ...currentSubmissionData,
            imageUrl: currentSubmissionData.originalImageUrl || currentSubmissionData.imageUrl
          });
          setImageViewerOpen(true);
        }
      }
    },
    enabled: isMobile && validSubmissions.length > 0,
  });

  // Update carousel when valid submissions change
  useEffect(() => {
    if (validSubmissions.length === 0) {
      console.warn('No valid submissions available for featured carousel');
    }
  }, [validSubmissions]);

  // Handle image click (desktop only - opens image viewer)
  const handleImageClick = (submission: FeaturedSubmission & { originalImageUrl?: string }) => {
    if (isDesktop) {
      // Restore original high-quality URL for fullscreen viewing
      setSelectedSubmission({
        ...submission,
        imageUrl: submission.originalImageUrl || submission.imageUrl
      });
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
    if (!isPlaying || isHovered || validSubmissions.length <= 1) {
      const timer = window.setTimeout(() => setProgressWidth(0), 0);
      return () => window.clearTimeout(timer);
    }

    const resetTimer = window.setTimeout(() => setProgressWidth(0), 0);
    const interval = setInterval(() => {
      setProgressWidth(prev => {
        const increment = 100 / (autoplayInterval / 100);
        return prev >= 100 ? 0 : prev + increment;
      });
    }, 100);

    return () => {
      window.clearTimeout(resetTimer);
      clearInterval(interval);
    };
  }, [isPlaying, isHovered, autoplayInterval, validSubmissions.length, currentSlide]);

  // Loading state
  if (validSubmissions.length === 0) {
    return (
      <div className={getCarouselStyles({ size: isMobile ? 'mobile' : 'desktop' })}>
        <div className={getCarouselLoadingStyles()}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {optimizedSubmissions.length === 0 ? 'Loading featured submissions...' : 'No valid images available'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${getCarouselStyles({
        size: isMobile ? 'mobile' : 'desktop'
      })} ${className}`}
      onMouseEnter={() => {
        if (isDesktop) {
          setHovered(true);
          setShowDescription(true);
        }
      }}
      onMouseLeave={() => {
        if (isDesktop) {
          setHovered(false);
          setShowDescription(false);
        }
      }}
      {...(isMobile ? touchHandlers : {})}
    >
      {/* Main carousel slides */}
      {validSubmissions.map((submission, index) => {
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
                sizes={isMobile
                  ? "(max-width: 768px) 800px"
                  : "(min-width: 769px) 1200px"
                }
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
      {isDesktop && validSubmissions.length > 1 && (
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
      {validSubmissions.length > 1 && (
        <div className={getCarouselIndicatorsStyles({ visible: true })}>
          {validSubmissions.map((_, index) => (
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
      {isDesktop && validSubmissions.length > 1 && (
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
      {isPlaying && !isHovered && validSubmissions.length > 1 && (
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
