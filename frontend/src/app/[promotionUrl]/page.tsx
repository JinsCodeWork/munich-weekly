/**
 * Dynamic Promotion Page
 * Handles promotion page routes based on URL parameter
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { PromotionPageContent } from '@/components/promotion/PromotionPageContent';
import { Container } from '@/components/ui/Container';
import { PromotionPageData } from '@/types/promotion';
import { getPromotionPageByUrl } from '@/api/promotion';

export default function PromotionPage() {
  const params = useParams();
  const promotionUrl = params.promotionUrl as string;
  
  const [pageData, setPageData] = useState<PromotionPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPageData = async () => {
      if (!promotionUrl) {
        setError('Invalid promotion URL');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const data = await getPromotionPageByUrl(promotionUrl);
        
        if (!data) {
          // Page not found or not enabled
          notFound();
          return;
        }
        
        setPageData(data);
      } catch (err) {
        console.error('Failed to load promotion page:', err);
        setError('Failed to load promotion page');
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [promotionUrl]);

  // Loading state
  if (loading) {
    return (
      <Container className="py-8" spacing="standard">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="w-12 h-12 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading promotion page...</p>
        </div>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="py-8" spacing="standard">
        <div className="text-center py-16">
          <div className="flex flex-col items-center gap-4">
            <svg 
              className="w-16 h-16 text-red-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
            <div className="text-gray-700">
              <h3 className="text-lg font-medium mb-2">Error Loading Page</h3>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  // Main content
  if (pageData) {
    return <PromotionPageContent pageData={pageData} />;
  }

  // This shouldn't happen as notFound() should be called
  return notFound();
} 