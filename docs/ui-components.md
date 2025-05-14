# Munich Weekly - UI Component Library

## Overview

This document provides detailed information about the UI components available in the Munich Weekly frontend application. These components are designed to provide a consistent user experience across the application while maintaining flexibility and reusability.

## Core Design Principles

The UI component library adheres to the following principles:

1. **Consistency**: Components maintain consistent styling, behavior, and interaction patterns
2. **Responsiveness**: All components adapt to different screen sizes
3. **Accessibility**: Components follow WCAG guidelines for accessibility
4. **Reusability**: Components are designed to be reused across the application
5. **Modular Design**: Each component has a single responsibility

## Component Categories

### Navigation Components

#### `MainNav`

The primary navigation component for desktop and tablet views.

**Features**:
- Responsive layout that adapts to screen size
- Support for navigation links defined in constants
- User authentication state integration
- User dropdown menu for authenticated users
- Login/register buttons for unauthenticated users

**Usage**:
```tsx
<MainNav />
```

#### `MobileNav`

The mobile navigation component that appears on small screens.

**Features**:
- Hamburger menu toggle
- Slide-in menu panel
- User information display for authenticated users
- Navigation links
- Authentication buttons
- Prevents background scrolling when open

**Usage**:
```tsx
<MobileNav 
  onLoginClick={() => {}} 
  onRegisterClick={() => {}} 
/>
```

#### `Logo`

The application logo component with size variations.

**Props**:
- `size`: "sm" | "md" | "lg" - Controls the logo size
- `className`: Additional CSS classes

**Usage**:
```tsx
<Logo size="lg" className="mr-8" />
```

### Authentication Components

#### `LoginForm`

A modal form for user login with glassmorphism effect.

**Features**:
- Email and password input fields
- Remember me checkbox
- Forgot password link
- Error display
- Success message
- Loading state
- Register link

**Props**:
- `isOpen`: Boolean to control modal visibility
- `onClose`: Function to call when closing the modal
- `onRegisterClick`: Function to switch to register form

**Usage**:
```tsx
<LoginForm 
  isOpen={isLoginOpen} 
  onClose={handleCloseLogin} 
  onRegisterClick={handleRegisterClick}
/>
```

#### `RegisterForm`

A modal form for user registration with glassmorphism effect.

**Features**:
- Email, nickname, and password fields
- Password confirmation
- Form validation
- Error display
- Success message
- Loading state
- Login link

**Props**:
- `isOpen`: Boolean to control modal visibility
- `onClose`: Function to call when closing the modal
- `onLoginClick`: Function to switch to login form

**Usage**:
```tsx
<RegisterForm
  isOpen={isRegisterOpen}
  onClose={handleCloseRegister}
  onLoginClick={handleLoginClick}
/>
```

### UI Foundation Components

#### `Modal`

A reusable modal component with glassmorphism effect.

**Features**:
- Backdrop with blur effect
- Centered content
- Close button
- Keyboard accessibility (ESC to close)
- Prevents background scrolling

**Props**:
- `isOpen`: Boolean to control modal visibility
- `onClose`: Function to call when closing the modal
- `children`: React nodes to render inside the modal

**Usage**:
```tsx
<Modal isOpen={isOpen} onClose={onClose}>
  <div>Modal content here</div>
</Modal>
```

#### `Container`

A responsive container component with consistent padding.

**Features**:
- Responsive width
- Consistent horizontal padding
- Optional component type (as prop)

**Props**:
- `children`: React nodes to render inside the container
- `as`: HTML element or component to render (default: "div")
- `className`: Additional CSS classes

**Usage**:
```tsx
<Container as="section" className="py-8">
  Content here
</Container>
```

### Account Page Components

#### `AccountLayout`

Layout component for user account pages with sidebar navigation.

**Features**:
- Responsive layout with sidebar and main content area
- User information display
- Navigation links for account sections
- Logout button
- Authentication check with redirect

**Usage**:
```tsx
<AccountLayout>
  <ProfileContent />
</AccountLayout>
```

## Animation System

The UI components utilize several animation patterns:

1. **Fade-in Animations**: Components fade in with staggered delays
2. **Transition Animations**: Smooth transitions for interactive elements
3. **Transform Animations**: Subtle transform effects for hover states

Example of the animation pattern used in forms:
```tsx
<div className="animate-fadeIn opacity-0" style={{ animationDelay: "0.2s" }}>
  Content here
</div>
```

## Style System

The UI components use Tailwind CSS for styling with consistent patterns:

### Color Palette

- **Primary**: Blue (`blue-500`, `blue-600`)
- **Gray Scale**: Various gray shades for text and backgrounds
- **Success**: Green (`green-500`)
- **Error**: Red (`red-400`, `red-500`)
- **White/Black**: For contrast and backgrounds

### Typography

- **Headings**: Various sizes with consistent font weights
- **Body Text**: Regular and medium weights with appropriate sizes
- **Form Labels**: Smaller, medium weight text

### Spacing

Consistent spacing using Tailwind's spacing scale:
- Small spacing: 2, 3, 4 (0.5rem, 0.75rem, 1rem)
- Medium spacing: 6, 8, 10 (1.5rem, 2rem, 2.5rem)
- Large spacing: 12, 16, 20 (3rem, 4rem, 5rem)

## Responsive Patterns

The component library implements several responsive patterns:

1. **Container Queries**: The main container adapts to viewport width
2. **Flex/Grid Layouts**: Flexible layouts that reflow based on available space
3. **Component Visibility**: Components appear/hide based on breakpoints
4. **Adaptive Spacing**: Spacing scales with viewport size

Breakpoints follow Tailwind's default system:
- `sm`: 640px and up
- `md`: 768px and up
- `lg`: 1024px and up
- `xl`: 1280px and up

## Form Components

Forms follow consistent patterns:

1. **Input Design**: Consistent styling for all input fields
2. **Validation**: Client-side validation with error messages
3. **State Handling**: Loading, success, and error states
4. **Accessibility**: Proper labeling and focus states

## Custom Utility Functions

### `cn`

A utility function for conditional class name composition using `clsx` and `tailwind-merge`.

**Usage**:
```tsx
import { cn } from "@/lib/utils"

<div className={cn(
  "base-class", 
  isActive && "active-class",
  className
)}>
  Content
</div>
```

## Best Practices for Component Development

When extending the component library:

1. **Component Structure**:
   - Define a clear interface for props
   - Use TypeScript for type safety
   - Include JSDoc comments for functionality

2. **Styling Approach**:
   - Use Tailwind classes directly in components
   - Extract common patterns to utility functions
   - Use the `cn` utility for conditional classes

3. **Component Testing**:
   - Test components in different viewport sizes
   - Ensure accessibility with keyboard navigation
   - Check component states (loading, error, success)

4. **Documentation**:
   - Document props and their purpose
   - Provide usage examples
   - Note any important implementation details

## Future Component Roadmap

Planned additions to the component library:

1. **Data Display Components**:
   - Image gallery component
   - Pagination component
   - Card components for photo displays

2. **Input Components**:
   - File upload with preview
   - Advanced form controls
   - Search input with suggestions

3. **Feedback Components**:
   - Toast notifications
   - Progress indicators
   - Loading skeletons 