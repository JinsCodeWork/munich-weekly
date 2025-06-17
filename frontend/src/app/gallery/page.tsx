'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, ImageIcon, RefreshCw } from 'lucide-react';
import FeaturedCarousel from '@/components/gallery/FeaturedCarousel';
import { getFeaturedSubmissions, getGalleryStats } from '@/api/gallery/galleryApi';
import { FeaturedSubmission, GalleryStats } from '@/api/gallery/types';

interface GalleryPageState {
  submissions: FeaturedSubmission[];
  stats: GalleryStats | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Gallery page featuring the featured submissions carousel
 * Public page accessible to all users
 */
export default function GalleryPage() {
  const [state, setState] = useState<GalleryPageState>({
    submissions: [],
    stats: null,
    isLoading: true,
    error: null,
  });

  // Load featured submissions and stats
  const loadGalleryData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Load both submissions and stats in parallel
      const [submissions, stats] = await Promise.all([
        getFeaturedSubmissions(),
        getGalleryStats()
      ]);

      setState(prev => ({
        ...prev,
        submissions,
        stats,
        isLoading: false,
        error: null,
      }));

      console.log('✅ Gallery data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load gallery data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load gallery',
      }));
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadGalleryData();
  }, []);



  // Retry handler
  const handleRetry = () => {
    loadGalleryData();
  };

  // Loading state
  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          {/* Header skeleton */}
          <div className="text-center mb-8">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mx-auto animate-pulse"></div>
          </div>

          {/* Carousel skeleton */}
          <div className="h-[60vh] max-w-5xl mx-auto bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>

          {/* Stats skeleton */}
          <div className="max-w-2xl mx-auto mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Unable to Load Gallery
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {state.error}
            </p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No submissions state
  if (state.submissions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">


          {/* Empty state */}
          <div className="max-w-md mx-auto text-center">
            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No Featured Submissions
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              There are currently no featured submissions to display. Check back later for amazing photography!
            </p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main gallery view
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Featured Carousel */}
        <FeaturedCarousel
          submissions={state.submissions}
          autoplayInterval={5000}
        />
      </div>
    </div>
  );
} 