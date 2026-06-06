'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, GripVertical, Save, RefreshCw, AlertCircle, CheckCircle, ImageIcon, Award, Plus, Upload, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  getAdminIssueSubmissions,
  getGalleryConfigs,
  getSelectedSubmissions,
  updateSubmissionOrderByIssueId,
  uploadCustomGalleryImageByIssueId
} from '@/api/gallery/galleryApi';
import {
  GalleryIssueConfig,
  GallerySubmission,
  SubmissionOrderUpdate
} from '@/api/gallery/types';

interface SubmissionOrderPageState {
  config: GalleryIssueConfig | null;
  availableSubmissions: GallerySubmission[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  successMessage: string | null;
  hasChanges: boolean;
}

interface DraggableSubmission extends GallerySubmission {
  tempOrder: number;
}

interface CustomImageUploadState {
  isOpen: boolean;
  file: File | null;
  title: string;
  description: string;
  isUploading: boolean;
  error: string | null;
}

const initialCustomUploadState: CustomImageUploadState = {
  isOpen: false,
  file: null,
  title: '',
  description: '',
  isUploading: false,
  error: null,
};

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
    availableSubmissions: [],
    isLoading: true,
    isSaving: false,
    error: null,
    successMessage: null,
    hasChanges: false,
  });

  const [orderedSubmissions, setOrderedSubmissions] = useState<DraggableSubmission[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [customUpload, setCustomUpload] = useState<CustomImageUploadState>(initialCustomUploadState);

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

      const [submissions, availableSubmissions] = await Promise.all([
        getAdminIssueSubmissions(config.issueId),
        getSelectedSubmissions(config.issueId),
      ]);

      setState(prev => ({
        ...prev,
        config,
        availableSubmissions,
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
  const getGalleryItemKey = (submission: GallerySubmission) => {
    return `${submission.itemType || 'SUBMISSION'}-${submission.orderId || submission.submissionId || submission.id}`;
  };

  const normalizeTempOrders = (submissions: DraggableSubmission[]) => {
    return submissions.map((sub, index) => ({
      ...sub,
      tempOrder: index + 1,
      displayOrder: index + 1,
    }));
  };

  const handleDragStart = (e: React.DragEvent, itemKey: string) => {
    setDraggedItem(itemKey);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, targetItemKey: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetItemKey) {
      setDraggedItem(null);
      return;
    }

    const draggedIndex = orderedSubmissions.findIndex(s => getGalleryItemKey(s) === draggedItem);
    const targetIndex = orderedSubmissions.findIndex(s => getGalleryItemKey(s) === targetItemKey);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
      return;
    }

    const newOrderedSubmissions = [...orderedSubmissions];
    const [draggedSubmission] = newOrderedSubmissions.splice(draggedIndex, 1);
    newOrderedSubmissions.splice(targetIndex, 0, draggedSubmission);

    // Update temp orders
    setOrderedSubmissions(normalizeTempOrders(newOrderedSubmissions));
    setState(prev => ({ ...prev, hasChanges: true }));
    setDraggedItem(null);
  };

  // Handle manual order change
  const handleOrderChange = (itemKey: string, newOrder: number) => {
    if (newOrder < 1 || newOrder > orderedSubmissions.length) return;

    const currentSubmission = orderedSubmissions.find(s => getGalleryItemKey(s) === itemKey);
    if (!currentSubmission) return;

    const newOrderedSubmissions = orderedSubmissions.map(sub => {
      if (getGalleryItemKey(sub) === itemKey) {
        return { ...sub, tempOrder: newOrder };
      }
      return sub;
    });

    // Re-sort and update all orders
    newOrderedSubmissions.sort((a, b) => a.tempOrder - b.tempOrder);
    setOrderedSubmissions(normalizeTempOrders(newOrderedSubmissions));
    setState(prev => ({ ...prev, hasChanges: true }));
  };

  const handleAddSubmission = (submission: GallerySubmission) => {
    setOrderedSubmissions(prev => {
      const nextOrder = prev.length + 1;
      return [
        ...prev,
        {
          ...submission,
          displayOrder: nextOrder,
          tempOrder: nextOrder
        }
      ];
    });

    setState(prev => ({
      ...prev,
      availableSubmissions: prev.availableSubmissions.filter(sub => sub.id !== submission.id),
      hasChanges: true,
    }));
  };

  const handleRemoveItem = (submission: DraggableSubmission) => {
    const itemKey = getGalleryItemKey(submission);

    setOrderedSubmissions(prev => normalizeTempOrders(
      prev.filter(item => getGalleryItemKey(item) !== itemKey)
    ));

    if (!submission.isCustomImage) {
      setState(prev => {
        const alreadyAvailable = prev.availableSubmissions.some(
          item => (item.submissionId || item.id) === (submission.submissionId || submission.id)
        );

        return {
          ...prev,
          availableSubmissions: alreadyAvailable
            ? prev.availableSubmissions
            : [...prev.availableSubmissions, submission],
          hasChanges: true,
        };
      });
      return;
    }

    setState(prev => ({ ...prev, hasChanges: true }));
  };

  const getDefaultCustomImageTitle = (displayOrder = orderedSubmissions.length + 1) => {
    return String(displayOrder);
  };

  const handleOpenCustomUpload = () => {
    setCustomUpload({
      ...initialCustomUploadState,
      isOpen: true,
      title: getDefaultCustomImageTitle(),
    });
  };

  const handleCloseCustomUpload = () => {
    if (customUpload.isUploading) return;
    setCustomUpload(initialCustomUploadState);
  };

  const handleUploadCustomImage = async () => {
    if (!state.config || !customUpload.file) {
      setCustomUpload(prev => ({ ...prev, error: 'Please choose an image file' }));
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(customUpload.file.type)) {
      setCustomUpload(prev => ({ ...prev, error: 'Only JPG and PNG images are supported' }));
      return;
    }

    const maxSize = 20 * 1024 * 1024;
    if (customUpload.file.size > maxSize) {
      setCustomUpload(prev => ({ ...prev, error: 'Image must be 20MB or smaller' }));
      return;
    }

    try {
      setCustomUpload(prev => ({ ...prev, isUploading: true, error: null }));

      const defaultTitle = getDefaultCustomImageTitle();
      const trimmedTitle = customUpload.title.trim();
      const title = trimmedTitle && trimmedTitle !== defaultTitle ? trimmedTitle : undefined;
      const description = customUpload.description.trim() || undefined;

      const uploadedImage = await uploadCustomGalleryImageByIssueId(
        state.config.issueId,
        customUpload.file,
        {
          title,
          description,
        }
      );

      setOrderedSubmissions(prev => normalizeTempOrders([
        ...prev,
        {
          ...uploadedImage,
          tempOrder: prev.length + 1,
        },
      ]));

      setState(prev => ({
        ...prev,
        hasChanges: true,
        successMessage: 'Custom image uploaded. Save the order to keep the current arrangement.',
      }));
      setCustomUpload(initialCustomUploadState);
    } catch (error) {
      setCustomUpload(prev => ({
        ...prev,
        isUploading: false,
        error: error instanceof Error ? error.message : 'Failed to upload custom image',
      }));
    }
  };

  // Save submission order
  const handleSaveOrder = async () => {
    if (!state.config) return;

    try {
      setState(prev => ({ ...prev, isSaving: true, error: null, successMessage: null }));

      const orderUpdates: SubmissionOrderUpdate[] = orderedSubmissions.map((sub, index) => ({
        galleryOrderId: sub.orderId,
        submissionId: sub.isCustomImage ? undefined : (sub.submissionId || sub.id),
        itemType: sub.itemType || 'SUBMISSION',
        displayOrder: index + 1
      }));

      await updateSubmissionOrderByIssueId(state.config.issueId, orderUpdates);

      setState(prev => ({
        ...prev,
        isSaving: false,
        hasChanges: false,
        successMessage: 'Gallery order updated successfully',
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
    void loadData();
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
      title: submission.title || (submission.isCustomImage ? String(submission.displayOrder) : 'Untitled'),
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
            Failed to Load Gallery Items
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
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
              Manage Gallery Order
            </h1>
            {state.config && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {state.config.issue.title} • {orderedSubmissions.length} gallery items
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenCustomUpload}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Custom Image
          </Button>

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
          How to reorder gallery items:
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Drag and drop gallery items to reorder them</li>
          <li>• Or use the order number input to set specific positions</li>
          <li>• The first item will be displayed as the hero image</li>
          <li>• Custom images are not shown as submitted photography works</li>
        </ul>
      </div>

      {/* Available Selected Submissions */}
      {state.availableSubmissions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Available Selected Submissions ({state.availableSubmissions.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {state.availableSubmissions.map((submission) => {
              const info = formatSubmissionInfo(submission);

              return (
                <div key={submission.id} className="p-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 relative">
                    <Image
                      src={submission.thumbnailUrl || submission.imageUrl}
                      alt={info.title}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {info.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      By {info.author}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddSubmission(submission)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Submissions List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Gallery Items ({orderedSubmissions.length})
          </h2>
        </div>

        {orderedSubmissions.length === 0 ? (
          <div className="p-6 text-center">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No gallery items found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Add selected submissions or upload a custom image
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {orderedSubmissions.map((submission, index) => {
              const info = formatSubmissionInfo(submission);
              const isHero = index === 0;
              const itemKey = getGalleryItemKey(submission);
              
              return (
                <div
                  key={itemKey}
                  draggable
                  onDragStart={(e) => handleDragStart(e, itemKey)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, itemKey)}
                  className={`p-6 transition-colors cursor-move hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    draggedItem === itemKey ? 'opacity-50' : ''
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
                        onChange={(e) => handleOrderChange(itemKey, parseInt(e.target.value) || 1)}
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
                        {submission.isCustomImage && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                            Custom Image
                          </span>
                        )}
                      </div>
                      
                      {!submission.isCustomImage && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          By {info.author}
                        </p>
                      )}
                      
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

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(submission)}
                      title="Remove from gallery"
                      aria-label="Remove from gallery"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={customUpload.isOpen}
        onClose={handleCloseCustomUpload}
        contentVariant="default"
        className="max-h-[calc(100vh-2rem)] w-[min(92vw,760px)] overflow-hidden bg-white dark:bg-gray-800"
      >
        <div className="flex max-h-[calc(100vh-2rem)] flex-col">
          <div className="flex items-start justify-between gap-6 border-b border-gray-200 px-6 py-5 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold leading-tight text-gray-900 dark:text-white">
                Upload Custom Image
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Add an admin-managed image to this issue gallery.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseCustomUpload}
              className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
              aria-label="Close upload dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto px-6 py-6 md:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Image
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  PNG or JPEG up to 20MB.
                </p>
              </div>
              <ImageUploader
                file={customUpload.file}
                onFileSelected={(file) => setCustomUpload(prev => ({ ...prev, file, error: null }))}
                maxFileSize={20 * 1024 * 1024}
                allowedTypes={['image/jpeg', 'image/png']}
                maxImagesMessage="Custom images are gallery-only and will not show submitter details."
              />
            </div>

            <div className="space-y-5">
              {customUpload.error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                  <p className="text-sm text-red-800 dark:text-red-200">{customUpload.error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Title
                </label>
                <Input
                  type="text"
                  maxLength={200}
                  value={customUpload.title}
                  onChange={(event) => setCustomUpload(prev => ({ ...prev, title: event.target.value }))}
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Description
                </label>
                <Textarea
                  rows={5}
                  value={customUpload.description}
                  onChange={(event) => setCustomUpload(prev => ({ ...prev, description: event.target.value }))}
                  placeholder="Optional"
                  className="min-h-32"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900/40">
            <Button
              variant="ghost"
              onClick={handleCloseCustomUpload}
              disabled={customUpload.isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadCustomImage}
              disabled={!customUpload.file || customUpload.isUploading}
            >
              {customUpload.isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Changes indicator */}
      {state.hasChanges && (
        <div className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">You have unsaved changes</p>
        </div>
      )}
    </div>
  );
}
