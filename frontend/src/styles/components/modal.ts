/**
 * Modal component styles
 * Defines styles for modal dialog and overlay
 */

import { cn } from '@/lib/utils';

/**
 * Modal overlay variants
 */
export const modalOverlayVariants = {
  default: 'fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm',
  dark: 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm',
  light: 'fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm',
};

/**
 * Modal content variants
 */
export const modalContentVariants = {
  default: 'bg-white rounded-lg shadow-lg',
  glassmorphism: 'bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-white/20',
  'dark-glass': 'bg-black/30 backdrop-blur-md rounded-lg shadow-lg border border-white/30',
};

/**
 * Modal animation states - only for closing
 */
export const modalAnimationStates = {
  overlay: {
    hidden: 'opacity-0 transition-opacity duration-300',
  }
};

/**
 * Get modal overlay classes
 */
export function getModalOverlayStyles({
  variant = 'default',
  isClosing = false,
  className,
}: {
  variant?: keyof typeof modalOverlayVariants;
  isClosing?: boolean;
  className?: string;
} = {}) {
  return cn(
    modalOverlayVariants[variant],
    isClosing ? modalAnimationStates.overlay.hidden : '',
    className
  );
}

/**
 * Get modal content classes
 */
export function getModalContentStyles({
  variant = 'default',
  className,
}: {
  variant?: keyof typeof modalContentVariants;
  className?: string;
} = {}) {
  return cn(
    modalContentVariants[variant],
    className
  );
} 