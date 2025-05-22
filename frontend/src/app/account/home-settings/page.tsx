"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { homePageConfig } from '@/lib/config';
import Image from 'next/image';
import { createImageUrl } from '@/lib/utils';
import { getAuthHeader } from '@/api/http';

export default function HomeSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Form state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mainDescription, setMainDescription] = useState(homePageConfig.heroImage.description);
  const [imageCaption, setImageCaption] = useState(homePageConfig.heroImage.imageCaption || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [currentImageUrl, setCurrentImageUrl] = useState(homePageConfig.heroImage.imageUrl);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // Check user permissions and auth status
  useEffect(() => {
    // Redirect non-admin users
    if (user && user.role !== 'admin') {
      router.push('/account');
      return;
    }
    
    // Check authentication
    if (!user && !isLoading) {
      setMessage({ 
        type: 'error', 
        content: 'You must be logged in as an admin to access this page. Please log in and try again.' 
      });
      
      // Try to refresh auth status after a short delay
      const timer = setTimeout(() => {
        window.location.reload();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [user, router, isLoading]);
  
  // Check authentication on mount
  useEffect(() => {
    // Debug authentication info
    const token = localStorage.getItem("jwt");
    const authHeader = getAuthHeader();
    setDebugInfo(`Auth status: ${user ? 'Logged in' : 'Not logged in'}, Token exists: ${token ? 'Yes' : 'No'}, Auth header exists: ${Object.keys(authHeader).length > 0 ? 'Yes' : 'No'}`);
  }, [user]);
  
  // Load current config
  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Use auth header from our utility
        const headers = {
          ...getAuthHeader(),
          'X-Admin-Role': 'true' // Add special admin marker
        };
        
        console.log('Loading config with headers:', headers);
        
        // Try fetching from admin endpoint first
        try {
          const response = await fetch('/api/admin/config', {
            method: 'GET',
            headers,
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.config?.heroImage) {
              const { heroImage } = data.config;
              
              // Update form state
              setMainDescription(heroImage.description || homePageConfig.heroImage.description);
              setImageCaption(heroImage.imageCaption || homePageConfig.heroImage.imageCaption || '');
              
              // Update image URL
              if (heroImage.imageUrl) {
                setCurrentImageUrl(heroImage.imageUrl);
              }
              
              setIsLoading(false);
              return;
            }
          } else {
            console.warn('Admin config fetch failed, falling back to public config');
          }
        } catch (adminError) {
          console.error('Error fetching admin config:', adminError);
        }
        
        // Fall back to public config endpoint
        const response = await fetch('/api/config', {
          headers,
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.config?.heroImage) {
            const { heroImage } = data.config;
            
            // Update form state
            setMainDescription(heroImage.description || homePageConfig.heroImage.description);
            setImageCaption(heroImage.imageCaption || homePageConfig.heroImage.imageCaption || '');
            
            // Update image URL
            if (heroImage.imageUrl) {
              setCurrentImageUrl(heroImage.imageUrl);
            }
          }
        } else {
          // If both requests fail, use default config
          console.warn('Both config fetches failed, using default config');
          setMessage({ type: 'warning', content: 'Could not load configuration, using default settings' });
        }
      } catch (error) {
        console.error('Failed to load config:', error);
        setMessage({ type: 'error', content: 'Failed to load config, using default settings' });
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);
  
  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      setMessage({ type: 'error', content: 'Only JPG and PNG images are supported' });
      return;
    }
    
    // Check file size
    if (file.size > 30 * 1024 * 1024) { // 30MB
      setMessage({ type: 'error', content: 'Image size must not exceed 30MB' });
      return;
    }
    
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMessage({ type: '', content: '' });
  };
  
  // Handle authentication errors with retry
  const handleAuthError = async () => {
    // Clear any stale tokens
    localStorage.removeItem("jwt");
    sessionStorage.removeItem("preserve_auth");
    
    setMessage({ 
      type: 'error', 
      content: 'Authentication error. Please refresh the page to log in again.' 
    });
    
    // Reload the page after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!user) {
      handleAuthError();
      return;
    }
    
    if (!imageFile && !mainDescription) {
      setMessage({ type: 'error', content: 'Please upload an image or modify the description text' });
      return;
    }
    
    setIsSubmitting(true);
    setMessage({ type: 'info', content: 'Submitting...' });
    
    try {
      // Define image URL variable
      let newImageUrl = currentImageUrl;
      
      // If there's a new image, upload it first
      if (imageFile) {
        // Get auth headers using our utility function
        const authHeaders = getAuthHeader();
        console.log('Auth headers for upload:', authHeaders);
        
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('path', 'images/home');
        formData.append('filename', 'hero.jpg');
        
        // Also add token directly to form data as a fallback
        const token = localStorage.getItem("jwt");
        if (token) {
          formData.append('token', token);
        }
        
        console.log('直接调用后端API上传图片');
        
        // More detailed debugging
        if (token) {
          console.log('JWT token found in localStorage, length:', token.length);
          // Log the first few characters for debugging (don't log the entire token)
          console.log('Token starts with:', token.substring(0, 10) + '...');
        } else {
          console.warn('No JWT token found in localStorage');
        }
        
        // 直接调用后端API，绕过Next.js API路由
        const imageResponse = await fetch('/api/submissions/admin/upload', {
          method: 'POST',
          headers: authHeaders,
          body: formData,
          credentials: 'include', // Include cookies for auth
        });
        
        if (!imageResponse.ok) {
          const errorText = await imageResponse.text();
          console.error('Upload failed:', imageResponse.status, errorText);
          throw new Error(`Image upload failed: ${errorText || imageResponse.statusText}`);
        }
        
        // Parse successful response
        const imageData = await imageResponse.json();
        console.log('Upload response:', imageData);
        
        if (imageData.success && imageData.url) {
          // Update image URL, add timestamp
          newImageUrl = imageData.url.includes('?') 
            ? imageData.url 
            : `${imageData.url}?t=${Date.now()}`;
          console.log('New image URL:', newImageUrl);
          setCurrentImageUrl(newImageUrl);
        }
      }
      
      // Build config data
      const configData = {
        heroImage: {
          imageUrl: newImageUrl,
          description: mainDescription,
          imageCaption: imageCaption
        }
      };
      
      console.log('通过Next.js API路由更新配置');
      
      // Get auth headers
      const configHeaders = {
        'Content-Type': 'application/json',
        ...getAuthHeader(), // Use our utility to get auth headers
        'X-Admin-Role': 'true' // Add special admin marker
      };
      
      console.log('Config update headers:', configHeaders);
      
      // 使用Next.js API路由更新配置
      const configUpdateResponse = await fetch('/api/admin/config', {
        method: 'POST',
        headers: configHeaders,
        body: JSON.stringify(configData),
        credentials: 'include', // Include cookies for auth
      });
      
      if (!configUpdateResponse.ok) {
        throw new Error('Failed to update config');
      }
      
      // Get config update result
      const configResult = await configUpdateResponse.json();
      console.log('Config update result:', configResult);
      
      setMessage({ type: 'success', content: 'Home page settings updated' });
      
      // Clear preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setImageFile(null);
      
    } catch (error) {
      console.error('Update failed:', error);
      setMessage({ type: 'error', content: `Update failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset form
  const handleReset = () => {
    setMessage({ type: '', content: '' });
    
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    
    setImageFile(null);
    setMainDescription(homePageConfig.heroImage.description);
    setImageCaption(homePageConfig.heroImage.imageCaption || '');
  };
  
  if (!user || user.role !== 'admin') {
    return null;
  }
  
  if (isLoading) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </Container>
    );
  }
  
  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 font-heading">Home Page Settings</h1>
        <p className="text-gray-500 mt-1">Modify the home page image and description text here</p>
      </div>
      
      {message.content && (
        <div className={`p-4 mb-6 rounded ${message.type === 'error' ? 'bg-red-100 text-red-700' : message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
          {message.content}
        </div>
      )}
      
      {/* Debug info */}
      <div className="p-4 mb-6 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
        <details>
          <summary className="cursor-pointer">Debug Info (Click to expand)</summary>
          <div className="mt-2">
            <p>{debugInfo}</p>
            <p className="mt-1">Environment: {process.env.NODE_ENV}</p>
            <p className="mt-1">User: {user ? `Logged in (${user.role})` : 'Not logged in'}</p>
          </div>
        </details>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Image upload area */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 font-heading">Home Page Image</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center">
            <input
              type="file"
              id="image"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleImageChange}
              disabled={isSubmitting}
            />
            
            {previewUrl ? (
              <div className="w-full aspect-[16/9] relative mb-4">
                <Image 
                  src={previewUrl}
                  alt="Image Preview"
                  fill
                  className="object-cover rounded"
                />
              </div>
            ) : (
              <div className="w-full aspect-[16/9] relative mb-4 bg-gray-100 flex items-center justify-center">
                <Image 
                  src={createImageUrl(currentImageUrl, { width: 800 })}
                  alt="Current Home Page Image"
                  width={800}
                  height={450}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}
            
            <label 
              htmlFor="image" 
              className="cursor-pointer py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
            >
              Select New Image
            </label>
            
            <p className="text-sm text-gray-500 mt-2">
              It is recommended to use a high-quality, landscape image (16:9 aspect ratio), up to 30MB
            </p>
          </div>
        </div>
        
        {/* Main description text */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 font-heading">Main Description Text</h2>
          <p className="text-sm text-gray-500">This text will be displayed in the center of the image when visitors hover</p>
          
          <textarea
            value={mainDescription}
            onChange={(e) => setMainDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            placeholder="Enter the main description text to display in the center of the image"
            inputMode="text"
            autoCorrect="off"
            disabled={isSubmitting}
          />
        </div>
        
        {/* Image caption */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 font-heading">Image Caption</h2>
          <p className="text-sm text-gray-500">This text will be displayed at the bottom of the image when visitors hover</p>
          
          <textarea
            value={imageCaption}
            onChange={(e) => setImageCaption(e.target.value)}
            className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
            placeholder="e.g. Photographer: Max Mustermann | Marienplatz, Munich | June 2023"
            inputMode="text"
            autoCorrect="off"
            disabled={isSubmitting}
          />
        </div>
        
        {/* Submit buttons */}
        <div className="pt-5 border-t border-gray-200 flex space-x-4">
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </button>
          
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            Reset Form
          </button>
        </div>
      </form>
    </Container>
  );
} 