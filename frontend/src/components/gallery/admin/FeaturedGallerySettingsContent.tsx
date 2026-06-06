'use client';

import { AlertCircle, Settings } from 'lucide-react';
import { useFeaturedGalleryAdmin } from '@/hooks/useFeaturedGalleryAdmin';
import { FeaturedConfigForm } from '@/components/gallery/admin/FeaturedConfigForm';
import { FeaturedConfigList } from '@/components/gallery/admin/FeaturedConfigList';
import { GallerySettingsTabs } from '@/components/gallery/admin/GallerySettingsTabs';

/**
 * Admin shell for featured gallery carousel configuration.
 * Data and actions live in useFeaturedGalleryAdmin; UI is props-driven sections.
 */
export function FeaturedGallerySettingsContent() {
  const {
    state,
    formData,
    setFormData,
    editingConfigId,
    loadConfigs,
    handleSaveConfig,
    handleDeleteConfig,
    handleEditConfig,
    resetForm,
    clearMessages,
  } = useFeaturedGalleryAdmin();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gallery Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure gallery display settings
          </p>
        </div>

        <GallerySettingsTabs activeTab="featured" />

        <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Featured Carousel Configuration
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            This section manages the featured carousel that appears at the top of the gallery homepage.
            Configure which submissions are displayed as featured content with automatic slideshow functionality.
          </p>
        </div>

        {state.error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
              <p className="text-red-800 dark:text-red-200">{state.error}</p>
              <button
                onClick={clearMessages}
                className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
              >
                &times;
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
                &times;
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <FeaturedConfigForm
            formData={formData}
            setFormData={setFormData}
            editingConfigId={editingConfigId}
            isSaving={state.isSaving}
            onSave={handleSaveConfig}
            onReset={resetForm}
          />
          <FeaturedConfigList
            configs={state.configs}
            isLoading={state.isLoading}
            onRefresh={loadConfigs}
            onEdit={handleEditConfig}
            onDelete={handleDeleteConfig}
          />
        </div>
      </div>
    </div>
  );
}
