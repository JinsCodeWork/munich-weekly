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
      console.log('Loading admin configuration');
      
      // 添加额外的验证措施 - 明确将token作为cookie也发送
      const token = localStorage.getItem('jwt');
      // 确保cookie可以在客户端和服务端都能访问，并防止安全限制
      document.cookie = `jwt=${token || ''}; path=/; max-age=3600; SameSite=None; Secure=false`;
      
      const response = await fetch('/frontend-api/admin/config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Admin config API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.config) {
        setConfig(data.config);
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
        // 公共API不需要认证头
        const publicResponse = await fetch('/frontend-api/config');
        
        if (!publicResponse.ok) {
          throw new Error(`Public API error: ${publicResponse.status}`);
        }
        
        const publicData = await publicResponse.json();
        
        if (publicData.success && publicData.config) {
          setConfig(publicData.config);
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
  }, []); // 空依赖数组，loadConfig不依赖任何state

  // Upload image using the admin upload API
  const uploadImage = async (file: File): Promise<string> => {
    setIsUploading(true);
    setError(null);
    
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('Uploading hero image to backend local storage');
      
      // 添加额外的验证措施 - 确保cookie中也有token
      const token = localStorage.getItem('jwt');
      // 确保cookie可以在客户端和服务端都能访问，并防止安全限制
      document.cookie = `jwt=${token || ''}; path=/; max-age=3600; SameSite=None; Secure=false`;
      
      // 使用新的hero图片专用上传端点
      const response = await fetch('/api/submissions/admin/upload-hero', {
        method: 'POST',
        body: formData,
        headers: {
          ...getAuthHeader()
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Hero image upload failed:', response.status, errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as UploadResponse;
      
      if (!data.success || !data.url) {
        throw new Error(data.error || 'Upload returned invalid data');
      }
      
      console.log('Hero image upload successful:', data.url);
      
      // 图片上传到后端成功后，需要同步到前端目录
      console.log('Syncing hero image to frontend directory...');
      
      try {
        const syncResponse = await fetch('/frontend-api/admin/sync-hero', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
          },
          body: JSON.stringify({
            imageUrl: data.url
          }),
          credentials: 'include'
        });
        
        if (!syncResponse.ok) {
          console.warn('Failed to sync hero image to frontend:', syncResponse.status);
          // 不抛出错误，因为后端上传已经成功
        } else {
          const syncData = await syncResponse.json();
          if (syncData.success) {
            console.log('Hero image synced to frontend successfully');
          } else {
            console.warn('Sync API returned error:', syncData.error);
          }
        }
      } catch (syncError) {
        console.warn('Error during hero image sync:', syncError);
        // 不抛出错误，因为后端上传已经成功
      }
      
      // 返回前端的本地路径
      return '/images/home/hero.jpg';
      
    } catch (err) {
      console.error('Hero image upload failed:', err);
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
      console.log('Saving admin configuration');
      
      // 添加额外的验证措施 - 确保cookie中也有token
      const token = localStorage.getItem('jwt');
      // 确保cookie可以在客户端和服务端都能访问，并防止安全限制
      document.cookie = `jwt=${token || ''}; path=/; max-age=3600; SameSite=None; Secure=false`;
      
      const response = await fetch('/frontend-api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(configData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Save config failed:', response.status, errorText);
        throw new Error(`Save configuration failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setConfig(configData);
        setSuccess(data.message || 'Settings updated successfully');
        console.log('Config successfully updated');
        
        // 触发事件通知其他组件配置已更新
        try {
          // 触发自定义事件（同一标签页内）
          const event = new CustomEvent('configUpdated', { 
            detail: { config: configData, timestamp: Date.now() } 
          });
          window.dispatchEvent(event);
          console.log('Dispatched configUpdated event');
          
          // 更新 localStorage 触发其他标签页更新
          localStorage.setItem('hero_image_updated', Date.now().toString());
          console.log('Updated localStorage to trigger cross-tab updates');
          
          // 立即清除，避免影响其他逻辑
          setTimeout(() => {
            localStorage.removeItem('hero_image_updated');
          }, 1000);
          
        } catch (eventError) {
          console.warn('Failed to trigger update events:', eventError);
          // 不影响主要功能，只是警告
        }
        
        // 自动清除success状态，避免无限循环
        setTimeout(() => {
          console.log('Auto-clearing success state to prevent infinite loops');
          setSuccess(null);
        }, 2000);
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
  }, [loadConfig]);

  // 监听配置更新事件，当其他地方更新配置时自动刷新
  useEffect(() => {
    let reloadTimeout: NodeJS.Timeout | null = null;
    
    const handleConfigUpdate = () => {
      console.log('useConfigAdmin: Received config update event, reloading config...');
      // 防抖处理：如果已有计划中的重载，先取消它
      if (reloadTimeout) {
        clearTimeout(reloadTimeout);
      }
      // 延迟一下确保配置已经保存
      reloadTimeout = setTimeout(() => {
        loadConfig();
        reloadTimeout = null;
      }, 500);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hero_image_updated') {
        console.log('useConfigAdmin: Detected hero image update from localStorage, reloading config...');
        // 防抖处理
        if (reloadTimeout) {
          clearTimeout(reloadTimeout);
        }
        reloadTimeout = setTimeout(() => {
          loadConfig();
          reloadTimeout = null;
        }, 1000);
      }
    };

    // 监听自定义事件和localStorage事件
    window.addEventListener('configUpdated', handleConfigUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      // 清理定时器
      if (reloadTimeout) {
        clearTimeout(reloadTimeout);
      }
      window.removeEventListener('configUpdated', handleConfigUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadConfig]); // 添加loadConfig依赖

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