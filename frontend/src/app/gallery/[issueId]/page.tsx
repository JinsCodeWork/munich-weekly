'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, RefreshCw, ImageIcon } from 'lucide-react';
import GallerySubmissionCard from '@/components/gallery/GallerySubmissionCard';
import { Button } from '@/components/ui/Button';
import {
  getIssueDetail,
  getIssueSubmissions
} from '@/api/gallery/galleryApi';
import {
  GalleryIssueConfig,
  GallerySubmission
} from '@/api/gallery/types';

interface IssueDetailPageState {
  issue: GalleryIssueConfig | null;
  submissions: GallerySubmission[];
  heroSubmission: GallerySubmission | null;
  otherSubmissions: GallerySubmission[];
  isLoading: boolean;
  error: string | null;
}

/**
 * 期刊详情页面
 * 展示单个期刊的大封面和所有selected作品
 */
export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const issueId = parseInt(params.issueId as string);

  const [state, setState] = useState<IssueDetailPageState>({
    issue: null,
    submissions: [],
    heroSubmission: null,
    otherSubmissions: [],
    isLoading: true,
    error: null,
  });

  // 加载期刊详情数据
  const loadIssueData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      console.log('🔍 Loading issue data for ID:', issueId);

      // 并行加载期刊信息和作品
      const [issue, submissions] = await Promise.all([
        getIssueDetail(issueId),
        getIssueSubmissions(issueId)
      ]);

      console.log('📦 Loaded issue data:', {
        issue: issue,
        title: issue?.issue?.title,
        description: issue?.issue?.description,
        submissionStart: issue?.issue?.submissionStart,
        submissionsCount: submissions.length
      });

      // 按显示顺序排序作品
      const sortedSubmissions = submissions.sort((a, b) => a.displayOrder - b.displayOrder);

      // 第一个作品作为hero封面，其余作为普通展示
      const heroSubmission = sortedSubmissions[0] || null;
      const otherSubmissions = sortedSubmissions.slice(1);

      setState(prev => ({
        ...prev,
        issue,
        submissions: sortedSubmissions,
        heroSubmission,
        otherSubmissions,
        isLoading: false,
        error: null,
      }));

      console.log('✅ Issue detail loaded successfully', {
        issue: issue.issue.title,
        totalSubmissions: submissions.length,
        hasHero: !!heroSubmission
      });
    } catch (error) {
      console.error('❌ Failed to load issue detail:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load issue detail',
      }));
    }
  }, [issueId]);

  // 组件挂载时加载数据
  useEffect(() => {
    if (issueId) {
      loadIssueData();
    }
  }, [issueId, loadIssueData]);

  // 返回Gallery首页
  const handleGoBack = () => {
    router.push('/gallery');
  };

  // 重试处理
  const handleRetry = () => {
    loadIssueData();
  };

  // 格式化日期显示
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  // 加载状态
  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* 页面内容区域 - 为顶部导航栏留出空间 */}
        <div className="pt-4">
          {/* Back按钮骨架 */}
          <div className="container mx-auto px-4 py-2">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
          </div>

          {/* 标题和信息骨架 */}
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto text-center">
              {/* 大标题骨架 */}
              <div className="h-12 md:h-16 bg-gray-200 dark:bg-gray-700 rounded w-96 mx-auto mb-6 animate-pulse"></div>

              {/* 描述骨架 */}
              <div className="space-y-3 mb-8">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full mx-auto animate-pulse"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto animate-pulse"></div>
              </div>

              {/* 时间信息骨架 */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Hero区域骨架 */}
          <div className="h-[60vh] bg-gray-200 dark:bg-gray-700 animate-pulse mb-12"></div>

          {/* 作品网格骨架 */}
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse">
                  <div className="aspect-[4/3] rounded-t-lg bg-gray-300 dark:bg-gray-600"></div>
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (state.error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Failed to Load Issue
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {state.error}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={handleRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button variant="secondary" onClick={handleGoBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 空状态
  if (!state.issue || state.submissions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No Gallery Images Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This issue doesn&apos;t have any gallery images yet.
          </p>
          <Button onClick={handleGoBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Gallery
          </Button>
        </div>
      </div>
    );
  }

  // 主详情页视图
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 页面内容区域 - 为顶部导航栏留出空间 */}
      <div className="pt-4">
        {/* Back to Gallery 按钮 */}
        <div className="container mx-auto px-4 py-2">
          <Button variant="ghost" size="sm" onClick={handleGoBack}>
            <ArrowLeft className="w-5 h-5" />
            <span className="font-sans">Back to Gallery</span>
          </Button>
        </div>

        {/* Issue 标题和信息区域 */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Issue 大标题 */}
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              {state.issue?.issue?.title || 'Loading...'}
            </h1>

            {/* Issue 描述 */}
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              {state.issue?.issue?.description || 'Loading description...'}
            </p>

            {/* Submission 和 Voting 时间段 */}
            {state.issue?.issue && (
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 text-sm md:text-base text-gray-500 dark:text-gray-400">
                <div className="flex flex-col md:flex-row items-center gap-2">
                  <span className="font-medium">Submission Period:</span>
                  <span>{formatDate(state.issue.issue.submissionStart)} - {formatDate(state.issue.issue.submissionEnd)}</span>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-2">
                  <span className="font-medium">Voting Period:</span>
                  <span>{formatDate(state.issue.issue.votingStart)} - {formatDate(state.issue.issue.votingEnd)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hero封面区域 */}
        {state.heroSubmission && (
          <GallerySubmissionCard
            submission={state.heroSubmission}
            isHero={true}
          />
        )}

        {/* 其他作品展示区域 - 垂直排列 */}
        {state.otherSubmissions.length > 0 && (
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-5xl mx-auto space-y-16">
              {state.otherSubmissions.map((submission) => (
                <GallerySubmissionCard
                  key={`${submission.itemType || 'SUBMISSION'}-${submission.orderId || submission.submissionId || submission.id}`}
                  submission={submission}
                  isHero={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* 页面底部空白区域 */}
        <div className="h-16"></div>
      </div>
    </div>
  );
}
