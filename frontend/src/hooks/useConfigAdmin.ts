import { useState, useEffect } from 'react';
import { fetchAPI, getAuthHeader } from '@/api/http';
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
  const loadConfig = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Loading admin configuration using fetchAPI');
      
      // Use fetchAPI which automatically handles auth headers from localStorage
      const response = await fetchAPI<{success: boolean, config: HomePageConfig}>('/api/admin/config');
      
      if (response.success && response.config) {
        setConfig(response.config);
        console.log('Successfully loaded config');
      } else {
        console.warn('Invalid config data format, using defaults');
        setConfig({
          heroImage: homePageConfig.heroImage
        });
      }
    } catch (err) {
      console.error('Failed to load config:', err);
      
      // Try fallback to public config
      try {
        console.log('Attempting to load public config as fallback');
        const publicResponse = await fetchAPI<{success: boolean, config: HomePageConfig}>('/api/config');
        
        if (publicResponse.success && publicResponse.config) {
          setConfig(publicResponse.config);
          console.log('Successfully loaded public config');
        } else {
          throw new Error('Invalid data from public config API');
        }
      } catch (publicErr) {
        console.error('Public config fallback also failed:', publicErr);
        setError('Failed to load configuration, using default settings');
        
        // Use default config when error occurs
        setConfig({
          heroImage: homePageConfig.heroImage
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Upload image using the admin upload API
  const uploadImage = async (file: File): Promise<string> => {
    setIsUploading(true);
    setError(null);
    
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', 'images/home');
      formData.append('filename', 'hero.jpg');

      // 使用通用的getAuthHeader函数获取认证头，与用户上传图片保持一致
      const authHeaders = getAuthHeader();
      console.log('Using getAuthHeader for admin image upload');
      
      console.log('Uploading image to admin upload API');
      
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
        headers: {
          ...authHeaders
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', response.status, errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as UploadResponse;
      
      if (!data.success || !data.url) {
        throw new Error(data.error || 'Upload returned invalid data');
      }
      
      console.log('Image upload successful:', data.url);
      
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
      console.log('Saving admin configuration using fetchAPI');
      
      // Use fetchAPI which automatically adds auth headers from localStorage
      const response = await fetchAPI<{success: boolean, message: string}>('/api/admin/config', {
        method: 'POST',
        body: JSON.stringify(configData)
      });
      
      if (response.success) {
        setConfig(configData);
        setSuccess(response.message || 'Settings updated successfully');
        console.log('Config successfully updated');
      } else {
        throw new Error('Configuration update returned invalid data');
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