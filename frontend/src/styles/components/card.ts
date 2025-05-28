/**
 * Card component styles
 * Defines all card-related styles and variants
 * Enhanced with masonry layout support and wide image styling
 */

import { cn } from '@/lib/utils';
import { cardVariants } from '../variants';

/**
 * Submission card specific styles for different layout contexts
 */
export const submissionCardStyles = {
  // Container styles
  container: 'bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer',
  containerWide: 'bg-white border-2 border-gray-100 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer',
  
  // Image container styles
  imageContainer: 'relative overflow-hidden h-48 sm:h-60', // For grid layout - fixed height
  imageContainerMasonry: 'relative overflow-hidden bg-gray-100', // For masonry layout - adaptive height
  imageContainerWide: 'relative overflow-hidden bg-gray-100 min-h-[200px]', // For wide images in masonry
  
  // Content container styles
  contentContainer: 'p-3 sm:p-4',
  contentContainerWide: 'p-4 sm:p-5', // Enhanced padding for wide images
  
  // Text styles
  title: 'text-sm sm:text-base font-medium text-gray-900 mb-1 line-clamp-2',
  titleWide: 'text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2', // Enhanced for wide images
  description: 'text-sm text-gray-600 mb-2 line-clamp-2',
  descriptionWide: 'text-sm text-gray-600 mb-3 line-clamp-3', // More lines for wide images
  
  // Metadata styles
  metaContainer: 'flex items-center justify-between text-xs text-gray-500 mt-2',
  metaContainerWide: 'flex items-center justify-between text-sm text-gray-600 mt-3', // Enhanced for wide images
  metaItem: 'flex items-center',
  metaIcon: 'mr-1',
  
  // Badge positioning
  badgeTopRight: 'absolute top-2 right-2 z-10',
  badgeTopLeft: 'absolute top-2 left-2 z-10',
  badgeTopRightWide: 'absolute top-3 right-3 z-10', // Enhanced positioning for wide images
  badgeTopLeftWide: 'absolute top-3 left-3 z-10',
  
  // Image loading states
  imageLoading: 'absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center',
  imageError: 'absolute inset-0 bg-gray-100 flex items-center justify-center',
  
  // Wide image specific enhancements
  wideImageIndicator: 'absolute top-2 right-2 z-5 bg-black/20 text-white text-xs px-2 py-1 rounded',
  wideImageOverlay: 'absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300',
};

/**
 * Masonry layout specific card styles
 */
export const masonryCardStyles = {
  // Base masonry card
  base: 'group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden',
  
  // Wide image variant
  wide: 'group bg-white rounded-lg shadow-md hover:shadow-lg border-2 border-gray-100 hover:border-gray-200 transition-all duration-300 overflow-hidden',
  
  // Image container with dynamic aspect ratio
  imageContainer: 'relative overflow-hidden bg-gray-100',
  
  // Content area with consistent spacing
  content: 'p-3 sm:p-4',
  contentWide: 'p-4 sm:p-5',
  
  // Enhanced hover effects for masonry
  hoverEffect: 'transform hover:scale-[1.02] transition-transform duration-200',
  hoverEffectWide: 'transform hover:scale-[1.01] transition-transform duration-300',
};

/**
 * Vote interface specific styles for different contexts
 */
export const voteInterfaceStyles = {
  container: 'w-full flex items-center justify-between',
  voteCount: 'text-sm font-medium text-gray-700',
  voteCountWide: 'text-base font-semibold text-gray-800', // Enhanced for wide images
  buttonContainer: 'z-10',
  button: 'text-xs sm:text-sm px-3 py-1 min-w-[60px]',
  buttonWide: 'text-sm px-4 py-2 min-w-[80px]', // Enhanced for wide images
};

/**
 * Responsive text size utilities for different card contexts
 */
export const responsiveTextStyles = {
  // Regular card text sizes
  title: {
    mobile: 'text-sm',
    desktop: 'text-base',
  },
  description: {
    mobile: 'text-xs',
    desktop: 'text-sm',
  },
  meta: {
    mobile: 'text-xs',
    desktop: 'text-xs',
  },
  
  // Wide card enhanced text sizes
  titleWide: {
    mobile: 'text-base',
    desktop: 'text-lg',
  },
  descriptionWide: {
    mobile: 'text-sm',
    desktop: 'text-base',
  },
  metaWide: {
    mobile: 'text-sm',
    desktop: 'text-sm',
  },
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
 * Get submission card styles based on layout context and wide image status
 */
export function getSubmissionCardStyles({
  isWide = false,
  layoutContext = 'default',
  className,
}: {
  isWide?: boolean;
  layoutContext?: 'default' | 'masonry' | 'grid';
  className?: string;
} = {}) {
  if (layoutContext === 'masonry') {
    return cn(
      isWide ? masonryCardStyles.wide : masonryCardStyles.base,
      className
    );
  }
  
  return cn(
    isWide ? submissionCardStyles.containerWide : submissionCardStyles.container,
    className
  );
}

/**
 * Get submission card element styles by key with wide image support
 */
export function getSubmissionCardElementStyles(
  element: keyof typeof submissionCardStyles, 
  isWide: boolean = false,
  className?: string
) {
  // Handle wide image variants
  if (isWide) {
    const wideVariants: Partial<Record<keyof typeof submissionCardStyles, keyof typeof submissionCardStyles>> = {
      container: 'containerWide',
      imageContainer: 'imageContainerWide', 
      contentContainer: 'contentContainerWide',
      title: 'titleWide',
      description: 'descriptionWide',
      metaContainer: 'metaContainerWide',
      badgeTopRight: 'badgeTopRightWide',
      badgeTopLeft: 'badgeTopLeftWide',
    };
    
    const wideElement = wideVariants[element];
    if (wideElement && wideElement in submissionCardStyles) {
      return cn(submissionCardStyles[wideElement], className);
    }
  }
  
  return cn(submissionCardStyles[element], className);
}

/**
 * Get masonry specific card styles
 */
export function getMasonryCardStyles({
  isWide = false,
  enableHoverEffect = true,
  className,
}: {
  isWide?: boolean;
  enableHoverEffect?: boolean;
  className?: string;
} = {}) {
  return cn(
    isWide ? masonryCardStyles.wide : masonryCardStyles.base,
    enableHoverEffect && (isWide ? masonryCardStyles.hoverEffectWide : masonryCardStyles.hoverEffect),
    className
  );
}

/**
 * Get vote interface styles based on context
 */
export function getVoteInterfaceStyles({
  isWide = false,
  className,
}: {
  isWide?: boolean;
  className?: string;
} = {}) {
  return {
    container: cn(voteInterfaceStyles.container, className),
    voteCount: cn(isWide ? voteInterfaceStyles.voteCountWide : voteInterfaceStyles.voteCount),
    buttonContainer: cn(voteInterfaceStyles.buttonContainer),
    button: cn(isWide ? voteInterfaceStyles.buttonWide : voteInterfaceStyles.button),
  };
}

/**
 * Get responsive text classes for different card types
 */
export function getResponsiveTextClasses(
  textType: keyof typeof responsiveTextStyles,
  isWide: boolean = false
) {
  const styleSet = isWide && `${textType}Wide` in responsiveTextStyles 
    ? responsiveTextStyles[`${textType}Wide` as keyof typeof responsiveTextStyles]
    : responsiveTextStyles[textType];
    
  if (!styleSet || typeof styleSet !== 'object') return '';
  
  return cn(
    styleSet.mobile,
    `sm:${styleSet.desktop}`
  );
}

/**
 * Generate dynamic aspect ratio style for masonry images
 */
export function getAspectRatioStyle(aspectRatio: number) {
  return {
    aspectRatio: aspectRatio.toString(),
  };
}

/**
 * Get minimum height for wide images in masonry layout
 */
export function getWideImageMinHeight(aspectRatio: number, baseWidth: number = 280) {
  // Calculate minimum height based on aspect ratio and base width
  // For wide images spanning 2 columns with gap
  const wideWidth = baseWidth * 2 + 16; // Assuming 16px gap
  const minHeight = Math.max(200, wideWidth / aspectRatio);
  return `${minHeight}px`;
} 