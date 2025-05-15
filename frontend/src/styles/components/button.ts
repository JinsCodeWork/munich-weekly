/**
 * Button component styles
 * Defines all button-related styles and variants
 * Mirrors the existing Button.tsx component styling for consistency
 */

import { cn } from '@/lib/utils';
import { buttonVariants } from '../variants';

/**
 * Get button classes with all style variations
 * 
 * @param variant - Button visual style: primary, secondary, ghost
 * @param size - Button size: sm, md, lg
 * @param className - Additional custom classes
 * @returns Combined button class names
 */
export function getButtonStyles({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: keyof typeof buttonVariants.variant;
  size?: keyof typeof buttonVariants.size;
  className?: string;
} = {}) {
  return cn(
    // Base styles
    buttonVariants.base,
    // Variant styles
    buttonVariants.variant[variant],
    // Size styles
    buttonVariants.size[size],
    // Additional custom classes
    className
  );
} 