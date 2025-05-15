# Munich Weekly UI Component Library

## Overview

The Munich Weekly UI component library provides a unified set of reusable UI components for building the frontend interface. These components follow a consistent design language to ensure user experience consistency and development efficiency.

## Design Principles

1. **Consistency**: Components maintain consistent styles, behaviors, and interaction patterns
2. **Responsiveness**: All components adapt to different screen sizes
3. **Accessibility**: Components follow WCAG accessibility guidelines
4. **Reusability**: Components are designed to be reused throughout the application
5. **Modularity**: Each component has a single responsibility

## Component Directory

### Navigation Components

#### MainNav

The main navigation component for desktop and tablet views.

**Features**:
- Responsive layout
- User authentication status integration
- User dropdown menu
- Login/Register button
- Use Thumbnail component to display user avatar

#### MobileNav

The mobile navigation component for small screen devices.

**Features**:
- Hamburger menu toggle
- Slide-in menu panel
- User information display
- Navigation links
- Prevent background scrolling

#### Logo

The application Logo component, supporting different sizes.

**Attributes**:
- `size`: "sm" | "md" | "lg"
- `className`: Additional CSS class

### Authentication Components

#### LoginForm

The login modal form with glass effect.

**Features**:
- Email and password input fields
- Remember me option
- Forgot password link
- Error message
- Success message
- Loading state

#### RegisterForm

The registration modal form with glass effect.

**Features**:
- Email, nickname, and password fields
- Password confirmation
- Form validation
- Error message
- Success message
- Loading state

### Basic UI Components

#### Modal

The reusable glass effect modal component.

**Features**:
- Background blur effect
- Centered content
- Close button
- Keyboard accessibility (ESC to close)
- Prevent background scrolling
- Smooth transition animation

**Attributes**:
- `isOpen`: Boolean value to control modal visibility
- `onClose`: Function to call when closing the modal
- `children`: React nodes to render inside the modal
- `className`: Additional CSS class for the modal container

#### Container

The responsive container component with consistent padding.

**Features**:
- Responsive width
- Consistent horizontal padding
- Optional component type

**Attributes**:
- `children`: React nodes to render inside the container
- `as`: HTML element or component to render (default: "div")
- `className`: Additional CSS class

#### Link

The standard link component integrated with Next.js Link component.

**Features**:
- Consistent style
- Support external links
- Different style variants
- TypeScript type safety

**Attributes**:
- `href`: Navigation target URL
- `children`: React nodes inside the link
- `className`: Additional CSS class
- `variant`: "default" | "nav" | "button" - Link style variant
- `external`: Boolean value indicating whether the link should open in a new tab

#### Thumbnail

The flexible image thumbnail component based on Next.js Image.

**Features**:
- Optimize image through Next.js Image
- Multiple aspect ratio options
- Support rounded corners
- Customizable object adaptation
- Load priority control

**Attributes**:
- `src`: Image source URL
- `alt`: Accessible alternative text
- `width`: Image width (default: 64)
- `height`: Image height (default: 64)
- `fill`: Boolean value to enable fill mode
- `objectFit`: Object adaptation method
- `rounded`: Boolean value to enable rounded corners
- `aspectRatio`: Aspect ratio setting

#### Pagination

The flexible pagination component for multi-page content navigation.

**Features**:
- Dynamic page number generation
- Current page indicator
- Previous and next page navigation
- Home and end page shortcuts

**Attributes**:
- `currentPage`: Current active page
- `totalPages`: Total number of pages
- `onPageChange`: Function to call when selecting a page
- `className`: Additional CSS class

### Submission Components

#### SubmissionCard

The card component for displaying a single photo submission.

**Features**:
- Use Thumbnail component to display submission image
- Use color-coded badge to display submission status
- Display submission date and journal information
- Display the number of approved or selected submissions
- Support clicking to view full-size image
- Use special badge to mark cover submission

#### ImageGrid

The responsive grid layout for displaying multiple images/submissions.

**Features**:
- Based on configurable column count for screen size
- Customizable project spacing
- Support different aspect ratios
- Hover effect to display image information
- Click to open full-size image view

#### ImageViewer

The modal component for viewing full-size images with description.

**Features**:
- Full-screen image display
- Image description display
- Click outside area to close
- Keyboard support (ESC to close)
- Prevent background scrolling

### Management Components

#### SubmissionTable

The table component for managing submissions.

**Features**:
- Table view of submission key information
- Color-coded status indicator
- Clickable preview thumbnail
- Approve, reject, or select submission operation buttons
- Operation loading state

#### IssueSelector

The selector component for selecting a journal to view submissions.

**Attributes**:
- `issues`: Journal object array
- `selectedIssue`: Current selected journal
- `onIssueChange`: Callback when journal selection changes

#### LoadingErrorStates

The component for displaying loading and error states in the management interface.

**Components**:
- `LoadingState`: Display loading animation and message
- `ErrorState`: Display error message and retry option

### Account Components

#### AccountLayout

The responsive layout component for user account pages with sidebar navigation.

**Features**:
- Responsive layout with sidebar and main content area
- User information display
- Account navigation links
- Logout button
- Authentication check with redirection

## Style System

UI components use Tailwind CSS for styling, following a consistent pattern:

### Color System

- **Primary Color**: Blue (`blue-500`, `blue-600`)
- **Gray Scale**: Used for text and background
- **Success**: Green (`green-500`)
- **Error**: Red (`red-400`, `red-500`)
- **White/Black**: Used for contrast and background

### Typography

- **Title**: Various sizes with consistent font weight
- **Body Text**: Regular and medium font weight at appropriate size
- **Form Label**: Small and medium font weight text

### Spacing

Using Tailwind spacing system:
- Small spacing: 2, 3, 4 (0.5rem, 0.75rem, 1rem)
- Medium spacing: 6, 8, 10 (1.5rem, 2rem, 2.5rem)
- Large spacing: 12, 16, 20 (3rem, 4rem, 5rem)

## Responsive Mode

The component library implements several responsive modes:

1. **Container Query**: Main container adapts to viewport width
2. **Elastic/Grid Layout**: Flexible layout based on available space
3. **Component Visibility**: Display/hide components based on breakpoints
4. **Adaptive Spacing**: Spacing scales with viewport size

Breakpoints follow Tailwind's default system:
- `sm`: 640px and above
- `md`: 768px and above
- `lg`: 1024px and above
- `xl`: 1280px and above

## Utility Functions

### `cn`

The utility function for combining conditional class names using `clsx` and `tailwind-merge`.

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

## Custom Hooks

### Authentication Hooks

#### `useAuth`

The Hook for managing user authentication status and operations using React Context.

**Features**:
- User authentication status management
- JWT token handling and storage
- User personal information access
- Login and logout operations
- Loading state management

### Data Management Hooks

#### `useSubmissions`

The Hook for managing submission data.

**Features**:
- Fetch journals and submissions from API
- Manage loading and error states
- Handle submission operations (approve/reject/select)
- Support simulated data for development and testing
- Manage submission detail view state

### Development Tool Hooks

#### `useDebugTools`

The Hook for providing debugging tools.

**Features**:
- Authentication status check
- API connection test
- Simulated data switch
- Debugging information display

## Component Development Guide

Best practices when extending the component library:

1. **Component Structure**:
   - Define clear interface for props
   - Use TypeScript for type safety
   - Include JSDoc comments for functionality

2. **Style Method**:
   - Use Tailwind classes directly in components
   - Extract common patterns to utility functions
   - Use `cn` utility for conditional class processing

3. **Component Testing**:
   - Test components at different viewport sizes
   - Ensure keyboard navigation accessibility
   - Check component states (loading, error, success)

4. **Documentation**:
   - Record props and their usage
   - Provide usage examples
   - Note any important implementation details