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
