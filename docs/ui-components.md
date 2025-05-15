# Munich Weekly - UI Component Library

## Overview

Munich Weekly utilizes a custom UI component library built with React, TypeScript, and Tailwind CSS. The component library provides consistent, reusable interface elements across the application with a focus on photography presentation and user interaction.

## Style Management System

The application implements a systematic approach to style management that combines Tailwind CSS with TypeScript for type safety and consistency.

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

### Key Features

- **Centralized Style Functions**: Replaces inline styles with reusable style functions
- **Type-safe Style Variants**: TypeScript-powered style variants with proper type checking
- **Theme Consistency**: Unified theme variables for colors, spacing, and animations
- **Animation Support**: Integration with tailwindcss-animate for consistent animations
- **Responsive Design**: Mobile-first responsive styles with consistent breakpoints
- **Dark Mode Ready**: Structure supports future theme switching capabilities

### Usage Examples

#### Using Style Functions

```tsx
import { getButtonStyles } from '@/styles';

export const Button = ({ 
  variant = 'primary',
  size = 'medium',
  children,
  ...props
}) => {
  return (
    <button 
      className={getButtonStyles({ variant, size })} 
      {...props}
    >
      {children}
    </button>
  );
};
```

#### Header Component Styling

```tsx
import { getHeaderContainerStyles } from '@/styles';

export default function Header() {
  return (
    <header className={getHeaderContainerStyles({ variant: 'default' })}>
      {/* Header content */}
    </header>
  );
}
```

#### Navigation Styling

```tsx
import { getNavLinkStyles } from '@/styles';

export default function MainNav() {
  return (
    <nav>
      <a href="#" className={getNavLinkStyles({ className: 'mr-6' })}>Gallery</a>
      <a href="#" className={getNavLinkStyles({ className: 'mr-6' })}>Submit</a>
    </nav>
  );
}
```

## Recent Style Updates

The following style improvements have been implemented:

1. **Image Configuration**: Updated Next.js image configuration from deprecated `images.domains` to recommended `images.remotePatterns` configuration

2. **Authentication UI Improvements**:
   - Fixed glassmorphism effect display issues
   - Adjusted Modal component to use dark semi-transparent background
   - Added animation support with tailwindcss-animate plugin
   - Fixed text color visibility issues on different backgrounds
   - Eliminated white screen flashing by setting global dark background

3. **Navigation/Layout Refactoring**:
   - Created navigation bar style system
   - Refactored MainNav and MobileNav components to use style functions
   - Centralized header styling with reusable functions
   - Ensured responsive design consistency

4. **Bug Fixes and Optimizations**:
   - Resolved TypeScript lint errors
   - Fixed require() import issues, switching to ESM style imports
   - Optimized animation effects for form elements

## Core UI Components

### Layout Components

- **Container**: A responsive container with consistent padding and maximum width
- **Modal**: A flexible modal dialog with glassmorphism styling and backdrop blur

### Navigation Components

- **MainNav**: Desktop navigation component with consistent styling
- **MobileNav**: Mobile navigation component with responsive design
- **Header/MainHeader**: Header components with standardized styling

### Form Components

- **Button**: Styled button with variants (primary, secondary, outline, etc.)
- **Input**: Form input components with consistent styling

### Media Components

- **Thumbnail**: Image thumbnail component with aspect ratio control
- **ImageViewer**: Modal-based full-size image viewing component

### Content Components

- **Badge**: Label/tag component for metadata
- **Card**: Content card component for consistent layout

## Animation System

The component library uses the tailwindcss-animate plugin for consistent animations. Common animations include:

- Fade effects
- Transition effects for modals
- Sequential item appearance in forms and lists
- Hover state transitions

## Responsive Design

All components are designed with a mobile-first approach and respond to standard breakpoints:

- **sm**: 640px and above
- **md**: 768px and above
- **lg**: 1024px and above
- **xl**: 1280px and above
- **2xl**: 1536px and above

## Future Enhancements

- Complete dark mode support
- Additional component variants
- Animation system expansion
- Color scheme customization