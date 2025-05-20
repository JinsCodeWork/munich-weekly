/**
 * Theme configuration file
 * Defines global color palette, spacing, typography and other design tokens
 * Used to maintain consistency across the application
 */

export const theme = {
  colors: {
    // Main color palette
    primary: 'gray',
    secondary: 'gray',
    success: 'green',
    error: 'red',
    special: 'purple',
    
    // Color intensities mapping based on existing usage
    intensities: {
      bg: {
        primary: 900,
        secondary: 200,
        success: 500,
        error: 500,
        special: 500,
      },
      text: {
        primary: 900,
        secondary: 800,
        success: 800,
        error: 800,
        special: 800,
      },
      hover: {
        primary: 800,
        secondary: 300,
        success: 600,
        error: 600,
        special: 600,
      },
      border: {
        primary: 700,
        secondary: 200,
        success: 400,
        error: 400,
        special: 400,
      },
      focus: {
        primary: 700,
        secondary: 400,
        success: 500,
        error: 500,
        special: 500,
      },
      lightest: {
        primary: 100,
        secondary: 100,
        success: 100,
        error: 100,
        special: 100,
      }
    },
  },
  
  // Font families
  fontFamily: {
    heading: 'font-heading',
    body: 'font-sans',
    logo: 'font-playfair',
  },
  
  // Font sizes following current usage
  fontSizes: {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
  },
  
  // Font weights
  fontWeights: {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  },
  
  // Common spacing values
  spacing: {
    sm: 'px-2 py-1',
    md: 'px-3 py-2',
    lg: 'px-4 py-3',
    xl: 'px-5 py-4',
  },
  
  // Common border radius values
  borderRadius: {
    none: 'rounded-none',
    sm: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  },
  
  // Shadow values
  shadows: {
    sm: 'shadow-sm',
    md: 'shadow',
    lg: 'shadow-md',
    xl: 'shadow-lg',
  },
  
  // Common transition values
  transitions: {
    default: 'transition-all duration-300',
    fast: 'transition-all duration-200',
    slow: 'transition-all duration-500',
  }
};

// Type exports for type safety
export type ThemeColor = keyof typeof theme.colors.intensities.bg;
export type ThemeFontSize = keyof typeof theme.fontSizes;
export type ThemeSpacing = keyof typeof theme.spacing;
export type ThemeFontWeight = keyof typeof theme.fontWeights;
export type ThemeBorderRadius = keyof typeof theme.borderRadius;
export type ThemeShadow = keyof typeof theme.shadows;
export type ThemeTransition = keyof typeof theme.transitions;
export type ThemeFontFamily = keyof typeof theme.fontFamily; 