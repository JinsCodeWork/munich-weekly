import { useState, useEffect, useCallback } from 'react';
import { getAuthHeader } from '@/api/http';
import { homePageConfig } from '@/lib/config';

// Homepage configuration type
interface HomePageConfig {
  heroImage: {
    imageUrl: string;
    description: string;
    imageCaption?: string;
  };
  lastUpdated?: string;
}

// Image upload response type
interface UploadResponse {
  success: boolean;
  message?: string;
  url?: string;
  error?: string;
}

/**
 * Homepage Config Management Hook
 * Handles loading, saving configuration and uploading images for the homepage
 */
export function useConfigAdmin() {
  // State management
  const [config, setConfig] = useState<HomePageConfig>({
    heroImage: homePageConfig.heroImage
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Load configuration
  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/frontend-api/admin/config', {
        method: 'GET',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });

      if (!response.ok) {
        throw new Error(`Admin config API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.config) {
        setConfig(data.config);
      } else {
        setConfig({
          heroImage: homePageConfig.heroImage
        });
      }
    } catch {
      // Try fallback to public config
      try {
        // Public API does not require authentication headers
        const publicResponse = await fetch('/frontend-api/config');

        if (!publicResponse.ok) {
          throw new Error(`Public API error: ${publicResponse.status}`);
        }

        const publicData = await publicResponse.json();

        if (publicData.success && publicData.config) {
          setConfig(publicData.config);
        } else {
          throw new Error('Invalid data from public config API');
        }
      } catch {
        setError('Failed to load configuration, using default settings');

        // Use default config when error occurs
        setConfig({
          heroImage: homePageConfig.heroImage
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Upload image using the admin upload API
  const uploadImage = async (file: File): Promise<string> => {
    setIsUploading(true);
    setError(null);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Use new dedicated hero image upload endpoint
      const response = await fetch('/api/submissions/admin/upload-hero', {
        method: 'POST',
        body: formData,
        headers: {
          ...getAuthHeader()
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as UploadResponse;

      if (!data.success || !data.url) {
        throw new Error(data.error || 'Upload returned invalid data');
      }

      // After successful upload to backend, need to sync to frontend directory
      try {
        const syncResponse = await fetch('/frontend-api/admin/sync-hero', {
          method: 'POST',
          credentials: 'omit',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
          },
          body: JSON.stringify({
            imageUrl: data.url
          })
        });

        if (syncResponse.ok) {
          await syncResponse.json();
        }
      } catch {
        // Don't throw error since backend upload was successful
      }

      // Return frontend local path
      return '/images/home/hero.jpg';

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown upload error';
      setError(`Image upload failed: ${errorMessage}`);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  // Save configuration
  const saveConfig = async (configData: HomePageConfig) => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/frontend-api/admin/config', {
        method: 'POST',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(configData)
      });

      if (!response.ok) {
        throw new Error(`Save configuration failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setConfig(configData);
        setSuccess(data.message || 'Settings updated successfully');

        // Trigger events to notify other components that config has been updated
        try {
          const event = new CustomEvent('configUpdated', {
            detail: { config: configData, timestamp: Date.now() }
          });
          window.dispatchEvent(event);

          // Update localStorage to trigger cross-tab updates
          localStorage.setItem('hero_image_updated', Date.now().toString());

          // Clear immediately to avoid affecting other logic
          setTimeout(() => {
            localStorage.removeItem('hero_image_updated');
          }, 1000);

        } catch {
          // Don't affect main functionality
        }

        // Auto-clear success state to prevent infinite loops
        setTimeout(() => {
          setSuccess(null);
        }, 2000);
      } else {
        throw new Error(data.error || 'Configuration update returned invalid data');
      }
    } catch (err) {
      setError(`Failed to save configuration: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Initial configuration loading
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadConfig();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadConfig]);

  // Listen for config update events to auto-refresh when config is updated elsewhere
  useEffect(() => {
    let reloadTimeout: NodeJS.Timeout | null = null;

    const handleConfigUpdate = () => {
      // Debounce: cancel any pending reload
      if (reloadTimeout) {
        clearTimeout(reloadTimeout);
      }
      // Delay to ensure config has been saved
      reloadTimeout = setTimeout(() => {
        loadConfig();
        reloadTimeout = null;
      }, 500);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hero_image_updated') {
        // Debounce
        if (reloadTimeout) {
          clearTimeout(reloadTimeout);
        }
        reloadTimeout = setTimeout(() => {
          loadConfig();
          reloadTimeout = null;
        }, 1000);
      }
    };

    window.addEventListener('configUpdated', handleConfigUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (reloadTimeout) {
        clearTimeout(reloadTimeout);
      }
      window.removeEventListener('configUpdated', handleConfigUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadConfig]);

  return {
    config,
    isLoading,
    error,
    isSaving,
    isUploading,
    success,
    loadConfig,
    uploadImage,
    saveConfig
  };
}
