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
      
      // Use fetchAPI which automatically handles auth headers
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
      
      console.log('Uploading image to admin upload API using fetchAPI');
      
      // We need to convert FormData to a type without JSON.stringify
      // fetchAPI will handle the auth headers automatically
      const response = await fetchAPI<UploadResponse>('/api/admin/upload', {
        method: 'POST',
        body: formData,
        headers: {} // Let fetchAPI add the auth header, but don't add Content-Type for FormData
      });
      
      if (!response.success || !response.url) {
        throw new Error(response.error || 'Upload returned invalid data');
      }
      
      console.log('Image upload successful:', response.url);
      
      // Add timestamp to prevent caching
      return response.url.includes('?') 
        ? response.url 
        : `${response.url}?t=${Date.now()}`;
      
    } catch (err) {
      console.error('Image upload failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown upload error';
      setError(`Image upload failed: ${errorMessage}`);
      
      // Check for authentication errors specifically
      if (errorMessage.includes('Authentication') || 
          errorMessage.includes('401') ||
          errorMessage.includes('token')) {
        console.warn('Authentication issue detected during image upload');
      }
      
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
      
      // Use fetchAPI which automatically adds auth headers
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