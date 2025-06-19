'use client';

import React, { useState, useEffect } from 'react';
import { Save, Trash2, Eye, AlertCircle, RefreshCw, Settings, ImageIcon, BookOpen, Layers } from 'lucide-react';
import Link from 'next/link';
import { 
  getActiveConfig, 
  getAllConfigs, 
  saveConfig, 
  deleteConfig,
  validateSubmissionIds,
  generateDisplayOrder,
  formatSubmissionIds
} from '@/api/gallery/galleryApi';
import {
  GalleryFeaturedConfig,
  SaveConfigRequest,
  SubmissionPreviewResponse,
  AdminFormState
} from '@/api/gallery/types';
import { Button } from '@/components/ui/Button';

interface AdminPageState {
  configs: GalleryFeaturedConfig[];
  activeConfig: GalleryFeaturedConfig | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  successMessage: string | null;
  previewData: SubmissionPreviewResponse | null;
  isPreviewLoading: boolean;
}

/**
 * Admin page for managing gallery featured configurations
 * Requires admin authentication
 */
export default function GallerySettingsPage() {
  const [state, setState] = useState<AdminPageState>({
    configs: [],
    activeConfig: null,
    isLoading: true,
    isSaving: false,
    error: null,
    successMessage: null,
    previewData: null,
    isPreviewLoading: false,
  });

  const [formData, setFormData] = useState<AdminFormState>({
    submissionIds: '',
    configTitle: 'Featured Gallery Configuration',
    configDescription: '',
    autoplayInterval: 5000,
    isActive: true,
    errors: {},
  });

  const [editingConfigId, setEditingConfigId] = useState<number | null>(null);

  // Load all configurations
  const loadConfigs = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const [configsResponse, activeConfigResponse] = await Promise.all([
        getAllConfigs(),
        getActiveConfig()
      ]);

      setState(prev => ({
        ...prev,
        configs: configsResponse.configs,
        activeConfig: activeConfigResponse.config,
        isLoading: false,
      }));

      console.log('✅ Gallery configs loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load gallery configs:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load configurations',
      }));
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadConfigs();
  }, []);

  // Validate form data
  const validateForm = (): boolean => {
    const errors: AdminFormState['errors'] = {};

    // Validate submission IDs
    const { isValid, errors: idErrors } = validateSubmissionIds(formData.submissionIds);
    if (!isValid) {
      errors.submissionIds = idErrors.join(', ');
    }

    // Validate title
    if (!formData.configTitle.trim()) {
      errors.configTitle = 'Configuration title is required';
    }

    // Validate autoplay interval
    if (formData.autoplayInterval < 1000 || formData.autoplayInterval > 30000) {
      errors.autoplayInterval = 'Autoplay interval must be between 1000ms and 30000ms';
    }

    setFormData(prev => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSaveConfig = async () => {
    if (!validateForm()) return;

    try {
      setState(prev => ({ ...prev, isSaving: true, error: null, successMessage: null }));

      const { ids } = validateSubmissionIds(formData.submissionIds);
      
      const configRequest: SaveConfigRequest = {
        id: editingConfigId || undefined,
        submissionIds: ids,
        displayOrder: generateDisplayOrder(ids),
        autoplayInterval: formData.autoplayInterval,
        isActive: formData.isActive,
        configTitle: formData.configTitle.trim(),
        configDescription: formData.configDescription.trim() || undefined,
      };

      const response = await saveConfig(configRequest);

      setState(prev => ({
        ...prev,
        isSaving: false,
        successMessage: response.message,
      }));

      // Reset form and reload configs
      setFormData({
        submissionIds: '',
        configTitle: 'Featured Gallery Configuration',
        configDescription: '',
        autoplayInterval: 5000,
        isActive: true,
        errors: {},
      });
      setEditingConfigId(null);
      
      await loadConfigs();
      
      console.log('✅ Config saved successfully');
    } catch (error) {
      console.error('❌ Failed to save config:', error);
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to save configuration',
      }));
    }
  };

  // Handle config deletion
  const handleDeleteConfig = async (configId: number) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;

    try {
      setState(prev => ({ ...prev, error: null, successMessage: null }));
      
      await deleteConfig(configId);
      
      setState(prev => ({
        ...prev,
        successMessage: 'Configuration deleted successfully',
      }));
      
      await loadConfigs();
      
      console.log('✅ Config deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete config:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete configuration',
      }));
    }
  };

  // Handle edit config
  const handleEditConfig = (config: GalleryFeaturedConfig) => {
    setFormData({
      submissionIds: formatSubmissionIds(config.submissionIds),
      configTitle: config.configTitle,
      configDescription: config.configDescription || '',
      autoplayInterval: config.autoplayInterval,
      isActive: config.isActive,
      errors: {},
    });
    setEditingConfigId(config.id);
  };



  // Reset form
  const resetForm = () => {
    setFormData({
      submissionIds: '',
      configTitle: 'Featured Gallery Configuration',
      configDescription: '',
      autoplayInterval: 5000,
      isActive: true,
      errors: {},
    });
    setEditingConfigId(null);
    setState(prev => ({ ...prev, successMessage: null, error: null }));
  };

  // Clear messages
  const clearMessages = () => {
    setState(prev => ({ ...prev, error: null, successMessage: null }));
  };

  const inputClass = "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400";
  const textareaClass = "flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-vertical dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:ring-blue-400";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gallery Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure gallery display settings
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <div className="whitespace-nowrap py-2 px-1 border-b-2 border-blue-500 font-medium text-sm text-blue-600 dark:text-blue-400">
              <Layers className="w-4 h-4 inline mr-2" />
              Featured Carousel
            </div>
            <Link
              href="/account/gallery-settings/issues"
              className="whitespace-nowrap py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              Issue Management
            </Link>
          </nav>
        </div>

        {/* Featured Carousel Section */}
        <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Featured Carousel Configuration
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            This section manages the featured carousel that appears at the top of the gallery homepage. 
            Configure which submissions are displayed as featured content with automatic slideshow functionality.
          </p>
        </div>

        {/* Error/Success Messages */}
        {state.error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
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
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center">
              <Settings className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingConfigId ? 'Edit Configuration' : 'Create Configuration'}
              </h2>
              {editingConfigId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {/* Submission IDs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Submission IDs
                </label>
                <input
                  type="text"
                  placeholder="e.g., 123, 456, 789"
                  value={formData.submissionIds}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, submissionIds: e.target.value }))}
                  className={`${inputClass} ${formData.errors.submissionIds ? 'border-red-500' : ''}`}
                />
                {formData.errors.submissionIds && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {formData.errors.submissionIds}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Enter submission IDs separated by commas
                </p>
              </div>

              {/* Configuration Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Configuration Title
                </label>
                <input
                  type="text"
                  value={formData.configTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, configTitle: e.target.value }))}
                  className={`${inputClass} ${formData.errors.configTitle ? 'border-red-500' : ''}`}
                />
                {formData.errors.configTitle && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {formData.errors.configTitle}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.configDescription}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, configDescription: e.target.value }))}
                  rows={3}
                  placeholder="Optional description for this configuration"
                  className={textareaClass}
                />
              </div>

              {/* Autoplay Interval */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Autoplay Interval (ms)
                </label>
                <input
                  type="number"
                  min="1000"
                  max="30000"
                  step="500"
                  value={formData.autoplayInterval}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, autoplayInterval: parseInt(e.target.value) || 5000 }))}
                  className={`${inputClass} ${formData.errors.autoplayInterval ? 'border-red-500' : ''}`}
                />
                {formData.errors.autoplayInterval && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {formData.errors.autoplayInterval}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Time between slides (1000ms - 30000ms)
                </p>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Set as active configuration
                </label>
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSaveConfig}
                disabled={state.isSaving}
                className="w-full"
              >
                {state.isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingConfigId ? 'Update Configuration' : 'Save Configuration'}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Existing Configurations */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Existing Configurations
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadConfigs}
                disabled={state.isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${state.isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {state.isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : state.configs.length === 0 ? (
              <div className="text-center py-8">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No configurations found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {state.configs.map((config) => (
                  <div
                    key={config.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      config.isActive
                        ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {config.configTitle}
                          </h3>
                          {config.isActive && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {config.featuredCount} submissions • {config.autoplayInterval}ms interval
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          IDs: {formatSubmissionIds(config.submissionIds)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditConfig(config)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteConfig(config.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Note: Metadata export removed due to "use client" directive
// SEO metadata should be handled at layout level or through generateMetadata function 