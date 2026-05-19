import { useState, useEffect, useCallback } from 'react';
import {
  getActiveConfig,
  getAllConfigs,
  saveConfig,
  deleteConfig,
  validateSubmissionIds,
  generateDisplayOrder,
  formatSubmissionIds,
} from '@/api/gallery/galleryApi';
import {
  GalleryFeaturedConfig,
  SaveConfigRequest,
  AdminFormState,
} from '@/api/gallery/types';

interface AdminPageState {
  configs: GalleryFeaturedConfig[];
  activeConfig: GalleryFeaturedConfig | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  successMessage: string | null;
  previewData: null;
  isPreviewLoading: boolean;
}

const defaultFormData: AdminFormState = {
  submissionIds: '',
  configTitle: 'Featured Gallery Configuration',
  configDescription: '',
  autoplayInterval: 5000,
  isActive: true,
  errors: {},
};

export function useFeaturedGalleryAdmin() {
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

  const [formData, setFormData] = useState<AdminFormState>(defaultFormData);
  const [editingConfigId, setEditingConfigId] = useState<number | null>(null);

  const loadConfigs = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const [configsResponse, activeConfigResponse] = await Promise.all([
        getAllConfigs(),
        getActiveConfig(),
      ]);

      setState((prev) => ({
        ...prev,
        configs: configsResponse.configs,
        activeConfig: activeConfigResponse.config,
        isLoading: false,
      }));

      console.log('✅ Gallery configs loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load gallery configs:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load configurations',
      }));
    }
  }, []);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const validateForm = useCallback((): boolean => {
    const errors: AdminFormState['errors'] = {};

    const { isValid, errors: idErrors } = validateSubmissionIds(formData.submissionIds);
    if (!isValid) {
      errors.submissionIds = idErrors.join(', ');
    }

    if (!formData.configTitle.trim()) {
      errors.configTitle = 'Configuration title is required';
    }

    if (formData.autoplayInterval < 1000 || formData.autoplayInterval > 30000) {
      errors.autoplayInterval = 'Autoplay interval must be between 1000ms and 30000ms';
    }

    setFormData((prev) => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  }, [formData.autoplayInterval, formData.configTitle, formData.submissionIds]);

  const handleSaveConfig = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setState((prev) => ({ ...prev, isSaving: true, error: null, successMessage: null }));

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

      setState((prev) => ({
        ...prev,
        isSaving: false,
        successMessage: response.message,
      }));

      setFormData(defaultFormData);
      setEditingConfigId(null);

      await loadConfigs();

      console.log('✅ Config saved successfully');
    } catch (error) {
      console.error('❌ Failed to save config:', error);
      setState((prev) => ({
        ...prev,
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to save configuration',
      }));
    }
  }, [editingConfigId, formData, loadConfigs, validateForm]);

  const handleDeleteConfig = useCallback(
    async (configId: number) => {
      if (!confirm('Are you sure you want to delete this configuration?')) return;

      try {
        setState((prev) => ({ ...prev, error: null, successMessage: null }));

        await deleteConfig(configId);

        setState((prev) => ({
          ...prev,
          successMessage: 'Configuration deleted successfully',
        }));

        await loadConfigs();

        console.log('✅ Config deleted successfully');
      } catch (error) {
        console.error('❌ Failed to delete config:', error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to delete configuration',
        }));
      }
    },
    [loadConfigs],
  );

  const handleEditConfig = useCallback((config: GalleryFeaturedConfig) => {
    setFormData({
      submissionIds: formatSubmissionIds(config.submissionIds),
      configTitle: config.configTitle,
      configDescription: config.configDescription || '',
      autoplayInterval: config.autoplayInterval,
      isActive: config.isActive,
      errors: {},
    });
    setEditingConfigId(config.id);
  }, []);

  const resetForm = useCallback(() => {
    setFormData(defaultFormData);
    setEditingConfigId(null);
    setState((prev) => ({ ...prev, successMessage: null, error: null }));
  }, []);

  const clearMessages = useCallback(() => {
    setState((prev) => ({ ...prev, error: null, successMessage: null }));
  }, []);

  return {
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
  };
}
