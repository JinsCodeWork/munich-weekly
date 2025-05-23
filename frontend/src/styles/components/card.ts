/**
 * Card component styles
 * Defines all card-related styles and variants
 * Based on existing card styling used in SubmissionCard component
 */

import { cn } from '@/lib/utils';
import { cardVariants } from '../variants';

/**
 * Additional submission card specific styles
 */
export const submissionCardStyles = {
  container: 'bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer',
  imageContainer: 'relative overflow-hidden h-48 sm:h-60',
  contentContainer: 'p-4 sm:p-4 p-2',
  title: 'text-lg font-semibold text-gray-900 mb-1 truncate',
  description: 'text-sm text-gray-500 line-clamp-2',
  metaContainer: 'flex items-center justify-between text-xs text-gray-500',
  metaItem: 'flex items-center',
  metaIcon: 'mr-1',
  badgeTopRight: 'absolute top-2 right-2 z-10',
  badgeTopLeft: 'absolute top-2 left-2 z-10',
};

/**
 * Get card classes with style variations
 * 
 * @param variant - Card visual style: default, flat, elevated
 * @param className - Additional custom classes
 * @returns Combined card class names
 */
export function getCardStyles({
  variant = 'default',
  className,
}: {
  variant?: keyof typeof cardVariants;
  className?: string;
} = {}) {
  return cn(
    // Base styles
    cardVariants[variant],
    // Additional custom classes
    className
  );
}

/**
 * Get submission card styles
 */
export function getSubmissionCardStyles(className?: string) {
  return cn(
    submissionCardStyles.container,
    className
  );
}

/**
 * Get submission card element styles by key
 */
export function getSubmissionCardElementStyles(element: keyof typeof submissionCardStyles, className?: string) {
  return cn(
    submissionCardStyles[element],
    className
  );
} 