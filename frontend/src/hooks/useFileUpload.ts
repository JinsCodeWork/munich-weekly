import { useState } from 'react';

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
      return;
    }
    
    // Validate file type
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload JPEG or PNG images only.');
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
   * Upload file to server
   * @param endpoint API endpoint for upload
   * @returns Promise that resolves with the uploaded file URL
   */
  const uploadFile = async (endpoint: string = '/api/uploads/image'): Promise<string | null> => {
    if (!file) {
      setError('Please select a file to upload.');
      return null;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    return new Promise((resolve, reject) => {
      try {
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        
        // Upload image with progress tracking
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });
        
        // Handle response
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success === false) {
                setError(response.error || 'Upload failed, please try again.');
                setIsUploading(false);
                reject(new Error(response.error || 'Upload failed'));
                return;
              }
              
              setUploadedUrl(response.imageUrl);
              setIsUploading(false);
              setUploadProgress(100);
              resolve(response.imageUrl);
            } catch (parseError) {
              console.error('Failed to parse response:', parseError);
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
            reject(new Error(`HTTP Error: ${xhr.status}`));
          }
        };
        
        // Handle errors
        xhr.onerror = () => {
          setError('Network error, please check your connection');
          setIsUploading(false);
          reject(new Error('Network error'));
        };
        
        // Open and send request
        xhr.open('POST', endpoint);
        
        // Add authentication header
        const token = localStorage.getItem("jwt");
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        } else {
          setError('You need to be logged in to upload files');
          setIsUploading(false);
          reject(new Error('Authentication required'));
          return;
        }
        
        xhr.send(formData);
        
      } catch (err) {
        console.error('Upload error:', err);
        setError('Failed to upload file, please try again');
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
    clearFile,
    setError
  };
} 