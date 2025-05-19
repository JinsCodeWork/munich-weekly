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
 * @param serverUrl - Optional server URL, defaults to http://localhost:8080
 * @returns Properly formatted image URL
 */
export function getImageUrl(url: string, serverUrl: string = 'http://localhost:8080'): string {
  if (!url) return '';
  
  // 外部完整URL，例如Cloudflare R2的URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // 本地上传图片处理
  if (url.startsWith('/uploads/')) {
    // 使用Next.js配置的API路由代理，避免CORS问题
    return url; // 应已配置rewrite规则
  }
  
  // 如果只有相对路径但不带/uploads前缀，添加/uploads前缀
  if (url.includes('/issues/') && !url.startsWith('/uploads/')) {
    return `/uploads/${url}`; 
  }
  
  // 其他情况，保留原URL
  return url;
}
