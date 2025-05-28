/**
 * Professional responsive container system
 * Enhanced with modern spacing and improved responsive design
 */

import { cn } from '@/lib/utils';

/**
 * Container layout constants
 * Optimized for modern UI design with enhanced spacing
 */
export const CONTAINER_CONFIG = {
  // Maximum content widths for different layout needs
  maxWidths: {
    default: 1400,
    narrow: 1000,
    wide: 1600, // Increased for ultra-wide screens
    full: '100%',
  },
  // Enhanced horizontal padding for better content breathing room
  padding: {
    mobile: 20,     // px-5 (increased from 16px for better mobile UX)
    tablet: 32,     // px-8 (new breakpoint for tablets)
    desktop: 40,    // px-10 (increased from 20px for better desktop experience)
    ultrawide: 60,  // px-15 (new tier for ultra-wide screens)
  },
  // Masonry layout constants - optimized for enhanced spacing
  masonry: {
    columnWidth: 280,     // Reduced from 300px to give more space
    gap: 20,              // Reduced from 24px to allow more space for images
    columns: {
      mobile: 2,
      tablet: 3,          // New intermediate breakpoint
      desktop: 4,
      ultrawide: 5,       // Support for ultra-wide displays
    }
  },
  // Account page masonry configuration - optimized for sidebar layout
  accountMasonry: {
    columnWidth: {
      mobile: 160,        // Much smaller for mobile 2-column layout
      tablet: 180,        // Medium size for tablet 2-column layout
      desktop: 240,       // Larger for desktop 4-column layout
    },
    gap: {
      mobile: 8,          // Much smaller gap for mobile to minimize vertical spacing
      tablet: 12,         // Medium gap for tablet
      desktop: 16,        // Standard gap for desktop
    },
    columns: {
      mobile: 2,          // Mobile: 2 columns
      tablet: 2,          // iPad: 2 columns (changed from 3)
      desktop: 4,         // Desktop: 4 columns (changed from 3)
      ultrawide: 4,       // Ultra-wide: 4 columns maximum
    }
  },
  // Vote page masonry configuration - optimized for larger, more prominent display
  voteMasonry: {
    columnWidth: {
      mobile: 170,        // Proper mobile size for 2-column layout
      tablet: 220,        // Good tablet size for 2-column layout  
      desktop: 320,       // Large desktop size for 4-column layout
    },
    gap: {
      mobile: 8,          // Even smaller gap for mobile to maximize content density
      tablet: 14,         // Medium gap for tablet  
      desktop: 20,        // Standard gap for desktop
    },
    columns: {
      mobile: 2,          // Mobile: 2 columns (changed from 1)
      tablet: 2,          // iPad: 2 columns (same)
      desktop: 4,         // Desktop: 4 columns (changed from 3)
      ultrawide: 4,       // Ultra-wide: 4 columns (same)
    }
  },
  // Responsive breakpoints aligned with Tailwind defaults
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  }
} as const;

/**
 * Enhanced container variants with modern spacing and responsive design
 * Includes comprehensive viewport protection and enhanced UX
 */
export const containerVariants = {
  // Standard container with modern spacing
  default: 'w-full max-w-[1400px] mx-auto px-5 md:px-8 lg:px-10 xl:px-12 2xl:px-16',
  
  // Narrow container for content-focused pages
  narrow: 'w-full max-w-[1000px] mx-auto px-5 md:px-8 lg:px-10 xl:px-12',
  
  // Wide container optimized for masonry layout with enhanced spacing
  wide: 'w-full max-w-[min(1600px,calc(100vw-2.5rem))] mx-auto px-5 md:px-8 lg:px-10 xl:px-12 2xl:px-16 overflow-hidden',
  
  // Fluid container with consistent padding across all breakpoints
  fluid: 'w-full px-5 md:px-8 lg:px-10 xl:px-12 2xl:px-16',
  
  // Ultra-wide container for modern large displays
  ultrawide: 'w-full max-w-[1800px] mx-auto px-5 md:px-8 lg:px-10 xl:px-12 2xl:px-20',
  
  // Minimal padding for full-width layouts
  minimal: 'w-full max-w-[1400px] mx-auto px-3 md:px-4 lg:px-6',
};

/**
 * Responsive padding utility classes for granular control
 */
export const responsivePadding = {
  // Compact spacing for dense layouts
  compact: 'px-3 md:px-4 lg:px-6 xl:px-8',
  
  // Standard spacing for most content
  standard: 'px-5 md:px-8 lg:px-10 xl:px-12',
  
  // Generous spacing for premium layouts
  generous: 'px-6 md:px-10 lg:px-12 xl:px-16 2xl:px-20',
  
  // Minimal spacing for edge-to-edge content
  minimal: 'px-2 md:px-3 lg:px-4',
} as const;

/**
 * Get container styles with enhanced style variations
 * 
 * @param variant - Container width variant
 * @param spacing - Override spacing variant
 * @param className - Additional custom classes
 * @returns Combined container class names with modern responsive design
 */
export function getContainerStyles({
  variant = 'default',
  spacing,
  className,
}: {
  variant?: keyof typeof containerVariants;
  spacing?: keyof typeof responsivePadding;
  className?: string;
} = {}) {
  // Use custom spacing if provided, otherwise use variant's default spacing
  const baseClasses = spacing 
    ? `w-full ${variant === 'narrow' ? 'max-w-[1000px]' : variant === 'wide' ? 'max-w-[min(1600px,calc(100vw-2.5rem))]' : variant === 'ultrawide' ? 'max-w-[1800px]' : 'max-w-[1400px]'} mx-auto ${responsivePadding[spacing]}`
    : containerVariants[variant];

  return cn(
    baseClasses,
    // Additional utility classes for enhanced UX
    'relative', // Enable positioning context
    className
  );
}

/**
 * Specialized container for masonry layouts with optimized spacing
 */
export function getMasonryContainerStyles({
  className,
}: {
  className?: string;
} = {}) {
  return cn(
    'w-full max-w-[min(1600px,calc(100vw-3rem))] mx-auto',
    'px-5 md:px-8 lg:px-10 xl:px-12 2xl:px-16',
    'overflow-hidden', // Prevent horizontal scroll
    className
  );
}

/**
 * Get responsive margin classes for consistent vertical spacing
 */
export const verticalSpacing = {
  // Page sections
  section: 'py-12 md:py-16 lg:py-20 xl:py-24',
  
  // Content blocks
  content: 'py-8 md:py-10 lg:py-12 xl:py-16',
  
  // Compact sections
  compact: 'py-6 md:py-8 lg:py-10',
  
  // Minimal spacing
  minimal: 'py-4 md:py-6',
} as const; 