'use client';

import React, { useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import { createImageUrl } from "@/lib/utils";
import { useGesture } from '@use-gesture/react';
import useMeasure from 'react-use-measure';
import { FeaturedSubmission } from '@/api/gallery/types';

interface GalleryImageViewerProps {
  submission: FeaturedSubmission | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Gallery-specific fullscreen image viewer with submission details
 * Extends the basic ImageViewer with author info, issue title, etc.
 */
export function GalleryImageViewer({ submission, isOpen, onClose }: GalleryImageViewerProps) {
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0, isPortrait: false });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [ref, bounds] = useMeasure();
  const lastTapRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialPosRef = useRef({ x: 0, y: 0 });
  const initialScaleRef = useRef(1);

  // Check if submission has valid image
  const hasValidImage = submission?.imageUrl && submission.imageUrl.trim() !== '';
  
  // Prevent background scrolling
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      document.body.style.touchAction = 'none';
      
      return () => {
        document.body.style.overflow = '';
        document.body.style.height = '';
        document.body.style.touchAction = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);
  
  // Close viewer if no valid image
  useEffect(() => {
    if (isOpen && !hasValidImage) {
      console.warn('GalleryImageViewer: No valid submission or image URL provided, closing viewer');
      onClose();
    }
  }, [isOpen, hasValidImage, onClose]);

  // Create high quality image URL
  const highQualityUrl = useMemo(() => {
    if (!hasValidImage || !submission) return '';
    
    const imageUrl = submission.imageUrl;
    
    if (imageUrl.startsWith('/uploads/') || imageUrl.includes('.r2.dev/')) {
      return createImageUrl(imageUrl, {
        quality: 95,
        format: 'auto',
        fit: 'contain'
      });
    }
    
    return imageUrl;
  }, [submission, hasValidImage]);
  
  // Preload image to get dimensions
  useEffect(() => {
    if (isOpen && highQualityUrl) {
      const img = new window.Image();
      img.onload = () => {
        const isPortrait = img.naturalHeight > img.naturalWidth;
        setImgDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight,
          isPortrait
        });
      };
      img.src = highQualityUrl;
    }
    
    // Reset zoom and position when opening
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsTransitioning(false);
    }
  }, [isOpen, highQualityUrl]);
  
  // Handle image load completion
  const handleImageLoad = () => {
    setImgLoaded(true);
  };
  
  // Handle Escape key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);
  
  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle double tap for zoom
  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      setIsTransitioning(true);
      setScale(scale === 1 ? 2.5 : 1);
      setPosition({ x: 0, y: 0 });
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }
    
    lastTapRef.current = now;
  };

  // Set up gesture handlers
  useGesture(
    {
      onDrag: ({ movement: [mx, my], first }) => {
        if (scale > 1) {
          if (first) {
            initialPosRef.current = { ...position };
          }
          
          const maxX = (bounds.width * scale - bounds.width) / 2;
          const maxY = (bounds.height * scale - bounds.height) / 2;
          
          setPosition({
            x: Math.max(-maxX, Math.min(maxX, initialPosRef.current.x + mx / scale)),
            y: Math.max(-maxY, Math.min(maxY, initialPosRef.current.y + my / scale))
          });
        }
      },
      onPinch: ({ offset: [s], first }) => {
        if (first) {
          initialScaleRef.current = scale;
        }
        
        const newScale = Math.max(1, Math.min(4, initialScaleRef.current * s));
        setScale(newScale);
        
        if (newScale === 1) {
          setPosition({ x: 0, y: 0 });
        }
      },
      onClick: () => {
        handleDoubleTap();
      }
    },
    {
      target: containerRef,
      eventOptions: { passive: false }
    }
  );
  
  if (!isOpen || !submission) return null;

  // Calculate image dimensions
  const calculateImageDimensions = () => {
    const maxHeight = Math.min(window.innerHeight * 0.65, 800);
    const maxWidth = Math.min(window.innerWidth * 0.9, 1200);
    
    if (!imgDimensions.width || !imgDimensions.height) {
      return { width: maxWidth, height: maxHeight };
    }
    
    const aspectRatio = imgDimensions.width / imgDimensions.height;
    
    if (imgDimensions.isPortrait) {
      const height = maxHeight;
      const width = height * aspectRatio;
      return { width, height };
    } else {
      const width = maxWidth;
      const height = width / aspectRatio;
      return { width, height };
    }
  };

  const { width, height } = calculateImageDimensions();

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center bg-transparent rounded-lg overflow-hidden">
        {/* Close button */}
        <button 
          className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-80 z-10 transition-all"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Mobile help text */}
        <div className="absolute top-4 left-4 right-16 flex justify-center z-10 md:hidden">
          <div className="px-3 py-1 bg-black bg-opacity-60 text-white text-xs rounded-full">
            Double-tap to zoom, drag to pan
          </div>
        </div>
        
        {/* Image Container */}
        <div 
          className="flex justify-center items-center flex-grow w-full overflow-hidden" 
          ref={containerRef}
          onClick={handleBackdropClick}
        >
          <div
            ref={ref}
            className={`relative flex justify-center items-center ${
              imgDimensions.isPortrait ? 'max-h-[60vh]' : 'max-w-full max-h-[60vh]'
            }`}
            style={{
              touchAction: scale > 1 ? 'none' : 'auto',
            }}
          >
            <div 
              className="relative"
              style={{ 
                width, 
                height,
                transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                transformOrigin: 'center center',
                transition: isTransitioning || scale === 1 ? 'transform 0.3s ease-out' : 'none'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={highQualityUrl}
                alt={submission.description || `Photo by ${submission.authorName}`}
                className="rounded shadow-2xl"
                fill
                sizes="(max-width: 768px) 100vw, 1200px"
                style={{ objectFit: 'contain' }}
                quality={100}
                priority={true}
                onLoad={handleImageLoad}
                unoptimized={false}
              />
            </div>
            
            {/* Loading indicator */}
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
        
                 {/* Gallery submission details - simplified */}
         <div className="w-full mt-4 flex justify-center flex-shrink-0 max-h-[30vh] overflow-y-auto" onClick={handleBackdropClick}>
           <div 
             className="max-w-4xl w-full bg-black bg-opacity-60 backdrop-blur-sm rounded-lg p-6 text-white"
             onClick={(e) => e.stopPropagation()}
           >
             {/* Author and Issue info */}
             <div className="text-center mb-4">
               <p className="font-medium text-white/90 text-sm">
                 Photo by {submission.authorName}
               </p>
               <p className="text-white/70 text-sm mt-1">
                 {submission.issueTitle}
               </p>
             </div>
 
             {/* Description */}
             {submission.description && (
               <div className="border-t border-white/20 pt-4 text-center">
                 <p className="text-lg font-light leading-relaxed italic text-white">
                   &ldquo;{submission.description.trim()}&rdquo;
                 </p>
               </div>
             )}
           </div>
         </div>
      </div>
    </div>
  );
} 