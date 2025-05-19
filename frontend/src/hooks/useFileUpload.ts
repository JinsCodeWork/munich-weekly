import { useState } from 'react';
import { getAuthHeader } from '@/api/http';
import { formatFileSize } from '@/lib/utils';

interface UploadOptions {
  onProgress?: (progress: number) => void;
  headers?: Record<string, string>;
}

/**
 * Custom hook for handling file uploads
 * Manages file selection, preview generation, and upload process
 */
export function useFileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  
  // File size limit in bytes (20 MB)
  const MAX_FILE_SIZE = 20 * 1024 * 1024;
  // Allowed file types
  const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
  
  /**
   * Handle file selection and generate preview
   */
  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) {
      clearFile();
      return;
    }
    
    // Validate file type
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Only JPG and PNG images are allowed');
      return;
    }
    
    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
      return;
    }
    
    // Clear previous errors
    setError(null);
    setFile(selectedFile);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };
  
  /**
   * Clear selected file and preview
   */
  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setUploadProgress(0);
    setUploadedUrl(null);
  };
  
  /**
   * 使用fetch API上传文件
   * @param url 上传接口的URL
   * @returns 成功时返回响应结果，失败时抛出错误
   */
  const uploadFileWithFetch = async (url: string) => {
    if (!file) {
      setError('Please select a file to upload');
      throw new Error('Please select a file to upload');
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      console.log(`Starting upload of file "${file.name}" (${formatFileSize(file.size)}) to ${url}`);
      
      // 创建FormData对象
      const formData = new FormData();
      formData.append('file', file);
      
      // 发送请求
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          ...getAuthHeader()
        },
        credentials: 'include'
      });
      
      // 处理响应
      if (!response.ok) {
        let errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
        let responseText = '';
        
        try {
          responseText = await response.text();
          console.error('Upload failed, server response:', responseText);
          
          try {
            const errorData = JSON.parse(responseText);
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch {
            // 如果响应不是JSON格式，在控制台记录原始响应
            console.log('Server returned non-JSON response:', responseText);
          }
        } catch (textError) {
          console.error('Unable to read response content:', textError);
        }
        
        throw new Error(errorMessage);
      }
      
      // 处理成功响应
      let responseText = '';
      try {
        responseText = await response.text();
        
        // 检查响应是否为空
        if (!responseText.trim()) {
          console.log('Server returned an empty response, but status code was successful');
          setUploadProgress(100);
          return { success: true, message: 'Upload successful, but server did not return any data' };
        }
        
        const result = JSON.parse(responseText);
        
        if (!result.success && result.error) {
          throw new Error(result.error);
        }
        
        console.log('Upload successful, server response:', result);
        setUploadProgress(100);
        
        if (result.imageUrl) {
          setUploadedUrl(result.imageUrl);
          console.log('Set uploaded image URL:', result.imageUrl);
        }
        
        return result;
      } catch (parseError) {
        console.error('Failed to parse response:', parseError, 'Original response:', responseText);
        
        // 虽然解析失败，但HTTP状态是成功的，所以我们认为上传成功了
        setUploadProgress(100);
        return { 
          success: true, 
          message: 'Upload successful, but could not parse server response',
          rawResponse: responseText
        };
      }
    } catch (err) {
      console.error('Error during upload process:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred during upload');
      throw err;
    } finally {
      setIsUploading(false);
    }
  };
  
  /**
   * Upload file to server with progress tracking
   * @param endpoint API endpoint for upload
   * @param options Upload options
   * @returns Promise that resolves with the uploaded file URL
   */
  const uploadFile = async (endpoint: string, options?: UploadOptions): Promise<string | null> => {
    if (!file) {
      setError('Please select a file to upload');
      return null;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    return new Promise((resolve, reject) => {
      try {
        // 创建FormData
        const formData = new FormData();
        formData.append('file', file);
        
        // 使用XMLHttpRequest跟踪进度
        const xhr = new XMLHttpRequest();
        
        // 跟踪上传进度
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
            options?.onProgress?.(progress);
          }
        });
        
        // 处理响应
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success === false) {
                setError(response.error || 'Upload failed, please try again');
                setIsUploading(false);
                reject(new Error(response.error || 'Upload failed'));
                return;
              }
              
              setUploadedUrl(response.imageUrl);
              setIsUploading(false);
              setUploadProgress(100);
              resolve(response.imageUrl);
            } catch (parseError) {
              console.error('Unable to parse response:', parseError);
              setError('Server response format error');
              setIsUploading(false);
              reject(parseError);
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              setError(errorResponse.error || `Upload failed (${xhr.status})`);
            } catch {
              setError(`Upload failed (${xhr.status})`);
            }
            setIsUploading(false);
            reject(new Error(`HTTP error: ${xhr.status}`));
          }
        };
        
        // 处理网络错误
        xhr.onerror = () => {
          setError('Network error, please check your connection');
          setIsUploading(false);
          reject(new Error('Network error'));
        };
        
        // 发送请求
        xhr.open('POST', endpoint);
        
        // 添加认证头
        const authHeader = getAuthHeader();
        Object.keys(authHeader).forEach(key => {
          xhr.setRequestHeader(key, authHeader[key]);
        });
        
        // 添加自定义头
        if (options?.headers) {
          Object.keys(options.headers!).forEach(key => {
            xhr.setRequestHeader(key, options.headers![key]);
          });
        }
        
        xhr.send(formData);
        
      } catch (err) {
        console.error('Upload error:', err);
        setError('Upload file failed, please try again');
        setIsUploading(false);
        reject(err);
      }
    });
  };
  
  return {
    file,
    preview,
    isUploading,
    error,
    uploadProgress,
    uploadedUrl,
    handleFileSelect,
    uploadFile,
    uploadFileWithFetch,
    clearFile,
    setError
  };
} 