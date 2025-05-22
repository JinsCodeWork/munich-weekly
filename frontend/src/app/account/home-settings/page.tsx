"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { homePageConfig } from '@/lib/config';
import Image from 'next/image';
import { createImageUrl } from '@/lib/utils';

export default function HomeSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // 表单状态
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mainDescription, setMainDescription] = useState(homePageConfig.heroImage.description);
  const [imageCaption, setImageCaption] = useState(homePageConfig.heroImage.imageCaption || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [currentImageUrl, setCurrentImageUrl] = useState(homePageConfig.heroImage.imageUrl);
  
  // 检查用户权限
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/account');
    }
  }, [user, router]);
  
  // 加载当前配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.config?.heroImage) {
            const { heroImage } = data.config;
            
            // 更新表单状态
            setMainDescription(heroImage.description || homePageConfig.heroImage.description);
            setImageCaption(heroImage.imageCaption || homePageConfig.heroImage.imageCaption || '');
            
            // 更新图片URL
            if (heroImage.imageUrl) {
              setCurrentImageUrl(heroImage.imageUrl);
            }
          }
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
  
  // 处理图片选择
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 检查文件类型
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      setMessage({ type: 'error', content: 'Only JPG and PNG images are supported' });
      return;
    }
    
    // 检查文件大小
    if (file.size > 30 * 1024 * 1024) { // 30MB
      setMessage({ type: 'error', content: 'Image size must not exceed 30MB' });
      return;
    }
    
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMessage({ type: '', content: '' });
  };
  
  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFile && !mainDescription) {
      setMessage({ type: 'error', content: 'Please upload an image or modify the description text' });
      return;
    }
    
    setIsSubmitting(true);
    setMessage({ type: 'info', content: 'Submitting...' });
    
    try {
      // 定义图片URL变量
      let newImageUrl = currentImageUrl;
      
      // 如果有新图片，先上传图片
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('path', 'images/home');
        formData.append('filename', 'hero.jpg');
        
        console.log('上传图片到:', 'images/home/hero.jpg');
        
        // Get JWT token from localStorage
        const token = localStorage.getItem("jwt");
        const headers: Record<string, string> = {};
        
        if (token) {
          console.log('Adding authorization header with token');
          headers['Authorization'] = `Bearer ${token}`;
        } else {
          console.warn('No JWT token found in localStorage');
        }
        
        const imageResponse = await fetch('/api/admin/upload', {
          method: 'POST',
          headers,
          body: formData,
          credentials: 'include', // Include cookies for auth
        });
        
        if (!imageResponse.ok) {
          const errorText = await imageResponse.text();
          console.error('Upload failed:', imageResponse.status, errorText);
          throw new Error(`Image upload failed: ${errorText || imageResponse.statusText}`);
        }
        
        // 上传成功后解析响应
        const imageData = await imageResponse.json();
        console.log('上传响应:', imageData);
        
        if (imageData.success && imageData.url) {
          // 更新图片URL，添加时间戳
          newImageUrl = imageData.url.includes('?') 
            ? imageData.url 
            : `${imageData.url}?t=${Date.now()}`;
          console.log('新图片URL:', newImageUrl);
          setCurrentImageUrl(newImageUrl);
        }
      }
      
      // 构建配置数据
      const configData = {
        heroImage: {
          imageUrl: newImageUrl,
          description: mainDescription,
          imageCaption: imageCaption
        }
      };
      
      console.log('更新配置:', configData);
      
      // Get JWT token for config update
      const token = localStorage.getItem("jwt");
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // 更新配置信息
      const configUpdateResponse = await fetch('/api/admin/config', {
        method: 'POST',
        headers,
        body: JSON.stringify(configData),
        credentials: 'include', // Include cookies for auth
      });
      
      if (!configUpdateResponse.ok) {
        throw new Error('Failed to update config');
      }
      
      // 获取配置更新结果
      const configResult = await configUpdateResponse.json();
      console.log('配置更新结果:', configResult);
      
      setMessage({ type: 'success', content: 'Home page settings updated' });
      
      // 清除预览
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
  
  // 重置表单
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