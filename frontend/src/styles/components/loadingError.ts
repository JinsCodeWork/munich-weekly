/**
 * Loading and error state component styles
 * Defines styles for loading spinners and error messages
 */

import { cn } from '@/lib/utils';

/**
 * Loading spinner variants
 */
export const loadingSpinnerVariants = {
  default: 'animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700',
  small: 'animate-spin rounded-full h-6 w-6 border-b-2 border-gray-700',
  large: 'animate-spin rounded-full h-16 w-16 border-b-2 border-gray-700',
};

/**
 * Loading container variants
 */
export const loadingContainerVariants = {
  default: 'flex justify-center items-center py-20',
  compact: 'flex justify-center items-center py-8',
  inline: 'inline-flex justify-center items-center',
};

/**
 * Error container variants
 */
export const errorContainerVariants = {
  default: 'bg-red-50 border border-red-200 rounded-lg p-6 text-center mb-6',
  compact: 'bg-red-50 border border-red-200 rounded-lg p-4 text-center mb-4',
  toast: 'bg-red-50 border border-red-200 rounded-lg p-3 max-w-md shadow-md',
};

/**
 * Button variants for error actions
 */
export const errorButtonVariants = {
  primary: 'bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600',
  secondary: 'bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800',
};

/**
 * Get loading spinner styles
 */
export function getLoadingSpinnerStyles({
  variant = 'default',
  className,
}: {
  variant?: keyof typeof loadingSpinnerVariants;
  className?: string;
} = {}) {
  return cn(
    loadingSpinnerVariants[variant],
    className
  );
}

/**
 * Get loading container styles
 */
export function getLoadingContainerStyles({
  variant = 'default',
  className,
}: {
  variant?: keyof typeof loadingContainerVariants;
  className?: string;
} = {}) {
  return cn(
    loadingContainerVariants[variant],
    className
  );
}

/**
 * Get error container styles
 */
export function getErrorContainerStyles({
  variant = 'default',
  className,
}: {
  variant?: keyof typeof errorContainerVariants;
  className?: string;
} = {}) {
  return cn(
    errorContainerVariants[variant],
    className
  );
}

/**
 * Get error button styles
 */
export function getErrorButtonStyles({
  variant = 'primary',
  className,
}: {
  variant?: keyof typeof errorButtonVariants;
  className?: string;
} = {}) {
  return cn(
    errorButtonVariants[variant],
    className
  );
} 