/**
 * Promotion Image Component
 * Displays a single promotion image with full width and proper aspect ratio
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { PromotionImage as PromotionImageType } from '@/types/promotion';

interface PromotionImageProps {
  image: PromotionImageType;
  priority?: boolean;
}

export const PromotionImage: React.FC<PromotionImageProps> = ({ 
  image, 
  priority = false 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Calculate aspect ratio for responsive container
  const aspectRatio = image.aspectRatio || (
    image.imageWidth && image.imageHeight 
      ? image.imageWidth / image.imageHeight 
      : 16 / 9 // Default aspect ratio
  );

  return (
    <div className="w-full mb-8 last:mb-0">
      {/* Image container with proper aspect ratio */}
      <div 
        className="relative w-full overflow-hidden bg-gray-100 rounded-lg shadow-sm"
        style={{ aspectRatio: aspectRatio.toString() }}
      >
        {/* Loading placeholder */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              <span className="text-sm">Loading image...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">Failed to load image</span>
            </div>
          </div>
        )}

        {/* Main image */}
        {!hasError && (
          <Image
            src={image.imageUrl}
            alt={image.imageTitle || 'Promotion image'}
            fill
            className={`object-cover transition-opacity duration-300 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
            priority={priority}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        )}
      </div>

      {/* Image title and description */}
      {(image.imageTitle || image.imageDescription) && (
        <div className="mt-4 px-1">
          {image.imageTitle && (
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {image.imageTitle}
            </h3>
          )}
          {image.imageDescription && (
            <p className="text-gray-600 leading-relaxed">
              {image.imageDescription}
            </p>
          )}
        </div>
      )}
    </div>
  );
}; 