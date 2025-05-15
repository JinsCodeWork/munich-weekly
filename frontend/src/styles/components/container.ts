/**
 * Container component styles
 * Defines layout container styling for consistent page width and margins
 */

import { cn } from '@/lib/utils';

/**
 * Container variants
 */
export const containerVariants = {
  default: 'w-full max-w-[1400px] mx-auto px-5 md:px-6',
  narrow: 'w-full max-w-[1000px] mx-auto px-5 md:px-6',
  wide: 'w-full max-w-[1800px] mx-auto px-5 md:px-6',
  fluid: 'w-full px-5 md:px-6',
};

/**
 * Get container classes with style variations
 * 
 * @param variant - Container width variant
 * @param className - Additional custom classes
 * @returns Combined container class names
 */
export function getContainerStyles({
  variant = 'default',
  className,
}: {
  variant?: keyof typeof containerVariants;
  className?: string;
} = {}) {
  return cn(
    containerVariants[variant],
    className
  );
} 