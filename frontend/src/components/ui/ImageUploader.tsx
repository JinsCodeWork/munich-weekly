import React, { useRef } from 'react';
import { Button } from './Button';

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

  React.useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Only JPEG and PNG images are allowed.');
        onFileSelected(null);
        return;
      }
      if (selectedFile.size > maxFileSize) {
        setError('File size exceeds the limit.');
        onFileSelected(null);
        return;
      }
      setError(null);
      onFileSelected(selectedFile);
    } else {
      setError(null);
      onFileSelected(null);
    }
  };

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
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors
          ${preview ? 'border-gray-300 bg-gray-50' : 'border-gray-300 hover:border-gray-500 hover:bg-gray-50'}`}
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