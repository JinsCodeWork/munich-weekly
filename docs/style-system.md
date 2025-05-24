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