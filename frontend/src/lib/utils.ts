import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility for combining class names with Tailwind CSS
 * Uses clsx for conditional classes and twMerge to handle Tailwind conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date to locale string
 */
export function formatDate(dateString: string, options: Intl.DateTimeFormatOptions = {}) {
  const date = new Date(dateString)
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options
  }
  
  return date.toLocaleDateString("en-US", defaultOptions)
}

/**
 * Truncate text and add ellipsis
 */
export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 Bytes"
  
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Generate random ID
 */
export function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

/**
 * Type-safe conditional class application
 * Applies a class only if the condition is true
 */
export function classIf(condition: boolean, className: string): string {
  return condition ? className : ''
}

/**
 * Map a status to the appropriate Tailwind color class
 */
export function statusToColorClass(status: string, type: 'bg' | 'text' | 'border' = 'bg'): string {
  const prefix = type === 'bg' ? 'bg' : type === 'text' ? 'text' : 'border'
  const defaultColor = 'gray'
  const intensity = type === 'bg' ? 100 : 500
  
  const statusColorMap: Record<string, string> = {
    approved: 'green',
    rejected: 'red',
    selected: 'purple',
    pending: 'gray'
  }
  
  const color = statusColorMap[status.toLowerCase()] || defaultColor
  return `${prefix}-${color}-${intensity}`
}

/**
 * Process image URLs to ensure they have the correct server prefix
 * For locally uploaded images (/uploads/*), adds the server URL prefix
 * 
 * @param url - The image URL to process
 * @returns Properly formatted image URL
 */
export function getImageUrl(url: string): string {
  // Handle empty or invalid URLs
  if (!url || url.trim() === '') {
    console.warn('getImageUrl: Empty or invalid URL provided');
    return '/placeholder.svg'; // Return placeholder image
  }
  
  // Test environment
  const isDevEnv = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  
  // Special handling for static image paths - keep original without converting to CDN URL
  if (url.startsWith('/images/')) {
    console.log('Using local static image path:', url);
    return url; // No conversion, use local path
  }
  
  // External complete URL, e.g. Cloudflare R2 URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // If URL contains pub-xxx.r2.dev, convert it to standard path
    if (url.includes('.r2.dev/')) {
      let objectKey;
      
      // Try to extract standard path part
      if (url.includes('/munichweekly-photoupload/')) {
        objectKey = url.substring(url.indexOf('/munichweekly-photoupload/') + '/munichweekly-photoupload/'.length);
      } else {
        // Otherwise try to extract from the part after r2.dev/
        const parts = url.split('.r2.dev/');
        if (parts.length > 1) {
          objectKey = parts[1];
        }
      }
      
      // Ensure objectKey is in standard format
      if (objectKey) {
        // If objectKey already starts with /uploads/, use directly
        if (objectKey.startsWith('uploads/')) {
          objectKey = '/' + objectKey;
        } 
        // If no /uploads/ prefix but contains /issues/, add /uploads/ prefix
        else if (objectKey.includes('/issues/') && !objectKey.startsWith('/uploads/')) {
          objectKey = '/uploads/' + objectKey;
        }
        // If neither /uploads/ prefix nor /issues/, add /uploads/ prefix
        else if (!objectKey.startsWith('/uploads/')) {
          objectKey = '/uploads/' + objectKey;
        }
        
        return isDevEnv 
          ? objectKey // Local development environment
          : `https://img.munichweekly.art${objectKey}`; // Production environment
      }
    }
    return url;
  }
  
  // Handle local paths that already contain .r2.dev (possibly malformed URLs)
  if (url.includes('.r2.dev/')) {
    // Extract the actual path part
    const parts = url.split('.r2.dev/');
    if (parts.length > 1) {
      let path = parts[1];
      
      // Ensure path format is correct
      if (path.startsWith('uploads/')) {
        path = '/' + path;
      } else if (!path.startsWith('/uploads/')) {
        path = '/uploads/' + path;
      }
      
      return isDevEnv
        ? path // Local development environment
        : `https://img.munichweekly.art${path}`; // Production environment
    }
  }
  
  // Local uploaded image handling
  if (url.startsWith('/uploads/')) {
    // In production environment, use image CDN domain
    if (!isDevEnv) {
      return `https://img.munichweekly.art${url}`;
    }
    // Use Next.js configured API route proxy to avoid CORS issues
    return url; // Should have rewrite rules configured
  }
  
  // If only relative path without /uploads prefix, add /uploads prefix
  if (url.includes('/issues/') && !url.startsWith('/uploads/')) {
    const imagePath = `/uploads/${url}`;
    return isDevEnv ? imagePath : `https://img.munichweekly.art${imagePath}`;
  }
  
  // Other cases, keep original URL
  return url;
}

/**
 * Create URL with image transformation parameters
 * 
 * @param url - Original image URL
 * @param options - Image transformation options
 * @returns Optimized image URL
 */
export interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  fit?: 'cover' | 'contain' | 'scale-down';
  format?: 'auto' | 'webp' | 'avif' | 'jpeg';
  dpr?: number;
}

export function createImageUrl(url: string, options: ImageOptions = {}): string {
  // Handle empty or invalid URLs
  if (!url || url.trim() === '') {
    console.warn('createImageUrl: Empty or invalid URL provided');
    return '/placeholder.svg'; // Return placeholder image
  }
  
  // Special handling for static images - don't apply CDN transformations and parameters
  if (url.startsWith('/images/')) {
    console.log('Creating URL for static image:', url);
    // No longer add timestamp, allow browser to cache static images normally
    return url;
  }

  // First get environment-appropriate base URL through getImageUrl
  const baseUrl = getImageUrl(url);
  
  // Ensure URL is complete CDN URL in non-local environments
  const isDevEnv = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  let finalBaseUrl = baseUrl;
  
  // If relative path and not local environment, convert to complete CDN URL
  if (!isDevEnv && finalBaseUrl.startsWith('/') && !finalBaseUrl.startsWith('/images/')) {
    finalBaseUrl = `https://img.munichweekly.art${finalBaseUrl}`;
  }
  
  // If no parameters provided, return base URL directly
  if (Object.keys(options).length === 0) {
    return finalBaseUrl;
  }
  
  // Create URLSearchParams object to build query parameters
  const params = new URLSearchParams();
  
  // Add various image parameters
  if (options.width) params.append('width', options.width.toString());
  if (options.height) params.append('height', options.height.toString());
  if (options.quality) params.append('quality', options.quality.toString());
  
  // Optimize fit parameter handling
  if (options.fit) {
    params.append('fit', options.fit);
  } else {
    // If no fit parameter specified, intelligently choose based on whether both width and height are provided
    if (options.width && options.height) {
      params.append('fit', 'contain'); // Default to contain when both dimensions provided to avoid cropping
    } else {
      params.append('fit', 'scale-down'); // Use scale-down when only one dimension provided
    }
  }
  
  if (options.format) params.append('format', options.format);
  if (options.dpr) params.append('dpr', options.dpr.toString());
  
  // If no parameters, return URL directly
  if (Array.from(params).length === 0) {
    return finalBaseUrl;
  }
  
  // Build final URL
  const separator = finalBaseUrl.includes('?') ? '&' : '?';
  const finalUrl = `${finalBaseUrl}${separator}${params.toString()}`;
  
  // Debug information
  if (finalBaseUrl.includes('/uploads/')) {
    console.log('createImageUrl processing:', {
      input: url.substring(0, 50) + '...',
      options,
      output: finalUrl.substring(0, 100) + '...'
    });
  }
  
  return finalUrl;
}
