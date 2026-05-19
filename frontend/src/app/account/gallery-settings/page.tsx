'use client';

import Link from 'next/link';
import { AlertCircle, Settings, BookOpen, Layers } from 'lucide-react';
import { useFeaturedGalleryAdmin } from '@/hooks/useFeaturedGalleryAdmin';
import { FeaturedConfigForm } from '@/components/gallery/admin/FeaturedConfigForm';
import { FeaturedConfigList } from '@/components/gallery/admin/FeaturedConfigList';

/**
 * Admin shell for featured gallery carousel configuration.
 * Data and actions live in useFeaturedGalleryAdmin; UI is props-driven sections.
 */
export default function GallerySettingsPage() {
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
