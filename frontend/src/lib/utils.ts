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
  if (!url) return '';
  
  // 测试环境
  const isDevEnv = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  
  // 外部完整URL，例如Cloudflare R2的URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // 如果URL包含pub-xxx.r2.dev，则将其转换为标准路径
    if (url.includes('.r2.dev/')) {
      let objectKey;
      
      // 尝试提取标准路径部分
      if (url.includes('/munichweekly-photoupload/')) {
        objectKey = url.substring(url.indexOf('/munichweekly-photoupload/') + '/munichweekly-photoupload/'.length);
      } else {
        // 否则尝试从r2.dev/后面的部分提取
        const parts = url.split('.r2.dev/');
        if (parts.length > 1) {
          objectKey = parts[1];
        }
      }
      
      // 确保objectKey是标准格式
      if (objectKey) {
        // 如果objectKey已经以/uploads/开头，则直接使用
        if (objectKey.startsWith('uploads/')) {
          objectKey = '/' + objectKey;
        } 
        // 如果没有/uploads/前缀但包含/issues/，添加/uploads/前缀
        else if (objectKey.includes('/issues/') && !objectKey.startsWith('/uploads/')) {
          objectKey = '/uploads/' + objectKey;
        }
        // 如果既没有/uploads/前缀也没有/issues/，则添加/uploads/前缀
        else if (!objectKey.startsWith('/uploads/')) {
          objectKey = '/uploads/' + objectKey;
        }
        
        return isDevEnv 
          ? objectKey // 本地开发环境
          : `https://img.munichweekly.art${objectKey}`; // 生产环境
      }
    }
    return url;
  }
  
  // 处理已经包含.r2.dev的本地路径（可能是错误格式的URL）
  if (url.includes('.r2.dev/')) {
    // 提取实际的路径部分
    const parts = url.split('.r2.dev/');
    if (parts.length > 1) {
      let path = parts[1];
      
      // 确保路径格式正确
      if (path.startsWith('uploads/')) {
        path = '/' + path;
      } else if (!path.startsWith('/uploads/')) {
        path = '/uploads/' + path;
      }
      
      return isDevEnv
        ? path // 本地开发环境
        : `https://img.munichweekly.art${path}`; // 生产环境
    }
  }
  
  // 本地上传图片处理
  if (url.startsWith('/uploads/')) {
    // 在生产环境下，使用图像CDN域名
    if (!isDevEnv) {
      return `https://img.munichweekly.art${url}`;
    }
    // 使用Next.js配置的API路由代理，避免CORS问题
    return url; // 应已配置rewrite规则
  }
  
  // 如果只有相对路径但不带/uploads前缀，添加/uploads前缀
  if (url.includes('/issues/') && !url.startsWith('/uploads/')) {
    const imagePath = `/uploads/${url}`;
    return isDevEnv ? imagePath : `https://img.munichweekly.art${imagePath}`;
  }
  
  // 其他情况，保留原URL
  return url;
}

/**
 * 创建带有图像变换参数的URL
 * 
 * @param url - 原始图片URL
 * @param options - 图像变换选项
 * @returns 优化的图片URL
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
  // 首先通过getImageUrl获取适合环境的基础URL
  const baseUrl = getImageUrl(url);
  
  // 确保在非本地环境中，URL是完整的CDN URL
  const isDevEnv = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  let finalBaseUrl = baseUrl;
  
  // 如果是相对路径且不是本地环境，转换为完整CDN URL
  if (!isDevEnv && finalBaseUrl.startsWith('/')) {
    finalBaseUrl = `https://img.munichweekly.art${finalBaseUrl}`;
  }
  
  // 如果没有提供任何参数，直接返回基础URL
  if (Object.keys(options).length === 0) {
    return finalBaseUrl;
  }
  
  // 创建URLSearchParams对象来构建查询参数
  const params = new URLSearchParams();
  
  // 添加各种图像参数
  if (options.width) params.append('width', options.width.toString());
  if (options.height) params.append('height', options.height.toString());
  if (options.quality) params.append('quality', options.quality.toString());
  if (options.fit) params.append('fit', options.fit);
  if (options.format) params.append('format', options.format);
  if (options.dpr) params.append('dpr', options.dpr.toString());
  
  // 如果没有参数，直接返回URL
  if (Array.from(params).length === 0) {
    return finalBaseUrl;
  }
  
  // 构建最终URL
  const separator = finalBaseUrl.includes('?') ? '&' : '?';
  return `${finalBaseUrl}${separator}${params.toString()}`;
}
