'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';

interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
}

/**
 * Image Uploader Component
 * Handles image selection, preview, validation, and upload
 */
export default function ImageUploader({ onImageUploaded }: ImageUploaderProps) {
  // States for file handling
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // File size limit in bytes (20 MB)
  const MAX_FILE_SIZE = 20 * 1024 * 1024;
  // Allowed file types
  const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
  
  /**
   * Handle file selection
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
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
   * Upload the selected image to the server
   */
  const uploadImage = async () => {
    if (!file) {
      setError('Please select an image to upload.');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
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
          const response = JSON.parse(xhr.responseText);
          onImageUploaded(response.imageUrl);
          setIsUploading(false);
          setUploadProgress(100);
        } else {
          throw new Error('Upload failed');
        }
      };
      
      // Handle errors
      xhr.onerror = () => {
        setError('Network error occurred during upload.');
        setIsUploading(false);
      };
      
      // Open and send request
      xhr.open('POST', '/api/uploads/image');
      xhr.send(formData);
      
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image. Please try again.');
      setIsUploading(false);
    }
  };
  
  /**
   * Clear selected file and preview
   */
  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  /**
   * Trigger file input click
   */
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className="space-y-4">
      {/* File selection area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors
          ${preview ? 'border-gray-300 bg-gray-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}
        onClick={preview ? undefined : triggerFileInput}
      >
        {preview ? (
          // Image preview
          <div className="relative w-full">
            <div className="relative max-h-64 overflow-hidden rounded">
              <img 
                src={preview} 
                alt="Preview" 
                className="mx-auto object-contain"
              />
            </div>
            
            {/* File info */}
            <div className="mt-2 text-sm text-gray-500">
              {file && (
                <p>
                  {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
            </div>
            
            {/* Actions */}
            <div className="mt-3 flex justify-end space-x-2">
              <Button 
                onClick={handleClear}
                variant="secondary"
                size="sm"
                type="button"
              >
                Clear
              </Button>
              
              {!isUploading && (
                <Button 
                  onClick={uploadImage} 
                  size="sm"
                  type="button"
                >
                  Upload
                </Button>
              )}
            </div>
          </div>
        ) : (
          // Upload prompt
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <i className="fa-solid fa-cloud-upload-alt text-3xl"></i>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                Click to select or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG or JPEG up to 20MB
              </p>
            </div>
          </div>
        )}
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      
      {/* Multi-submission guidance */}
      <p className="text-xs text-gray-500 italic mt-1 text-center">
        If you wish to submit multiple photos to the same issue, please make separate submissions. Maximum 4 photos per issue.
      </p>
      
      {/* Error message */}
      {error && (
        <div className="text-red-500 text-sm mt-2">
          {error}
        </div>
      )}
      
      {/* Upload progress */}
      {isUploading && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
} 