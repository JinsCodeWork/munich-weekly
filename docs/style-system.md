# Munich Weekly - Style System Documentation

## Overview

Munich Weekly's style system is a comprehensive, type-safe approach to managing UI styles across the application. It leverages Tailwind CSS combined with TypeScript to create a reusable, maintainable styling system that promotes consistency and developer efficiency.

## Style System Architecture

The style system follows a component-based architecture where styles are organized by UI component type, with proper TypeScript typing and variant support.

### Directory Structure

```
styles/
├── components/           # Component-specific styles
│   ├── badge.ts         # Badge component styles
│   ├── button.ts        # Button component styles
│   ├── card.ts          # Card component styles
│   ├── container.ts     # Container component styles
│   ├── loadingError.ts  # Loading/error state styles
│   ├── modal.ts         # Modal component styles
│   ├── navigation/      # Navigation-specific styles
│   │   ├── header.ts    # Header component styles
│   │   └── navBar.ts    # Navigation bar styles
│   ├── table.ts         # Table component styles
│   └── thumbnail.ts     # Thumbnail component styles
├── index.ts             # Style exports
├── theme.ts             # Theme configuration
└── variants.ts          # Style variants and utilities
```

## Core Style Functions

The style system exports getter functions that return the appropriate Tailwind CSS classes based on component variants and props.

### Component Style Examples

#### Button Styles

```typescript
// button.ts
import { cva } from 'class-variance-authority';

export const getButtonStyles = cva(
  'inline-flex items-center justify-center rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500',
        outline: 'border border-gray-300 bg-transparent hover:bg-gray-100 focus:ring-gray-500',
        ghost: 'bg-transparent hover:bg-gray-100 focus:ring-gray-500',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);
```

#### Navigation Styles

```typescript
// navigation/navBar.ts
import { cva } from 'class-variance-authority';

export const getNavLinkStyles = cva(
  'transition-colors duration-200',
  {
    variants: {
      variant: {
        default: 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white',
        active: 'text-blue-600 font-medium dark:text-blue-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
```

#### Header Styles

```typescript
// navigation/header.ts
import { cva } from 'class-variance-authority';

export const getHeaderContainerStyles = cva(
  'w-full border-b',
  {
    variants: {
      variant: {
        default: 'bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800',
        transparent: 'bg-transparent border-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
```

#### Container and Layout Styles

The style system includes specialized configuration for the masonry layout system:

```typescript
// container.ts
export const CONTAINER_CONFIG = {
  masonry: {
    columnWidth: 300,  // Optimized card width
    gap: 20,          // Consistent spacing
    columns: {
      mobile: 2,      // 2 columns on mobile
      desktop: 4,     // 4 columns on desktop
    }
  }
} as const;

export const containerVariants = {
  // Optimized for masonry layout with viewport protection
  wide: 'w-full max-w-[min(1400px,calc(100vw-2rem))] mx-auto px-4 md:px-5 overflow-hidden',
};
```

**Masonry Layout Integration:**
- Mathematical precision: Container width calculated to fit exactly 4×300px columns with 20px gaps
- Viewport overflow protection prevents content from exceeding screen boundaries
- Responsive padding system ensures consistent margins across device sizes
- Centralized configuration enables easy layout adjustments across the entire system

#### Enhanced Container System

Munich Weekly implements an advanced container system with multiple variants and responsive configurations:

**Enhanced Padding Configuration:**
```typescript
export const CONTAINER_CONFIG = {
  // Enhanced responsive padding system
  padding: {
    mobile: 20,     // px-5 (upgraded from 16px)
    tablet: 32,     // px-8 (new breakpoint)
    desktop: 40,    // px-10 (upgraded from 20px)
    ultrawide: 60,  // px-15 (ultra-wide display support)
  },
  
  // Multiple container max-widths for different content types
  maxWidths: {
    default: 1400,  // Standard content layout
    narrow: 1000,   // Reading-focused content
    wide: 1600,     // Gallery and media-rich content
    ultrawide: 1800, // Modern ultra-wide display support
    full: '100%',   // Full-width layouts
  }
};
```

**Container Variants:**
```typescript
// Enhanced container variants with responsive padding
export const getContainerStyles = cva(
  'w-full mx-auto',
  {
    variants: {
      variant: {
        default: 'max-w-[1400px] px-5 md:px-8 lg:px-10 xl:px-12 2xl:px-16',
        narrow: 'max-w-[1000px] px-5 md:px-8 lg:px-10 xl:px-12 2xl:px-16',
        wide: 'max-w-[1600px] px-5 md:px-8 lg:px-10 xl:px-12 2xl:px-16',
        ultrawide: 'max-w-[1800px] px-5 md:px-8 lg:px-10 xl:px-12 2xl:px-20',
        fluid: 'max-w-full px-5 md:px-8 lg:px-10 xl:px-12 2xl:px-16',
        minimal: 'max-w-[1400px] px-2 md:px-3 lg:px-4',
      },
      spacing: {
        compact: 'px-3 md:px-4 lg:px-6 xl:px-8',
        standard: 'px-5 md:px-8 lg:px-10 xl:px-12',
        generous: 'px-6 md:px-10 lg:px-12 xl:px-16 2xl:px-20',
        minimal: 'px-2 md:px-3 lg:px-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      spacing: 'standard',
    },
  }
);
```

**Specialized Masonry Configurations:**
```typescript
// Page-specific masonry configurations
export const CONTAINER_CONFIG = {
  // Vote page configuration - emphasis on large image display
  voteMasonry: {
    columnWidth: { mobile: 170, tablet: 220, desktop: 320 },
    gap: { mobile: 8, tablet: 14, desktop: 20 },
    columns: { mobile: 2, tablet: 2, desktop: 4 }
  },
  
  // Account page configuration - optimized for sidebar layout
  accountMasonry: {
    columnWidth: { mobile: 160, tablet: 180, desktop: 240 },
    gap: { mobile: 8, tablet: 12, desktop: 16 },
    columns: { mobile: 2, tablet: 2, desktop: 4 }
  }
};
```

**Key Benefits:**
- **Professional Spacing**: Enhanced margins provide modern, spacious feel
- **Multi-Device Optimization**: Specific configurations for mobile, tablet, and desktop
- **Content-Type Flexibility**: Different variants for reading, galleries, and data interfaces
- **Ultra-Wide Support**: Modern display compatibility up to 1800px
- **Type Safety**: Full TypeScript support for all variants and configurations

## Usage Examples

### Basic Component Styling

```tsx
import { getButtonStyles } from '@/styles';

export const Button = ({ 
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  return (
    <button 
      className={getButtonStyles({ variant, size, className })} 
      {...props}
    >
      {children}
    </button>
  );
};
```

### Navigation Component Styling

```tsx
import { getNavLinkStyles } from '@/styles';

export default function MainNav() {
  const isActive = (path) => path === currentPath;
  
  return (
    <nav className="flex space-x-6">
      <a 
        href="/gallery" 
        className={getNavLinkStyles({ 
          variant: isActive('/gallery') ? 'active' : 'default' 
        })}
      >
        Gallery
      </a>
      <a 
        href="/submit" 
        className={getNavLinkStyles({ 
          variant: isActive('/submit') ? 'active' : 'default' 
        })}
      >
        Submit
      </a>
    </nav>
  );
}
```

### Header Component Styling

```tsx
import { getHeaderContainerStyles } from '@/styles';

export default function Header() {
  return (
    <header className={getHeaderContainerStyles({ variant: 'default' })}>
      <Container className="py-3">
        {/* Header content */}
      </Container>
    </header>
  );
}
```

## Recent Refactoring Summary

The style system was recently refactored to improve maintainability and consistency:

1. **Typography System Enhancement**:
   - Updated the font system from a single font to three specialized fonts
   - Added DM Sans as the main text font, replacing the previous Inter font
   - Introduced Space Grotesk as a dedicated heading font
   - Retained Playfair Display as the brand logo specific font
   - Unified font definitions in theme.ts to ensure consistency across the application
   - Updated font class name mapping: font-sans (text), font-heading (headings), font-playfair (logo)

2. **Next.js Image Configuration Update**:
   - Changed from deprecated `images.domains` to recommended `images.remotePatterns` configuration

3. **Authentication UI Improvements**:
   - Fixed glassmorphism effect in modals
   - Adjusted Modal component default styles to use dark semi-transparent background
   - Added animation support through tailwindcss-animate plugin
   - Fixed text color contrast issues
   - Eliminated white screen flashing with global dark background

4. **Navigation/Layout Refactoring**:
   - Created dedicated navigation bar style system (navBar.ts and header.ts)
   - Refactored MainNav and MobileNav to use style functions instead of inline styles
   - Centralized Header and MainHeader components styling
   - Ensured consistent responsive behavior

5. **Bug Fixes and Optimizations**:
   - Resolved TypeScript lint errors
   - Fixed require() import issues by switching to ESM import style
   - Optimized animations for form elements with sequential appearance

6. **Advanced Image Display System**:
   - Implemented intelligent aspect ratio detection with precision tolerances
   - Enhanced thumbnail positioning logic with responsive behavior
   - Added object-position support for precise image alignment control
   - Optimized image display strategy for different aspect ratios:
     * Landscape images prioritize complete display
     * Portrait images use strategic cropping to prevent letterboxing
     * 16:9 images receive special treatment for optimal balance
   - Introduced responsive positioning rules (desktop vs mobile)
   - Enhanced debugging capabilities with detailed parameter logging

## Best Practices

When extending the style system, follow these guidelines:

1. **Create Component-Specific Style Files**:
   - Place new component styles in the appropriate directory
   - Use the class-variance-authority (cva) pattern for consistency

2. **Type Safety**:
   - Ensure all style functions have proper TypeScript types
   - Use zod or similar for validation if needed

3. **Variants Over Custom Classes**:
   - Prefer defining variants within style functions rather than custom classes
   - This ensures consistency and makes theming easier

4. **Responsive Design**:
   - Implement styles with mobile-first approach
   - Use Tailwind's responsive prefixes consistently

5. **Theme Consistency**:
   - Use defined colors and spacing from the theme
   - Don't hardcode values that should come from the theme

6. **Testing**:
   - Test style functions with different variant combinations
   - Verify responsive behavior across device sizes

## Future Enhancements

The style system is designed to support future enhancements:

1. **Dark Mode Support**:
   - The structure is ready for dark mode implementation
   - Existing components use dark: variants where appropriate

2. **Theme Customization**:
   - Planned support for user theme preferences
   - Color scheme customization options

3. **Animation Expansion**:
   - More sophisticated animation patterns
   - Page transition animations

4. **Accessibility Improvements**:
   - Focus state enhancements
   - High contrast mode support 