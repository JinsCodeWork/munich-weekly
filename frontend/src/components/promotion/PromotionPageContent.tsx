/**
 * Promotion Page Content Component
 * Displays the complete promotion page with images in vertical stack layout
 */

'use client';

import React from 'react';
import { Container } from '@/components/ui/Container';
import { PromotionImage } from './PromotionImage';
import { PromotionPageData } from '@/types/promotion';

interface PromotionPageContentProps {
  pageData: PromotionPageData;
}

export const PromotionPageContent: React.FC<PromotionPageContentProps> = ({ pageData }) => {
  const { config, images } = pageData;

  return (
    <Container className="py-8" spacing="standard">
      {/* Page header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {config.navTitle}
        </h1>
        <div className="w-24 h-1 bg-gray-300 mx-auto rounded-full"></div>
        
        {/* Description text */}
        {config.description && (
          <div className="mt-6 max-w-3xl mx-auto">
            <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">
              {config.description}
            </p>
          </div>
        )}
      </div>

      {/* Images section */}
      <div className="max-w-4xl mx-auto">
        {images && images.length > 0 ? (
          <div className="space-y-8">
            {images.map((image, index) => (
              <PromotionImage 
                key={image.id} 
                image={image}
                priority={index === 0} // Prioritize first image loading
              />
            ))}
          </div>
        ) : (
          // Empty state
          <div className="text-center py-16">
            <div className="flex flex-col items-center gap-4">
              <svg 
                className="w-16 h-16 text-gray-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
              <div className="text-gray-500">
                <h3 className="text-lg font-medium mb-2">No images available</h3>
                <p className="text-sm">
                  This promotion page is currently empty. Please check back later.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>


    </Container>
  );
}; 