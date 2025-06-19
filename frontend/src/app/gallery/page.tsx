'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, RefreshCw, BookOpen } from 'lucide-react';
import FeaturedCarousel from '@/components/gallery/FeaturedCarousel';
import GalleryIssueCard from '@/components/gallery/GalleryIssueCard';
import { 
  getFeaturedSubmissions, 
  getPublishedIssues,
  getGalleryIssueStats 
} from '@/api/gallery/galleryApi';
import { 
  FeaturedSubmission, 
  GalleryIssueConfig,
  GalleryIssueStats 
} from '@/api/gallery/types';

interface GalleryPageState {
  featuredSubmissions: FeaturedSubmission[];
  publishedIssues: GalleryIssueConfig[];
  stats: GalleryIssueStats | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Gallery主页
 * 上方：精选轮播展示
 * 下方：期刊封面网格（杂志样式）
 */
export default function GalleryPage() {
  const router = useRouter();
  const [state, setState] = useState<GalleryPageState>({
    featuredSubmissions: [],
    publishedIssues: [],
    stats: null,
    isLoading: true,
    error: null,
  });

  // 加载Gallery数据
  const loadGalleryData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // 并行加载所有数据
      const [featuredSubmissions, publishedIssues, stats] = await Promise.all([
        getFeaturedSubmissions().catch(() => []), // 轮播可能为空
        getPublishedIssues(),
        getGalleryIssueStats()
      ]);

      setState(prev => ({
        ...prev,
        featuredSubmissions,
        publishedIssues,
        stats,
        isLoading: false,
        error: null,
      }));

      console.log('✅ Gallery data loaded successfully', {
        featured: featuredSubmissions.length,
        issues: publishedIssues.length
      });
    } catch (error) {
      console.error('❌ Failed to load Gallery data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load Gallery data',
      }));
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadGalleryData();
  }, []);

  // 处理期刊卡片点击
  const handleIssueClick = (issue: GalleryIssueConfig) => {
    router.push(`/gallery/${issue.issue.id}`);
  };

  // 重试处理
  const handleRetry = () => {
    loadGalleryData();
  };

  // 加载状态
  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          {/* 页面标题骨架 */}
          <div className="text-center mb-12">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto mb-4 animate-pulse"></div>
          </div>

          {/* 轮播骨架 */}
          <div className="h-[60vh] max-w-6xl mx-auto bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-16"></div>

          {/* 期刊网格骨架 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 max-w-7xl mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-700 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (state.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Failed to Load Gallery
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {state.error}
            </p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 空状态
  if (state.publishedIssues.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No Issues Available
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              No published issues found. Please check back later.
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

  // 主Gallery视图
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* 简化的页面标题 - 只保留Gallery */}
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            Gallery
          </h1>
        </div>

        {/* 精选轮播区域 - 无标题和描述 */}
        {state.featuredSubmissions.length > 0 && (
          <div className="mb-16">
            <FeaturedCarousel
              submissions={state.featuredSubmissions}
              autoplayInterval={5000}
            />
          </div>
        )}

        {/* 期刊网格区域 - 无标题和描述 */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {state.publishedIssues.map((issue) => (
              <GalleryIssueCard
                key={issue.id}
                issue={issue}
                onClick={() => handleIssueClick(issue)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 