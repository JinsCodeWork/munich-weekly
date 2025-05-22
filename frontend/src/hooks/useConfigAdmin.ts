import { useState, useEffect } from 'react';
import { fetchAPI } from '@/api/http';
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

// Config response type
interface ConfigResponse {
  success: boolean;
  config?: HomePageConfig;
  message?: string;
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
  const loadConfig = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use unified fetchAPI method
      const response = await fetchAPI<ConfigResponse>('/api/admin/config');
      
      if (response.success && response.config) {
        setConfig(response.config);
      } else {
        console.warn('Unable to load config, using defaults');
        setConfig({
          heroImage: homePageConfig.heroImage
        });
      }
    } catch (err) {
      console.error('Failed to load config:', err);
      setError('Failed to load configuration, using default settings');
      // Use default config when error occurs
      setConfig({
        heroImage: homePageConfig.heroImage
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Upload image
  const uploadImage = async (file: File): Promise<string> => {
    setIsUploading(true);
    setError(null);
    
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', 'images/home');
      formData.append('filename', 'hero.jpg');

      // Call API directly, let fetch handle auth from cookies
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
        // No need to manually add auth headers, fetch will get token from cookies
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as UploadResponse;
      
      if (!data.success || !data.url) {
        throw new Error(data.error || 'Upload returned invalid data');
      }
      
      // Add timestamp to prevent caching
      return data.url.includes('?') 
        ? data.url 
        : `${data.url}?t=${Date.now()}`;
      
    } catch (err) {
      console.error('Image upload failed:', err);
      setError(`Image upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
      // Use unified fetchAPI method
      const response = await fetchAPI<ConfigResponse>('/api/admin/config', {
        method: 'POST',
        body: JSON.stringify(configData)
      });
      
      if (response.success) {
        setConfig(configData);
        setSuccess('Settings updated successfully');
      } else {
        throw new Error(response.error || 'Configuration update returned invalid data');
      }
    } catch (err) {
      console.error('Failed to save config:', err);
      setError(`Failed to save configuration: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Initial configuration loading
  useEffect(() => {
    loadConfig();
  }, []);

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