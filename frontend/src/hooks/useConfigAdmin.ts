import { useState, useEffect } from 'react';
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
      // Debug token state
      const token = localStorage.getItem("jwt");
      console.log("Token state before request:", {
        exists: !!token,
        value: token ? token.substring(0, 10) + "..." : "none",
        cookieExists: document.cookie.includes("jwt")
      });

      // Prepare headers with token from localStorage
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      
      console.log('Loading config with headers:', { 
        ...headers, 
        Authorization: headers.Authorization ? "Bearer [REDACTED]" : "none" 
      });
      
      // Direct fetch call to admin config endpoint
      const response = await fetch('/api/admin/config', {
        method: 'GET',
        headers,
        credentials: 'include' // Include cookies for additional auth
      });
      
      console.log('Config API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Config API response data:', data);
        
        if (data.success && data.config?.heroImage) {
          setConfig(data.config);
          console.log('Successfully loaded config');
        } else {
          console.warn('Invalid config data format, using defaults');
          setConfig({
            heroImage: homePageConfig.heroImage
          });
        }
      } else {
        // Try fallback to public config on auth failure
        console.warn('Admin config fetch failed, falling back to public config');
        const publicResponse = await fetch('/api/config', {
          credentials: 'include'
        });
        
        if (publicResponse.ok) {
          const publicData = await publicResponse.json();
          if (publicData.success && publicData.config?.heroImage) {
            setConfig(publicData.config);
            console.log('Successfully loaded public config');
          } else {
            throw new Error('Invalid data from public config API');
          }
        } else {
          throw new Error(`Admin request failed with status ${response.status}, public fallback failed with status ${publicResponse.status}`);
        }
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
      // Debug token state
      const token = localStorage.getItem("jwt");
      console.log("Token state before upload:", {
        exists: !!token,
        value: token ? token.substring(0, 10) + "..." : "none"
      });
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', 'images/home');
      formData.append('filename', 'hero.jpg');
      
      // Also add token to form data as fallback
      if (token) {
        formData.append('token', token);
      }

      // Prepare headers with token - ensure it's always a valid value for TypeScript
      const headers: Record<string, string> = {}; 
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      console.log('Upload headers:', { 
        Authorization: headers.Authorization ? "Bearer [REDACTED]" : "none" 
      });

      // Direct call to admin upload endpoint
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include' // Include cookies for auth
      });

      console.log('Upload response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', response.status, errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as UploadResponse;
      console.log('Upload response data:', data);
      
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
      // Debug token state
      const token = localStorage.getItem("jwt");
      console.log("Token state before saving config:", {
        exists: !!token,
        value: token ? token.substring(0, 10) + "..." : "none"
      });
      
      // Prepare headers with token
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      
      console.log('Config update headers:', { 
        ...headers, 
        Authorization: headers.Authorization ? "Bearer [REDACTED]" : "none" 
      });
      
      // Direct call to admin config endpoint
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers,
        body: JSON.stringify(configData),
        credentials: 'include' // Include cookies for auth
      });
      
      console.log('Config update response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Config update failed:', response.status, errorText);
        throw new Error(`Failed to update config: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Config update response data:', data);
      
      if (data.success) {
        setConfig(configData);
        setSuccess('Settings updated successfully');
      } else {
        throw new Error(data.error || 'Configuration update returned invalid data');
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