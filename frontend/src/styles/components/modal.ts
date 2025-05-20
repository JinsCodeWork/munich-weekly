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
  'dark-glass': 'bg-black/20 backdrop-blur-md rounded-lg shadow-lg border border-white/30',
  'dark': 'bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 text-white',
};

/**
 * Image caption variants
 */
export const imageCaptionVariants = {
  default: 'px-6 py-3 bg-black/25 backdrop-blur-sm rounded-full mx-auto inline-block',
  pill: 'px-5 py-2 bg-black/20 backdrop-blur-sm rounded-full mx-auto inline-block',
  card: 'px-6 py-3 bg-black/15 backdrop-blur-sm rounded-lg mx-auto inline-block',
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

/**
 * Get image caption styles
 */
export function getImageCaptionStyles({
  variant = 'default',
  className,
  maxWidth = '85%',
}: {
  variant?: keyof typeof imageCaptionVariants;
  className?: string;
  maxWidth?: string;
} = {}) {
  return cn(
    imageCaptionVariants[variant],
    `max-w-[${maxWidth}]`,
    className
  );
} 