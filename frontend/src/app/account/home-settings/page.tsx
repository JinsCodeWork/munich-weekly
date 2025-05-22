"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import Image from 'next/image';
import { createImageUrl } from '@/lib/utils';
import { useConfigAdmin } from '@/hooks/useConfigAdmin';
import Link from 'next/link';

export default function HomeSettingsPage() {
  const { user, loading: authLoading, token } = useAuth();
  const router = useRouter();
  
  // Use our custom hook to manage configuration
  const {
    config,
    isLoading,
    error,
    isSaving,
    isUploading,
    success,
    uploadImage,
    saveConfig,
    loadConfig
  } = useConfigAdmin();
  
  // Form state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mainDescription, setMainDescription] = useState(config.heroImage.description);
  const [imageCaption, setImageCaption] = useState(config.heroImage.imageCaption || '');
  const [message, setMessage] = useState({ type: '', content: '' });
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [tokenMissing, setTokenMissing] = useState(false);
  
  // Check for JWT token and redirect if missing
  useEffect(() => {
    // 优先使用auth上下文中的token
    if (!token && !localStorage.getItem("jwt") && !authLoading) {
      setTokenMissing(true);
      setMessage({ 
        type: 'error', 
        content: 'Authentication token is missing. Please log in again.'
      });
    } else {
      setTokenMissing(false);
    }
  }, [authLoading, token]);

  // Check user permissions and auth status
  useEffect(() => {
    // Redirect non-admin users
    if (user && user.role !== 'admin') {
      router.push('/account');
    }
    
    // Check authentication
    if (!user && !isLoading && !authLoading) {
      router.push('/account');
    }
  }, [user, router, isLoading, authLoading]);
  
  // Sync config updates to form
  useEffect(() => {
    if (!isLoading) {
      setMainDescription(config.heroImage.description);
      setImageCaption(config.heroImage.imageCaption || '');
    }
  }, [config, isLoading]);
  
  // Sync error messages and handle auth errors more specifically
  useEffect(() => {
    if (error) {
      setMessage({ type: 'error', content: error });
      
      // Check for authentication errors specifically
      if (error.includes('Authentication failed') || 
          error.includes('token') || 
          error.includes('401')) {
        console.log('Authentication error detected, prompting login');
        setTokenMissing(true);
      }
    } else if (success) {
      setMessage({ type: 'success', content: success });
    } else {
      setMessage({ type: '', content: '' });
    }
  }, [error, success]);
  
  // Sync token from auth context to localStorage if needed
  useEffect(() => {
    if (token && !localStorage.getItem("jwt")) {
      console.log("Restoring token from auth context to localStorage");
      localStorage.setItem("jwt", token);
      setTokenMissing(false);
    }
  }, [token]);
  
  // Get debug info
  const updateDebugInfo = () => {
    try {
      const localToken = localStorage.getItem("jwt");
      const debugText = `
Auth Status: ${user ? `Logged in as ${user.role}` : 'Not logged in'}
Auth Context Token: ${token ? 'Present' : 'Missing'}
localStorage Token: ${localToken ? 'Present' : 'Missing'}
Token preview: ${localToken ? `${localToken.substring(0, 15)}...` : 'None'}
Environment: ${process.env.NODE_ENV}
Using fetchAPI: No (Direct fetch with auth headers)
      `;
      setDebugInfo(debugText);
      setShowDebug(true);
    } catch (err) {
      console.error('Error getting debug info:', err);
    }
  };
  
  // Add a retry button for manual loading
  const retryLoadConfig = () => {
    try {
      // 使用auth context中的token，即使localStorage中的token被清空也能正常工作
      console.log("Attempting to retry with auth context token:", token ? "present" : "missing");
      
      // Retry loading using hook's loadConfig method
      setMessage({ type: 'info', content: '正在重新加载配置...' });
      loadConfig();
    } catch (err) {
      console.error('Error during retry:', err);
      setMessage({ type: 'error', content: '重新加载配置失败' });
    }
  };
  
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
  
  // Show login required message if token is missing
  if (tokenMissing) {
    return (
      <Container className="py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-4">Authentication Error</h2>
            <p className="text-gray-700 mb-6">Your authentication token is missing or has expired. Please log in again to continue.</p>
            <Link 
              href="/login"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow transition"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </Container>
    );
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if logged in
    if (!user) {
      router.push('/account');
      return;
    }
    
    // 优先使用auth上下文中的token，再使用本地存储的token
    const authToken = token || localStorage.getItem("jwt");
    if (!authToken) {
      setTokenMissing(true);
      setMessage({ type: 'error', content: 'Authentication token is missing. Please log in again.' });
      return;
    }
    
    if (!imageFile && !mainDescription) {
      setMessage({ type: 'error', content: 'Please upload an image or modify the description text' });
      return;
    }
    
    try {
      // Define image URL variable
      let newImageUrl = config.heroImage.imageUrl;
      
      // If there's a new image, upload it first
      if (imageFile) {
        try {
          newImageUrl = await uploadImage(imageFile);
        } catch (err) {
          // uploadImage already sets error state, no need to repeat
          console.error('Image upload failed:', err);
          return;
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
      
      // Save configuration
      await saveConfig(configData);
      
      // Clear preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setImageFile(null);
      
    } catch (err) {
      // saveConfig already sets error state, no need to repeat
      console.error('Failed to save config:', err);
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
    setMainDescription(config.heroImage.description);
    setImageCaption(config.heroImage.imageCaption || '');
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
            
            <div className="mt-4">
              <button 
                onClick={updateDebugInfo}
                className="text-xs underline text-blue-600"
              >
                Show Debug Info
              </button>
              
              {showDebug && (
                <pre className="mt-4 p-4 bg-gray-100 text-left text-xs font-mono overflow-auto max-h-64 rounded border border-gray-300">
                  {debugInfo}
                </pre>
              )}
            </div>
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
          {message.type === 'error' && (
            <button 
              onClick={retryLoadConfig}
              className="ml-4 px-3 py-1 bg-white text-red-600 rounded text-sm border border-red-300 hover:bg-red-50"
            >
              Retry Loading
            </button>
          )}
        </div>
      )}
      
      {/* Debug info */}
      <div className="p-4 mb-6 bg-gray-50 border border-gray-200 rounded text-xs">
        <div className="flex justify-between items-center">
          <span className="font-medium">Debug Tools</span>
          <button 
            onClick={updateDebugInfo} 
            className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
          >
            {showDebug ? 'Refresh Debug Info' : 'Show Debug Info'}
          </button>
        </div>
        
        {showDebug && (
          <pre className="mt-4 bg-gray-100 p-4 font-mono overflow-auto max-h-64 rounded border border-gray-300">
            {debugInfo}
          </pre>
        )}
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
              disabled={isSaving || isUploading}
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
                  src={createImageUrl(config.heroImage.imageUrl, { width: 800 })}
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
            disabled={isSaving || isUploading}
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
            disabled={isSaving || isUploading}
          />
        </div>
        
        {/* Submit buttons */}
        <div className="pt-5 border-t border-gray-200 flex space-x-4">
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving || isUploading}
          >
            {isSaving ? 'Saving...' : isUploading ? 'Uploading...' : 'Save Settings'}
          </button>
          
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving || isUploading}
          >
            Reset Form
          </button>
        </div>
      </form>
    </Container>
  );
} 