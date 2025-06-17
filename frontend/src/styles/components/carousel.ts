import { cva } from 'class-variance-authority';

/**
 * Main carousel container styles
 */
export const getCarouselStyles = cva(
  'relative w-full overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-900',
  {
    variants: {
      size: {
        desktop: 'h-[60vh] max-w-5xl mx-auto',
        mobile: 'h-[50vh] w-full',
      },
      loading: {
        true: 'animate-pulse',
        false: '',
      },
    },
    defaultVariants: {
      size: 'desktop',
      loading: false,
    },
  }
);

/**
 * Individual slide container styles
 */
export const getCarouselSlideStyles = cva(
  'absolute top-0 left-0 w-full h-full transition-transform duration-500 ease-in-out',
  {
    variants: {
      position: {
        current: 'translate-x-0 opacity-100',
        next: 'translate-x-full opacity-0',
        previous: '-translate-x-full opacity-0',
      },
    },
    defaultVariants: {
      position: 'current',
    },
  }
);

/**
 * Image styles within carousel slide
 */
export const getCarouselImageStyles = cva(
  'w-full h-full object-cover transition-transform duration-300',
  {
    variants: {
      hover: {
        true: 'scale-105',
        false: 'scale-100',
      },
      loading: {
        true: 'opacity-50',
        false: 'opacity-100',
      },
    },
    defaultVariants: {
      hover: false,
      loading: false,
    },
  }
);

/**
 * Overlay for description and controls
 */
export const getCarouselOverlayStyles = cva(
  'absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300',
  {
    variants: {
      visible: {
        true: 'opacity-100',
        false: 'opacity-0',
      },
      device: {
        desktop: '',
        mobile: 'bg-gradient-to-t from-black/60 via-transparent to-transparent',
      },
    },
    defaultVariants: {
      visible: false,
      device: 'desktop',
    },
  }
);

/**
 * Description text styles
 */
export const getCarouselDescriptionStyles = cva(
  'absolute bottom-0 left-0 right-0 p-6 text-white transition-all duration-300',
  {
    variants: {
      visible: {
        true: 'translate-y-0 opacity-100',
        false: 'translate-y-4 opacity-0',
      },
      device: {
        desktop: 'p-8',
        mobile: 'p-4',
      },
    },
    defaultVariants: {
      visible: false,
      device: 'desktop',
    },
  }
);

/**
 * Navigation control button styles (desktop arrow buttons)
 */
export const getCarouselControlStyles = cva(
  'absolute top-1/2 -translate-y-1/2 z-20 flex items-center justify-center text-gray-400/80 transition-all duration-300 hover:text-gray-300 hover:scale-110 active:scale-95',
  {
    variants: {
      position: {
        left: 'left-4 lg:left-6',
        right: 'right-4 lg:right-6',
      },
      visible: {
        true: 'opacity-100 pointer-events-auto',
        false: 'opacity-0 pointer-events-none',
      },
      size: {
        sm: 'w-12 h-12 text-xl',
        md: 'w-16 h-16 text-3xl',
        lg: 'w-20 h-20 text-4xl',
      },
    },
    defaultVariants: {
      position: 'left',
      visible: false,
      size: 'md',
    },
  }
);

/**
 * Carousel indicators (dots) styles
 */
export const getCarouselIndicatorsStyles = cva(
  'absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20',
  {
    variants: {
      visible: {
        true: 'opacity-100',
        false: 'opacity-0',
      },
    },
    defaultVariants: {
      visible: true,
    },
  }
);

/**
 * Individual indicator dot styles
 */
export const getCarouselIndicatorStyles = cva(
  'w-3 h-3 rounded-full transition-all duration-300 cursor-pointer',
  {
    variants: {
      active: {
        true: 'bg-white scale-125',
        false: 'bg-white/50 hover:bg-white/75',
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

/**
 * Loading state styles
 */
export const getCarouselLoadingStyles = cva(
  'absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800',
  {
    variants: {
      size: {
        sm: 'h-32',
        md: 'h-48',
        lg: 'h-64',
      },
    },
    defaultVariants: {
      size: 'lg',
    },
  }
);

/**
 * Error state styles
 */
export const getCarouselErrorStyles = cva(
  'absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
  {
    variants: {
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

/**
 * Meta information styles (author, issue, etc.)
 */
export const getCarouselMetaStyles = cva(
  'space-y-1 text-sm text-white/80',
  {
    variants: {
      position: {
        bottom: 'mb-2',
        top: 'mt-2',
      },
    },
    defaultVariants: {
      position: 'bottom',
    },
  }
);

/**
 * Touch/swipe indicator styles for mobile
 */
export const getTouchIndicatorStyles = cva(
  'absolute top-1/2 -translate-y-1/2 text-white/50 pointer-events-none transition-opacity duration-200',
  {
    variants: {
      direction: {
        left: 'left-4',
        right: 'right-4',
      },
      visible: {
        true: 'opacity-100',
        false: 'opacity-0',
      },
    },
    defaultVariants: {
      direction: 'left',
      visible: false,
    },
  }
);

/**
 * Autoplay progress indicator styles
 */
export const getAutoplayProgressStyles = cva(
  'absolute bottom-0 left-0 h-1 bg-white/50 transition-all duration-100 ease-linear',
  {
    variants: {
      playing: {
        true: 'opacity-100',
        false: 'opacity-0',
      },
    },
    defaultVariants: {
      playing: false,
    },
  }
); 