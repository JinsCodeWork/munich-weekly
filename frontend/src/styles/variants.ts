/**
 * Style variants for components
 * Defines reusable style combinations for different component states and variants
 * These are mapped to the theme and ensure consistent styling across the application
 */

import { theme, ThemeColor } from './theme';
import { cn } from '@/lib/utils';

/**
 * Button variants
 * Matches existing button styles from Button.tsx component
 */
export const buttonVariants = {
  variant: {
    primary: 'bg-black text-white hover:bg-gray-800 focus:ring-gray-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300',
  },
  size: {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3',
  },
  base: 'rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
};

/**
 * Status badge variants
 * Based on current usage in the SubmissionTable component
 */
export const statusBadgeVariants = {
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  selected: 'bg-purple-100 text-purple-800',
  pending: 'bg-gray-100 text-gray-800',
  special: 'bg-purple-100 text-purple-800',
  warning: 'bg-yellow-100 text-yellow-800',
  info: 'bg-blue-100 text-blue-800',
};

/**
 * Card variants
 * Based on current usage in the SubmissionCard component
 */
export const cardVariants = {
  default: 'bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow',
  flat: 'bg-white border border-gray-200 rounded-lg overflow-hidden',
  elevated: 'bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md',
};

/**
 * Table variants
 * Based on current usage in the SubmissionTable component
 */
export const tableVariants = {
  header: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
  cell: 'px-4 py-4 whitespace-nowrap',
  row: 'hover:bg-gray-50',
};

/**
 * Helper functions for getting combined class names
 */

/**
 * Get button class names based on variant and size
 */
export function getButtonClasses(
  variant: keyof typeof buttonVariants.variant = 'primary', 
  size: keyof typeof buttonVariants.size = 'md', 
  className?: string
) {
  return cn(
    buttonVariants.base,
    buttonVariants.variant[variant],
    buttonVariants.size[size],
    className
  );
}

/**
 * Get status badge class names based on status
 */
export function getStatusBadgeClasses(
  status: keyof typeof statusBadgeVariants, 
  className?: string
) {
  const statusClass = status in statusBadgeVariants 
    ? statusBadgeVariants[status as keyof typeof statusBadgeVariants] 
    : statusBadgeVariants.pending;
    
  return cn(
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
    statusClass,
    className
  );
}

/**
 * Get card class names based on variant
 */
export function getCardClasses(
  variant: keyof typeof cardVariants = 'default',
  className?: string
) {
  return cn(
    cardVariants[variant],
    className
  );
}

/**
 * Get color class based on theme color and type
 */
export function getColorClass(
  color: ThemeColor, 
  type: 'bg' | 'text' | 'border' | 'hover' | 'focus' | 'lightest' = 'bg',
) {
  const colorBase = theme.colors[color];
  const intensity = theme.colors.intensities[type][color];
  return `${type === 'hover' ? 'hover:bg' : type}-${colorBase}-${intensity}`;
} 