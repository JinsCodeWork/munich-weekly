import React, { useRef, useState, useCallback } from 'react';
import { Button } from './Button';
import Image from 'next/image';

interface ImageUploaderProps {
  onFileSelected: (file: File | null) => void;
  file: File | null;
  className?: string;
  maxFileSize?: number;
  allowedTypes?: string[];
  maxImagesMessage?: string;
}

/**
 * Image Uploader Component
 * Handles image selection, preview, validation, and upload
 * Uses useFileUpload hook for file handling logic
 */
export function ImageUploader({ 
  onFileSelected,
  file,
  className,
  maxFileSize = 20 * 1024 * 1024,
  allowedTypes = ['image/jpeg', 'image/png'],
  maxImagesMessage = "If you wish to submit multiple photos to the same issue, please make separate submissions. Maximum 4 photos per issue."
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  React.useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }, [file]);

  const validateFile = useCallback((selectedFile: File): string | null => {
    if (!allowedTypes.includes(selectedFile.type)) {
      return 'Only JPEG and PNG images are allowed.';
    }
    if (selectedFile.size > maxFileSize) {
      return 'File size exceeds the limit.';
    }
    return null;
  }, [allowedTypes, maxFileSize]);

  const processFile = useCallback((selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      onFileSelected(null);
      return;
    }
    
    setError(null);
    onFileSelected(selectedFile);
  }, [validateFile, onFileSelected]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    } else {
      setError(null);
      onFileSelected(null);
    }
  };

  // Drag and drop event handling
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set to false when leaving the entire drop zone
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Ensure drag state remains true
    setIsDragging(true);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      processFile(selectedFile);
    }
  }, [processFile]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleClear = () => {
    onFileSelected(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* File selection area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-200
          ${preview ? 'border-gray-300 bg-gray-50' : 
            isDragging ? 'border-blue-500 bg-blue-50 border-solid' : 
            'border-gray-300 hover:border-gray-500 hover:bg-gray-50'}`}
        onClick={preview ? undefined : triggerFileInput}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {preview ? (
          // Image preview
          <div className="relative w-full">
            <div className="relative max-h-64 overflow-hidden rounded">
              <Image 
                src={preview} 
                alt="Preview" 
                width={400}
                height={300}
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
            </div>
          </div>
        ) : (
          // Upload prompt
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg className="w-12 h-12 mx-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <div className="mt-2">
              <p className={`text-sm transition-colors ${isDragging ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
                {isDragging ? 'Release to upload' : 'Click to select or drag and drop'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG or JPEG up to {maxFileSize / (1024 * 1024)}MB
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
        {maxImagesMessage}
      </p>
      
      {/* Error message */}
      {error && (
        <div className="text-red-500 text-sm mt-2">
          {error}
        </div>
      )}
    </div>
  );
} 