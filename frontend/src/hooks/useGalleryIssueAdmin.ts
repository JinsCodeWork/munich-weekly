import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getGalleryConfigs,
  getAvailableIssues,
  createGalleryConfig,
  updateGalleryConfigByIssueId,
  deleteGalleryConfigByIssueId,
  uploadCoverImageByIssueId,
} from '@/api/gallery/galleryApi';
import {
  GalleryIssueConfig,
  AvailableIssue,
  CreateGalleryConfigRequest,
  UpdateGalleryConfigRequest,
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

export function useGalleryIssueAdmin() {
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

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const [configs, available] = await Promise.all([
        getGalleryConfigs(),
        getAvailableIssues(),
      ]);

      setState((prev) => ({
        ...prev,
        galleryConfigs: configs,
        availableIssues: available,
        isLoading: false,
      }));

      console.log('✅ Gallery issue data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load gallery issue data:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
      }));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  useEffect(() => {
    if (state.successMessage) {
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, successMessage: null }));
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [state.successMessage]);

  const handleCreateConfig = useCallback(async () => {
    if (!formData.selectedIssueId) {
      setState((prev) => ({ ...prev, error: 'Please select an issue' }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, error: null, successMessage: null }));

      const request: CreateGalleryConfigRequest = {
        issueId: formData.selectedIssueId,
        isPublished: formData.isPublished,
      };

      await createGalleryConfig(request);

      setState((prev) => ({
        ...prev,
        successMessage: 'Gallery configuration created successfully',
      }));

      setShowCreateForm(false);
      setFormData({
        selectedIssueId: null,
        isPublished: false,
      });

      await loadData();
    } catch (error) {
      console.error('❌ Failed to create gallery config:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create configuration',
      }));
    }
  }, [formData.isPublished, formData.selectedIssueId, loadData]);

  const handleTogglePublished = useCallback(
    async (config: GalleryIssueConfig) => {
      try {
        setState((prev) => ({ ...prev, error: null, successMessage: null }));

        const request: UpdateGalleryConfigRequest = {
          issueId: config.issueId,
          isPublished: !config.isPublished,
        };

        await updateGalleryConfigByIssueId(config.issueId, request);

        setState((prev) => ({
          ...prev,
          successMessage: `Issue ${config.isPublished ? 'unpublished' : 'published'} successfully`,
        }));

        await loadData();
      } catch (error) {
        console.error('❌ Failed to toggle published status:', error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to update configuration',
        }));
      }
    },
    [loadData],
  );

  const handleDeleteConfig = useCallback(
    async (config: GalleryIssueConfig) => {
      if (
        !confirm(
          `Are you sure you want to delete the gallery configuration for "${config.issue.title}"?`,
        )
      ) {
        return;
      }

      try {
        setState((prev) => ({ ...prev, error: null, successMessage: null }));

        await deleteGalleryConfigByIssueId(config.issueId);

        setState((prev) => ({
          ...prev,
          successMessage: 'Gallery configuration deleted successfully',
        }));

        await loadData();
      } catch (error) {
        console.error('❌ Failed to delete gallery config:', error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to delete configuration',
        }));
      }
    },
    [loadData],
  );

  const handleCoverUpload = useCallback(
    async (config: GalleryIssueConfig, file: File) => {
      try {
        if (!file) {
          setState((prev) => ({
            ...prev,
            error: 'Please select a file to upload',
          }));
          return;
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
          setState((prev) => ({
            ...prev,
            error: 'Invalid file type. Only JPG and PNG files are allowed.',
          }));
          return;
        }

        const maxSize = 20 * 1024 * 1024;
        if (file.size > maxSize) {
          setState((prev) => ({
            ...prev,
            error: `File size too large. Maximum size is 20MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
          }));
          return;
        }

        setUploadingCoverId(config.id);
        setState((prev) => ({ ...prev, error: null, successMessage: null }));

        await uploadCoverImageByIssueId(config.issueId, file);

        setState((prev) => ({
          ...prev,
          successMessage: `Cover image uploaded successfully! File: ${file.name}`,
        }));

        await loadData();
      } catch (error) {
        console.error('❌ Failed to upload cover image:', error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to upload cover image. Please try again.';

        setState((prev) => ({
          ...prev,
          error: errorMessage,
        }));
      } finally {
        setUploadingCoverId(null);
      }
    },
    [loadData],
  );

  const handleManageSubmissions = useCallback(
    (config: GalleryIssueConfig) => {
      router.push(`/account/gallery-settings/issues/${config.id}/submissions`);
    },
    [router],
  );

  const clearMessages = useCallback(() => {
    setState((prev) => ({ ...prev, error: null, successMessage: null }));
  }, []);

  return {
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
  };
}
