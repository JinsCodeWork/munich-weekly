import React, { useEffect, useMemo } from "react";
import { getImageCaptionStyles } from '@/styles';
import Image from "next/image";
import { getImageUrl } from "@/lib/utils";

interface ImageViewerProps {
  imageUrl: string;
  description: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageViewer({ imageUrl, description, isOpen, onClose }: ImageViewerProps) {
  // Determine caption style based on description length
  const captionStyle = useMemo(() => {
    if (!description) return null;
    
    const length = description.trim().length;
    
    // Short descriptions use pill style
    if (length < 50) {
      return {
        variant: 'pill' as const,
        maxWidth: '70%'
      };
    }
    
    // Medium descriptions use default style
    if (length < 120) {
      return {
        variant: 'default' as const,
        maxWidth: '85%'
      };
    }
    
    // Long descriptions use card style with larger width
    return {
      variant: 'card' as const,
      maxWidth: '95%'
    };
  }, [description]);

  // Process the image URL to ensure it has the correct server prefix
  const displayUrl = getImageUrl(imageUrl);
  
  // Debug information
  console.log("ImageViewer original URL:", imageUrl);
  console.log("ImageViewer display URL:", displayUrl);

  // Handle ESC key press to close the viewer
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleEsc);
    
    // Disable body scroll when viewer is open
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle click on the backdrop (outside the image) to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Check if this is a local upload (for rendering decisions)
  const isLocalUpload = imageUrl.startsWith('/uploads/');

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-5xl w-full bg-transparent rounded-lg overflow-hidden">
        {/* Close button */}
        <button 
          className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-80 z-10 transition-all"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Image */}
        <div className="w-full flex justify-center">
          {isLocalUpload ? (
            <img 
              src={displayUrl} 
              alt={description} 
              className="max-h-[80vh] max-w-full object-contain rounded shadow-2xl"
            />
          ) : (
            <Image 
              src={displayUrl} 
              alt={description} 
              className="max-h-[80vh] max-w-full object-contain rounded shadow-2xl"
              width={1200}
              height={800}
              unoptimized={isLocalUpload}
            />
          )}
        </div>
        
        {/* Description */}
        {description && captionStyle && (
          <div className="mt-4 flex justify-center">
            <div className={getImageCaptionStyles({
              variant: captionStyle.variant,
              maxWidth: captionStyle.maxWidth
            })}>
              <p className="text-white text-lg font-light leading-relaxed italic">
                &ldquo;{description.trim()}&rdquo;
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 