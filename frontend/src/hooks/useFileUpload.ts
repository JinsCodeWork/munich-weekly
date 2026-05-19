import { useState } from 'react';
import { getAuthHeader } from '@/api/http';

const UPLOAD_RETRY_DELAY_MS = 400;

function pickServerErrorMessage(parsed: unknown): string | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const o = parsed as Record<string, unknown>;
  for (const key of ['error', 'message', 'detail'] as const) {
    const v = o[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

function buildUploadHttpErrorMessage(
  status: number,
  statusText: string,
  responseText: string
): string {
  const base = `Upload failed: ${status} ${statusText}`;
  let fromJson: string | null = null;
  const t = responseText.trim();
  if (t) {
    try {
      fromJson = pickServerErrorMessage(JSON.parse(t) as unknown);
    } catch {
      /* body is not JSON */
    }
  }
  if (fromJson) {
    return `${base} — ${fromJson}`;
  }
  if (t) {
    const snippet = t.length > 300 ? `${t.slice(0, 300)}…` : t;
    return `${base} — ${snippet}`;
  }
  return base;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
   * Upload file using fetch API
   * @param url Upload endpoint URL
   * @returns Returns response on success, throws error on failure
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
      // Create FormData object
      const formData = new FormData();
      formData.append('file', file);

      const runAuthenticatedUpload = async () =>
        fetch(url, {
          method: 'POST',
          body: formData,
          headers: {
            ...getAuthHeader()
          },
          credentials: 'include'
        });

      let response = await runAuthenticatedUpload();
      if (response.status >= 500 && response.status <= 599) {
        try {
          await response.text();
        } catch {
          /* ignore */
        }
        await sleep(UPLOAD_RETRY_DELAY_MS);
        response = await runAuthenticatedUpload();
      }

      // Handle response
      if (!response.ok) {
        let responseText = '';
        try {
          responseText = await response.text();
        } catch {
          /* Unable to read response content */
        }
        throw new Error(
          buildUploadHttpErrorMessage(response.status, response.statusText, responseText)
        );
      }

      // Handle successful response — require explicit success flag and imageUrl
      const responseText = await response.text();
      if (!responseText.trim()) {
        throw new Error(
          'Upload failed: server returned an empty response and success could not be confirmed'
        );
      }

      let result: unknown;
      try {
        result = JSON.parse(responseText) as unknown;
      } catch {
        throw new Error(
          'Upload failed: server returned a non-JSON response so success could not be confirmed'
        );
      }

      if (typeof result !== 'object' || result === null) {
        throw new Error('Upload failed: invalid JSON response from server');
      }

      const body = result as Record<string, unknown>;
      if (body.success !== true) {
        const msg =
          pickServerErrorMessage(result) ||
          (typeof body.error === 'string' ? body.error : null) ||
          'Upload failed: server did not report success';
        throw new Error(msg);
      }

      const imageUrl = body.imageUrl;
      if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
        throw new Error('Upload failed: server response missing image URL');
      }

      setUploadProgress(100);
      setUploadedUrl(imageUrl);

      return { success: true as const, imageUrl };
    } catch (err) {
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
        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        
        // Use XMLHttpRequest to track progress
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
            options?.onProgress?.(progress);
          }
        });
        
        // Handle response
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
        
        // Handle network errors
        xhr.onerror = () => {
          setError('Network error, please check your connection');
          setIsUploading(false);
          reject(new Error('Network error'));
        };
        
        // Send request
        xhr.open('POST', endpoint);
        
        // Add authentication headers
        const authHeader = getAuthHeader();
        Object.keys(authHeader).forEach(key => {
          xhr.setRequestHeader(key, authHeader[key]);
        });
        
        // Add custom headers
        if (options?.headers) {
          Object.keys(options.headers!).forEach(key => {
            xhr.setRequestHeader(key, options.headers![key]);
          });
        }
        
        xhr.send(formData);
        
      } catch (err) {
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