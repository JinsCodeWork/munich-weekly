'use client';

import { Plus, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useGalleryIssueAdmin } from '@/hooks/useGalleryIssueAdmin';
import { CreateIssueConfigForm } from '@/components/gallery/admin/CreateIssueConfigForm';
import { IssueConfigTable } from '@/components/gallery/admin/IssueConfigTable';

/**
 * Admin shell for gallery issue configuration CRUD.
 * Data and actions live in useGalleryIssueAdmin; UI is props-driven sections.
 */
export default function GalleryIssueManagementPage() {
  const {
    state,
    showCreateForm,
    setShowCreateForm,
    formData,
    setFormData,
    uploadingCoverId,
    loadData,
    handleCreateConfig,
    handleTogglePublished,
    handleDeleteConfig,
    handleCoverUpload,
    handleManageSubmissions,
    clearMessages,
  } = useGalleryIssueAdmin();

  return (
    <div className="space-y-6">
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
          <Button variant="ghost" size="sm" onClick={loadData} disabled={state.isLoading}>
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
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
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
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {state.successMessage}
                  </p>
                </div>
                <button
                  onClick={clearMessages}
                  className="ml-3 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showCreateForm && (
        <CreateIssueConfigForm
          availableIssues={state.availableIssues}
          formData={formData}
          setFormData={setFormData}
          onCreate={handleCreateConfig}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      <IssueConfigTable
        galleryConfigs={state.galleryConfigs}
        isLoading={state.isLoading}
        uploadingCoverId={uploadingCoverId}
        onCoverUpload={handleCoverUpload}
        onManageSubmissions={handleManageSubmissions}
        onTogglePublished={handleTogglePublished}
        onDelete={handleDeleteConfig}
      />
    </div>
  );
}
