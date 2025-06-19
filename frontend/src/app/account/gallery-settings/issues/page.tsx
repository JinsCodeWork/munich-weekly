'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, RefreshCw, BookOpen, AlertCircle, CheckCircle, Eye, ArrowUpDown, Circle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import {
  getGalleryConfigs,
  getAvailableIssues,
  createGalleryConfig,
  updateGalleryConfigByIssueId,
  deleteGalleryConfigByIssueId,
  uploadCoverImageByIssueId
} from '@/api/gallery/galleryApi';
import {
  GalleryIssueConfig,
  AvailableIssue,
  CreateGalleryConfigRequest,
  UpdateGalleryConfigRequest
} from '@/api/gallery/types';

interface IssueManagementState {
  galleryConfigs: GalleryIssueConfig[];
  availableIssues: AvailableIssue[];
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
}

interface CreateIssueFormData {
  selectedIssueId: number | null;
  isPublished: boolean;
}

/**
 * Issue Management Page for Gallery
 * Allows admins to manage which issues are displayed in the gallery
 * Separate from Featured Carousel functionality
 */
export default function GalleryIssueManagementPage() {
  const router = useRouter();
  
  const [state, setState] = useState<IssueManagementState>({
    galleryConfigs: [],
    availableIssues: [],
    isLoading: true,
    error: null,
    successMessage: null,
  });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateIssueFormData>({
    selectedIssueId: null,
    isPublished: false,
  });

  const [uploadingCoverId, setUploadingCoverId] = useState<number | null>(null);

  // Load all data
  const loadData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // 🔧 FIX: Use admin API with auth headers for admin pages
      const [configs, available] = await Promise.all([
        getGalleryConfigs(),
        getAvailableIssues()
      ]);

      setState(prev => ({
        ...prev,
        galleryConfigs: configs,
        availableIssues: available,
        isLoading: false,
      }));

      console.log('✅ Gallery issue data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load gallery issue data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
      }));
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Prevent default drag behavior on the entire page
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
    };

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Auto-clear success messages after 5 seconds
  useEffect(() => {
    if (state.successMessage) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, successMessage: null }));
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [state.successMessage]);

  // Handle create new gallery config
  const handleCreateConfig = async () => {
    if (!formData.selectedIssueId) {
      setState(prev => ({ ...prev, error: 'Please select an issue' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, error: null, successMessage: null }));

      const request: CreateGalleryConfigRequest = {
        issueId: formData.selectedIssueId,
        isPublished: formData.isPublished,
      };

      await createGalleryConfig(request);

      setState(prev => ({
        ...prev,
        successMessage: 'Gallery configuration created successfully',
      }));

      // Reset form and reload data
      setShowCreateForm(false);
      setFormData({
        selectedIssueId: null,
        isPublished: false,
      });
      
      await loadData();
    } catch (error) {
      console.error('❌ Failed to create gallery config:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create configuration',
      }));
    }
  };

  // Handle toggle published status
  const handleTogglePublished = async (config: GalleryIssueConfig) => {
    try {
      setState(prev => ({ ...prev, error: null, successMessage: null }));

      const request: UpdateGalleryConfigRequest = {
        issueId: config.issueId,
        isPublished: !config.isPublished,
      };

      await updateGalleryConfigByIssueId(config.issueId, request);

      setState(prev => ({
        ...prev,
        successMessage: `Issue ${config.isPublished ? 'unpublished' : 'published'} successfully`,
      }));

      await loadData();
    } catch (error) {
      console.error('❌ Failed to toggle published status:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update configuration',
      }));
    }
  };

  // Handle delete configuration
  const handleDeleteConfig = async (config: GalleryIssueConfig) => {
    if (!confirm(`Are you sure you want to delete the gallery configuration for "${config.issue.title}"?`)) {
      return;
    }

    try {
      setState(prev => ({ ...prev, error: null, successMessage: null }));

      await deleteGalleryConfigByIssueId(config.issueId);

      setState(prev => ({
        ...prev,
        successMessage: 'Gallery configuration deleted successfully',
      }));

      await loadData();
    } catch (error) {
      console.error('❌ Failed to delete gallery config:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete configuration',
      }));
    }
  };

  // Handle cover image upload
  const handleCoverUpload = async (config: GalleryIssueConfig, file: File) => {
    try {
      // 前端文件验证
      if (!file) {
        setState(prev => ({
          ...prev,
          error: 'Please select a file to upload',
        }));
        return;
      }

      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setState(prev => ({
          ...prev,
          error: 'Invalid file type. Only JPG and PNG files are allowed.',
        }));
        return;
      }

      // 验证文件大小 (20MB = 20 * 1024 * 1024 bytes)
      const maxSize = 20 * 1024 * 1024;
      if (file.size > maxSize) {
        setState(prev => ({
          ...prev,
          error: `File size too large. Maximum size is 20MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
        }));
        return;
      }

      setUploadingCoverId(config.id);
      setState(prev => ({ ...prev, error: null, successMessage: null }));

      await uploadCoverImageByIssueId(config.issueId, file);

      setState(prev => ({
        ...prev,
        successMessage: `Cover image uploaded successfully! File: ${file.name}`,
      }));

      // 重新加载数据以显示新的封面图片
      await loadData();

    } catch (error) {
      console.error('❌ Failed to upload cover image:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to upload cover image. Please try again.';
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
    } finally {
      setUploadingCoverId(null);
    }
  };

  // Handle manage submissions
  const handleManageSubmissions = (config: GalleryIssueConfig) => {
    router.push(`/account/gallery-settings/issues/${config.id}/submissions`);
  };

  // Clear messages
  const clearMessages = () => {
    setState(prev => ({ ...prev, error: null, successMessage: null }));
  };

  // Get next display order


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gallery Issue Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage which issues are displayed in the public gallery
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            disabled={state.isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${state.isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            onClick={() => setShowCreateForm(true)}
            disabled={state.availableIssues.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Issue to Gallery
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {(state.error || state.successMessage) && (
        <div className="mb-6">
          {state.error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Upload Error</h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{state.error}</p>
                </div>
                <button
                  onClick={clearMessages}
                  className="ml-3 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          {state.successMessage && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Success</h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">{state.successMessage}</p>
                </div>
                <button
                  onClick={clearMessages}
                  className="ml-3 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Add Issue to Gallery
              </h3>

              <div className="space-y-4">
                {/* Issue Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Issue
                  </label>
                  <select
                    value={formData.selectedIssueId || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, selectedIssueId: parseInt(e.target.value) || null }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select an issue...</option>
                    {state.availableIssues.map((issue) => (
                      <option key={issue.id} value={issue.id}>
                        {issue.title} ({issue.selectedSubmissionCount} selected submissions)
                      </option>
                    ))}
                  </select>
                </div>



                {/* Published Status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isPublished" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Publish immediately
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <Button
                  onClick={handleCreateConfig}
                  disabled={!formData.selectedIssueId}
                  className="flex-1"
                >
                  Create Configuration
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Configurations List - Simplified Design */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Gallery Issues ({state.galleryConfigs.length})
          </h2>
        </div>

        {state.isLoading ? (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-700 rounded-lg mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        ) : state.galleryConfigs.length === 0 ? (
          <div className="p-6 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No gallery issues configured</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Add issues to display them in the public gallery
            </p>
          </div>
        ) : (
          <div className="p-6">
            {/* Grid Layout for Gallery Issues */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {state.galleryConfigs
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((config) => (
                <div key={config.id} className="group relative">
                  {/* Issue Cover Image */}
                  <div className="aspect-[3/4] relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700 mb-3">
                    {config.coverImageUrl ? (
                      <Image
                        src={config.coverImageUrl}
                        alt={config.issue.title}
                        fill
                        className="object-cover transition-all duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <Upload className="w-8 h-8 mb-2" />
                        <span className="text-sm">No Cover</span>
                      </div>
                    )}
                    
                    {/* 悬停遮罩层 */}
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                    
                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      {config.isPublished ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 shadow-sm">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 shadow-sm">
                          Draft
                        </span>
                      )}
                    </div>

                    {/* Hover Actions Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        {/* 第一排按钮 */}
                        <div className="flex items-center gap-2 sm:gap-3">
                          {/* Upload/Replace Cover */}
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleCoverUpload(config, file);
                                }
                              }}
                            />
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center hover:bg-opacity-30 transition-colors">
                              {uploadingCoverId === config.id ? (
                                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              )}
                            </div>
                          </label>

                          {/* Manage Submissions */}
                          <button
                            onClick={() => handleManageSubmissions(config)}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center hover:bg-opacity-30 transition-colors"
                            title="Manage submissions"
                          >
                            <ArrowUpDown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </button>

                          {/* View Gallery */}
                          <button
                            onClick={() => window.open(`/gallery/${config.issueId}`, '_blank')}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center hover:bg-opacity-30 transition-colors"
                            title="View in gallery"
                          >
                            <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </button>
                        </div>

                        {/* 第二排按钮 */}
                        <div className="flex items-center gap-2 sm:gap-3">
                          {/* Toggle Published Status */}
                          <button
                            onClick={() => handleTogglePublished(config)}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center hover:bg-opacity-30 transition-colors"
                            title={config.isPublished ? 'Unpublish' : 'Publish'}
                          >
                            {config.isPublished ? (
                              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                            ) : (
                              <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteConfig(config)}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-500 bg-opacity-70 backdrop-blur-sm flex items-center justify-center hover:bg-opacity-90 transition-colors"
                            title="Delete configuration"
                          >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Issue Title with Hover Underline Effect */}
                  <div className="group-hover:cursor-pointer text-center">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white relative transition-colors group-hover:text-gray-700 dark:group-hover:text-gray-300 gallery-issue-title inline-block">
                      {config.issue.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Gallery Issue Hover Styles */}
      <style jsx global>{`
        .gallery-issue-title::after {
          content: '';
          position: absolute;
          height: 1px;
          bottom: -2px;
          left: 0;
          right: 0;
          background-color: currentColor;
          transform-origin: center;
          transition: transform 0.3s ease, opacity 0.3s ease;
          transform: scaleX(0);
          opacity: 0;
        }
        
        .group:hover .gallery-issue-title::after {
          transform: scaleX(1);
          opacity: 1;
        }
      `}</style>
    </div>
  );
} 