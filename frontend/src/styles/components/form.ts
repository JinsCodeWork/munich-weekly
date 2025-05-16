import { cn } from "@/lib/utils";

/**
 * Form container style options
 */
export type FormContainerOptions = {
  variant?: 'default' | 'card' | 'transparent';
  className?: string;
};

/**
 * Form field style options
 */
export type FormFieldOptions = {
  variant?: 'default' | 'filled' | 'outline';
  state?: 'default' | 'error' | 'success' | 'disabled';
  className?: string;
};

/**
 * Get styles for form containers
 */
export function getFormContainerStyles(options?: FormContainerOptions) {
  const variant = options?.variant || 'default';
  
  return cn(
    // Base styles
    "w-full",
    
    // Variant-specific styles
    {
      'bg-white shadow rounded-lg p-6': variant === 'default',
      'bg-white shadow-md rounded-lg p-6 border border-gray-100': variant === 'card',
      'bg-transparent': variant === 'transparent',
    },
    
    // Custom class
    options?.className
  );
}

/**
 * Get styles for form fields (inputs, textareas, etc.)
 */
export function getFormFieldStyles(options?: FormFieldOptions) {
  const variant = options?.variant || 'default';
  const state = options?.state || 'default';
  
  return cn(
    // Base styles
    "w-full px-3 py-2 rounded-md transition-colors",
    
    // Variant-specific styles
    {
      'border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500': variant === 'default',
      'border-0 bg-gray-100 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500': variant === 'filled',
      'bg-transparent border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500': variant === 'outline',
    },
    
    // State-specific styles
    {
      'border-red-300 focus:ring-red-500 focus:border-red-500': state === 'error',
      'border-green-300 focus:ring-green-500 focus:border-green-500': state === 'success',
      'bg-gray-100 text-gray-500 cursor-not-allowed': state === 'disabled',
    },
    
    // Custom class
    options?.className
  );
}

/**
 * Get styles for form labels
 */
export function getFormLabelStyles(options?: { className?: string }) {
  return cn(
    "block text-sm font-medium text-gray-700 mb-1",
    options?.className
  );
}

/**
 * Get styles for form section
 */
export function getFormSectionStyles(options?: { className?: string }) {
  return cn(
    "space-y-4",
    options?.className
  );
}

/**
 * Get styles for form error messages
 */
export function getFormErrorStyles(options?: { className?: string }) {
  return cn(
    "text-red-500 text-sm mt-1",
    options?.className
  );
}

/**
 * Get styles for form help text
 */
export function getFormHelpStyles(options?: { className?: string }) {
  return cn(
    "text-xs text-gray-500 mt-1",
    options?.className
  );
} 