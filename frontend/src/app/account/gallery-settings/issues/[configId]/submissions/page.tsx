'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, GripVertical, Save, RefreshCw, AlertCircle, CheckCircle, ImageIcon, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  getGalleryConfigs,
  getIssueSubmissions,
  updateSubmissionOrderByIssueId
} from '@/api/gallery/galleryApi';
import {
  GalleryIssueConfig,
  GallerySubmission,
  SubmissionOrderUpdate
} from '@/api/gallery/types';

interface SubmissionOrderPageState {
  config: GalleryIssueConfig | null;
  submissions: GallerySubmission[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  successMessage: string | null;
  hasChanges: boolean;
}

interface DraggableSubmission extends GallerySubmission {
  tempOrder: number;
}

/**
 * Submission Order Management Page
 * Allows admins to reorder selected submissions within a gallery issue
 */
export default function SubmissionOrderPage() {
  const params = useParams();
  const router = useRouter();
  const configId = parseInt(params.configId as string);

  const [state, setState] = useState<SubmissionOrderPageState>({
    config: null,
    submissions: [],
    isLoading: true,
    isSaving: false,
    error: null,
    successMessage: null,
    hasChanges: false,
  });

  const [orderedSubmissions, setOrderedSubmissions] = useState<DraggableSubmission[]>([]);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  // Load config and submissions data
  const loadData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const [configs] = await Promise.all([
        getGalleryConfigs()
      ]);

      const config = configs.find(c => c.id === configId);
      if (!config) {
        throw new Error('Gallery configuration not found');
      }

      const submissions = await getIssueSubmissions(config.issueId);

      setState(prev => ({
        ...prev,
        config,
        submissions,
        isLoading: false,
        hasChanges: false,
      }));

      // Initialize ordered submissions with temp order
      const orderedSubs: DraggableSubmission[] = submissions.map((sub: GallerySubmission, index: number) => ({
        ...sub,
        tempOrder: sub.displayOrder || index + 1
      }));
      
      orderedSubs.sort((a, b) => a.tempOrder - b.tempOrder);
      setOrderedSubmissions(orderedSubs);

      console.log('✅ Submission order data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load submission order data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
      }));
    }
  }, [configId]);

  // Load data on component mount
  useEffect(() => {
    if (configId) {
      loadData();
    }
  }, [configId, loadData]);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, submissionId: number) => {
    setDraggedItem(submissionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, targetSubmissionId: number) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetSubmissionId) {
      setDraggedItem(null);
      return;
    }

    const draggedIndex = orderedSubmissions.findIndex(s => s.id === draggedItem);
    const targetIndex = orderedSubmissions.findIndex(s => s.id === targetSubmissionId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
      return;
    }

    const newOrderedSubmissions = [...orderedSubmissions];
    const [draggedSubmission] = newOrderedSubmissions.splice(draggedIndex, 1);
    newOrderedSubmissions.splice(targetIndex, 0, draggedSubmission);

    // Update temp orders
    const updatedSubmissions = newOrderedSubmissions.map((sub, index) => ({
      ...sub,
      tempOrder: index + 1
    }));

    setOrderedSubmissions(updatedSubmissions);
    setState(prev => ({ ...prev, hasChanges: true }));
    setDraggedItem(null);
  };

  // Handle manual order change
  const handleOrderChange = (submissionId: number, newOrder: number) => {
    if (newOrder < 1 || newOrder > orderedSubmissions.length) return;

    const currentSubmission = orderedSubmissions.find(s => s.id === submissionId);
    if (!currentSubmission) return;

    const newOrderedSubmissions = orderedSubmissions.map(sub => {
      if (sub.id === submissionId) {
        return { ...sub, tempOrder: newOrder };
      }
      return sub;
    });

    // Re-sort and update all orders
    newOrderedSubmissions.sort((a, b) => a.tempOrder - b.tempOrder);
    const finalOrderedSubmissions = newOrderedSubmissions.map((sub, index) => ({
      ...sub,
      tempOrder: index + 1
    }));

    setOrderedSubmissions(finalOrderedSubmissions);
    setState(prev => ({ ...prev, hasChanges: true }));
  };

  // Save submission order
  const handleSaveOrder = async () => {
    if (!state.config) return;

    try {
      setState(prev => ({ ...prev, isSaving: true, error: null, successMessage: null }));

      const orderUpdates: SubmissionOrderUpdate[] = orderedSubmissions.map((sub, index) => ({
        submissionId: sub.id,
        displayOrder: index + 1
      }));

      await updateSubmissionOrderByIssueId(state.config.issueId, orderUpdates);

      setState(prev => ({
        ...prev,
        isSaving: false,
        hasChanges: false,
        successMessage: 'Submission order updated successfully',
      }));

      // Reload data to reflect changes
      await loadData();
    } catch (error) {
      console.error('❌ Failed to save submission order:', error);
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to save order',
      }));
    }
  };

  // Reset to original order
  const handleResetOrder = () => {
    if (!state.submissions.length) return;

    const resetSubmissions: DraggableSubmission[] = state.submissions.map((sub, index) => ({
      ...sub,
      tempOrder: sub.displayOrder || index + 1
    }));
    
    resetSubmissions.sort((a, b) => a.tempOrder - b.tempOrder);
    setOrderedSubmissions(resetSubmissions);
    setState(prev => ({ ...prev, hasChanges: false }));
  };

  // Go back to issues list
  const handleGoBack = () => {
    if (state.hasChanges && !confirm('You have unsaved changes. Are you sure you want to leave?')) {
      return;
    }
    router.push('/account/gallery-settings/issues');
  };

  // Clear messages
  const clearMessages = () => {
    setState(prev => ({ ...prev, error: null, successMessage: null }));
  };

  // Format submission info for display
  const formatSubmissionInfo = (submission: GallerySubmission) => {
    return {
      title: submission.title || 'Untitled',
      author: submission.authorName,
      status: submission.status
    };
  };

  if (state.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg animate-pulse">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Issues
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Load Submissions
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {state.error}
          </p>
          <div className="space-x-4">
            <Button onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button variant="ghost" onClick={handleGoBack}>
              Back to Issues
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Issues
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Manage Submission Order
            </h1>
            {state.config && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {state.config.issue.title} • {orderedSubmissions.length} submissions
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {state.hasChanges && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetOrder}
            >
              Reset
            </Button>
          )}
          
          <Button
            onClick={handleSaveOrder}
            disabled={!state.hasChanges || state.isSaving}
          >
            {state.isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Order
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Messages */}
      {state.error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-red-800 dark:text-red-200">{state.error}</p>
            <button
              onClick={clearMessages}
              className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {state.successMessage && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
            <p className="text-green-800 dark:text-green-200">{state.successMessage}</p>
            <button
              onClick={clearMessages}
              className="ml-auto text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          How to reorder submissions:
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Drag and drop submissions to reorder them</li>
          <li>• Or use the order number input to set specific positions</li>
          <li>• The first submission will be displayed as the hero image</li>
          <li>• Only submissions with &lsquo;selected&rsquo; status are shown here</li>
        </ul>
      </div>

      {/* Submissions List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Selected Submissions ({orderedSubmissions.length})
          </h2>
        </div>

        {orderedSubmissions.length === 0 ? (
          <div className="p-6 text-center">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No selected submissions found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Submissions must have &lsquo;selected&rsquo; status to appear in the gallery
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {orderedSubmissions.map((submission, index) => {
              const info = formatSubmissionInfo(submission);
              const isHero = index === 0;
              
              return (
                <div
                  key={submission.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, submission.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, submission.id)}
                  className={`p-6 transition-colors cursor-move hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    draggedItem === submission.id ? 'opacity-50' : ''
                  } ${isHero ? 'bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-400' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Drag Handle */}
                    <div className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      <GripVertical className="w-5 h-5" />
                    </div>

                    {/* Order Number Input */}
                    <div className="w-16">
                      <input
                        type="number"
                        min="1"
                        max={orderedSubmissions.length}
                        value={submission.tempOrder}
                        onChange={(e) => handleOrderChange(submission.id, parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    {/* Submission Preview */}
                    <div className="w-16 h-16 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 relative">
                      <Image
                        src={submission.thumbnailUrl || submission.imageUrl}
                        alt={info.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>

                    {/* Submission Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {info.title}
                        </h3>
                        {isHero && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                            <Award className="w-3 h-3 mr-1" />
                            Hero Image
                          </span>
                        )}
                        {info.status === 'cover' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                            Cover
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        By {info.author}
                      </p>
                      
                      {submission.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-500 truncate mt-1">
                          {submission.description}
                        </p>
                      )}
                    </div>

                    {/* Position Info */}
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Position {submission.tempOrder}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        of {orderedSubmissions.length}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Changes indicator */}
      {state.hasChanges && (
        <div className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">You have unsaved changes</p>
        </div>
      )}
    </div>
  );
} 