/**
 * Header component styles
 * Defines styles for page headers and main header component
 */

import { cn } from '@/lib/utils';

/**
 * Header container variants
 */
export const headerContainerVariants = {
  default: 'bg-white border-b border-gray-200 mb-6',
  transparent: 'bg-transparent',
  colored: 'bg-blue-600 text-white',
  hero: 'bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12',
};

/**
 * Header content variants
 */
export const headerContentVariants = {
  default: 'flex flex-col md:flex-row justify-between items-center py-6',
  centered: 'flex flex-col items-center text-center py-6',
  compact: 'flex justify-between items-center py-4',
  spaceBetween: 'flex flex-col md:flex-row justify-between items-start md:items-center py-6',
};

/**
 * Header title variants
 */
export const headerTitleVariants = {
  default: 'text-2xl font-bold tracking-tight',
  large: 'text-3xl md:text-4xl font-bold tracking-tight',
  medium: 'text-xl md:text-2xl font-bold tracking-tight',
  small: 'text-lg font-bold tracking-tight',
};

/**
 * Header description variants
 */
export const headerDescriptionVariants = {
  default: 'text-gray-500 mt-1',
  large: 'text-lg text-gray-500 mt-2 max-w-3xl',
  hero: 'text-lg text-white/80 mt-4 max-w-2xl',
};

/**
 * Header action area variants
 */
export const headerActionVariants = {
  default: 'mt-4 md:mt-0 flex flex-wrap gap-3',
  stacked: 'mt-6 flex flex-col gap-3 w-full sm:w-auto',
  inline: 'mt-4 md:mt-0 flex items-center gap-3',
};

/**
 * Get header container styles
 */
export function getHeaderContainerStyles({
  variant = 'default',
  className,
}: {
  variant?: keyof typeof headerContainerVariants;
  className?: string;
} = {}) {
  return cn(
    headerContainerVariants[variant],
    className
  );
}

/**
 * Get header content styles
 */
export function getHeaderContentStyles({
  variant = 'default',
  className,
}: {
  variant?: keyof typeof headerContentVariants;
  className?: string;
} = {}) {
  return cn(
    headerContentVariants[variant],
    className
  );
}

/**
 * Get header title styles
 */
export function getHeaderTitleStyles({
  variant = 'default',
  className,
}: {
  variant?: keyof typeof headerTitleVariants;
  className?: string;
} = {}) {
  return cn(
    headerTitleVariants[variant],
    className
  );
}

/**
 * Get header description styles
 */
export function getHeaderDescriptionStyles({
  variant = 'default',
  className,
}: {
  variant?: keyof typeof headerDescriptionVariants;
  className?: string;
} = {}) {
  return cn(
    headerDescriptionVariants[variant],
    className
  );
}

/**
 * Get header action area styles
 */
export function getHeaderActionStyles({
  variant = 'default',
  className,
}: {
  variant?: keyof typeof headerActionVariants;
  className?: string;
} = {}) {
  return cn(
    headerActionVariants[variant],
    className
  );
} 