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
│   ├── form.ts          # Form component styles
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

## Component Styling Approach

The application employs a systematic approach to styling components:

1. **Image Optimization**
   - Next.js Image component with proper configuration
   - Configured `remotePatterns` for secure image loading
   - Standardized aspect ratios and loading behaviors

2. **Authentication UI**
   - Glassmorphism effect for modern, depth-rich interfaces
   - Semi-transparent backgrounds with backdrop blur
   - Sequential animation effects for form elements
   - Consistent text contrast on various backgrounds

3. **Navigation Components**
   - Responsive navigation system with desktop and mobile variants
   - Centralized styling functions for consistency
   - Context-aware navigation elements (showing different options based on auth state)

4. **Modal System**
   - Overlay variant system with appropriate opacity levels:
     - `default`: Light overlay (20% opacity) for standard interactions
     - `dark`: Higher contrast overlay (50% opacity) for critical actions
     - `light`: White-based overlay (70% opacity) for light-themed content
   - Content variants supporting different visual styles
   - Consistent visual hierarchy between related modals
   - Shadow effects that enhance depth perception

5. **Button System**
   - Standardized variants across the application:
     - `primary`: High-emphasis actions
     - `secondary`: Alternative or secondary actions
     - `ghost`: Low-emphasis or subtle interactions
   - Consistent shadow effects and visual styling
   - Strong TypeScript typing with proper variant definitions

6. **Component Optimizations**
   - Clean dependency management in components
   - Responsive text sizing that prevents unwanted wrapping
   - Loading and error states for asynchronous operations

7. **Form System**
   - Standardized form container styles with multiple variants
   - Consistent form field styling with state variations
   - Type-safe style functions for all form elements
   - Unified error message presentation

## Core UI Components

### Layout Components

- **Container**: A responsive container with consistent padding and maximum width
- **Modal**: A flexible modal dialog with glassmorphism styling and backdrop blur
- **AnimatedFooter**: A page footer component displaying contact information and navigation links at the bottom of the page

#### Enhanced Container System

The `Container` component implements Munich Weekly's flexible layout system with multiple variants optimized for different content types:

**Container Variants:**
```tsx
<Container variant="default" spacing="standard">     // Standard layout (1400px max)
<Container variant="narrow" spacing="standard">      // Reading-focused (1000px max)
<Container variant="wide" spacing="generous">        // Gallery layout (1600px max)
<Container variant="ultrawide" spacing="generous">   // Ultra-wide displays (1800px max)
<Container variant="fluid" spacing="minimal">        // Full-width layout
<Container variant="minimal" spacing="compact">      // Data-dense interfaces
```

**Responsive Spacing Options:**
- `compact`: Tight spacing for mobile-optimized content
- `standard`: Balanced spacing for general content
- `generous`: Spacious layout for visual content
- `minimal`: Reduced padding for maximum content area

**Padding Configuration:**
- **Mobile**: 20px (px-5) - Enhanced from previous 16px
- **Tablet**: 32px (px-8) - New breakpoint support  
- **Desktop**: 40px (px-10) - Professional spacing upgrade
- **Ultra-wide**: 60px (px-15) - Modern display support

**Usage Examples:**
```tsx
// Vote page with large image display
<Container variant="ultrawide" spacing="generous">

// Account sidebar layout with minimal margins
<Container spacing="minimal">

// Privacy policy with reading-focused layout
<Container variant="narrow" spacing="standard">
```

### Navigation Components

- **MainNav**: Desktop navigation component with consistent styling
- **MobileNav**: Mobile navigation component with responsive design
- **Header/MainHeader**: Header components with standardized styling

### Form Components

- **Button**: Styled button with variants (primary, secondary, outline, etc.)
- **Input**: Form input components with consistent styling
- **SubmissionForm**: Reusable form component for photo submissions with description field, validation, and submission handling

### Media Components

- **Thumbnail**: Advanced image thumbnail component with intelligent aspect ratio control and responsive positioning
- **ImageViewer**: Modal-based full-size image viewing component
- **ImageUploader**: 
  - Interactive file upload component with drag-and-drop support
  - Preview functionality for selected images
  - Format restrictions (JPEG and PNG only)
  - File size limit of 20MB per upload
  - Helpful guidance for multiple submissions (max 4 per issue)
  - Progress tracking during upload process
  - Error handling with user-friendly messages
  - Built on reusable useFileUpload hook for file handling logic

#### Advanced Thumbnail Display System

The `Thumbnail` component implements a sophisticated image display system optimized for different aspect ratios and device contexts:

**Intelligent Object Fit Strategy:**
- **Landscape Images (16:9, 4:3, 5:4)**: Prioritize complete image display using `object-fit: contain`
- **Portrait Images (3:4, 9:16)**: Use `object-fit: cover` to prevent horizontal letterboxing
- **Square Images**: Adaptive behavior based on container compatibility

**Responsive Positioning Logic:**
- **Desktop (≥768px)**:
  - 16:9 images: Center-aligned for optimal visual balance
  - Other landscape ratios (4:3, 5:4, etc.): Top-aligned to eliminate upper whitespace
- **Mobile (<768px)**: All landscape images center-aligned for consistent experience

**Aspect Ratio Detection:**
- Automatic detection with precision tolerances:
  - 16:9 detection: ±0.08 tolerance for accurate classification
  - Other ratios: ±0.1 standard tolerance
- Fallback classification system for non-standard ratios
- Real-time responsive behavior adaptation

**Key Features:**
- Type-safe object position variants (top, center, bottom, etc.)
- Automatic aspect ratio detection and classification
- Responsive screen size detection with window resize handling
- Enhanced debugging capabilities with detailed parameter logging
- Graceful fallback mechanisms for invalid configurations

### Masonry Layout Components

Munich Weekly implements a hybrid masonry layout system with **progressive loading optimization** that combines backend optimization with frontend responsive positioning:

- **MasonryGallery**: Main display component implementing hybrid masonry layout with **progressive loading**
  - Backend-provided optimal ordering for quality guarantee
  - Frontend Skyline positioning for responsive coordinate calculation  
  - **Progressive display**: Content shows after 6 images (40% threshold) for 60-75% faster mobile loading
  - Dynamic column height tracking with absolute positioning
  - Responsive design: 2 columns mobile, 4 columns desktop
  - **Enhanced loading states** with opacity transitions and progress indicators
  - Error handling and retry mechanisms
  - Wide image automatic spanning (≥16:9 aspect ratio)

- **MasonrySubmissionCard**: Specialized submission card optimized for masonry display with **progressive loading support**
  - Dynamic text sizing based on image width (wide images get larger fonts)
  - Intelligent line clamping: 3 lines for wide images, 2 for regular
  - Responsive content height calculation including text length analysis
  - Context-aware display modes (default, vote view, previous results)
  - **Progressive loading visual effects**: Loading overlays and smooth opacity transitions
  - Hover effects and interactive states
  - Integrated with voting system and image viewer

**Key Features:**
- **Hybrid Architecture**: Backend quality + Frontend performance + Progressive loading
- **Progressive Loading**: 60-75% faster perceived loading on mobile devices
- **Wide Image Detection**: Automatic identification and spanning of landscape images
- **Dynamic Content Height**: Smart calculation including text content and metadata
- **Optimized Batch Loading**: 4 concurrent images for mobile networks (reduced from 6)
- **Smart Thresholds**: 6 images or 40% of content, whichever is smaller
- **Visual Feedback**: Loading spinners, progress bars, and opacity transitions

**Usage Example:**
```tsx
<MasonryGallery
  issueId={issueId}                    // Required for backend ordering
  items={submissions}
  getImageUrl={(submission) => submission.imageUrl}
  renderItem={(submission, isWide, aspectRatio, isLoaded) => ( // ✨ NEW: isLoaded param
    <MasonrySubmissionCard
      submission={submission}
      isWide={isWide}
      aspectRatio={aspectRatio}
      isImageLoaded={isLoaded}         // ✨ NEW: Progressive loading state
      displayContext="voteView"
    />
  )}
/>
```

**Progressive Loading Benefits:**
- **Mobile Performance**: 2-4 seconds first content display (down from 8-10+ seconds)
- **User Experience**: Immediate visual feedback instead of blank screens
- **Network Optimization**: Adaptive batch sizes for different connection speeds
- **Backward Compatibility**: All existing functionality preserved

For complete technical details, see the [Masonry Layout System](./masonry-layout-system.md) documentation.

### Content Components

- **Badge**: Label/tag component for metadata
- **Card**: Content card component for consistent layout. See `SubmissionCard` for a specific implementation.
- **IssueSelector**: Reusable component for selecting issues with detailed information display
- **LoadingErrorStates**: Unified component for handling loading, error, and empty states with consistent styling

#### `SubmissionCard.tsx`
Displays individual submission details, including image, description, author, status, and vote count.
*   **Location**: `frontend/src/components/submission/SubmissionCard.tsx`
*   **Key Features**:
    *   Integrates `ImageViewer` for full-size image previews.
    *   Uses `StatusBadge` to show submission status.
    *   **`displayContext` Prop**: Supports different rendering contexts.
        *   `default`: Standard view for general browsing.
        *   `voteView`: A specialized view for the public voting page (`/vote`).
            *   Conditionally renders the status badge (e.g., only for 'selected' or 'cover').
            *   Hides submission date and issue ID.
            *   Integrates the `VoteButton` component, passing the `onVoteSuccess` callback to enable voting functionality and UI updates.
            *   Displays vote counts with interactive voting functionality.
        *   `previousResults`: A read-only view for displaying historical voting results.
            *   Shows vote counts in a centered, read-only format without voting buttons.
            *   Conditionally renders status badges (only for 'selected' or 'cover' items).
            *   Maintains visual consistency with voting view while clearly indicating non-interactive state.

### Voting Components

#### `VoteButton.tsx`

The `VoteButton` is a client-side component responsible for handling the user interaction for voting on a submission.

**Location**: `frontend/src/components/voting/VoteButton.tsx`

**Key Features**:

*   **Props**:
    *   `submissionId: number`: The ID of the submission to vote for.
    *   `initialVoteCount?: number`: Optional, for display purposes.
    *   `onVoteSuccess?: (submissionId: number) => void`: Callback function executed upon a successful vote.
    *   `className?: string`: Optional CSS classes.
*   **State Management**:
    *   Manages `isLoading`, `hasVoted`, and `error` states internally.
    *   On mount, it ensures a `visitorId` cookie is present (generating one if not) using `getOrGenerateVisitorId()` from `lib/visitorId.ts`.
    *   It then calls `votesApi.checkVoteStatus()` to determine if the current user (identified by `visitorId`) has already voted for the given submission.
*   **Voting Logic**:
    *   `handleVoteClick` calls `votesApi.submitVote()`. The `visitorId` is sent implicitly via cookie.
    *   It prevents click event propagation to avoid unintended parent element interactions.
    *   Upon successful vote submission, it updates its internal `hasVoted` state and calls the `onVoteSuccess` callback.
*   **UI**:
    *   Renders a `<Button>` from the core UI library.
    *   Displays different text and icons (from `lucide-react`) based on its state:
        *   **Default/Ready to Vote**: "Vote" text with a thumbs-up icon, styled as a `primary` button, size `md`.
        *   **Loading (initial status check)**: "Loading..." text with a spinner.
        *   **Loading (during vote submission)**: "Voting..." text with a spinner.
        *   **Voted**: "Voted" text with a green checkmark icon, styled as a `ghost` button.
    *   Handles error display gracefully.

### Gallery Components ✨ **NEW** (`/components/gallery`)

Munich Weekly's featured submissions carousel system for showcasing curated photography:

#### `FeaturedCarousel.tsx`

The main carousel component for displaying featured submissions with auto-play and interactive navigation:

**Location**: `frontend/src/components/gallery/FeaturedCarousel.tsx`

**Key Features:**
- **Auto-playing Display**: 5-second interval with smooth fade transitions
- **Interactive Navigation**: Arrow buttons and dot indicators for manual control
- **Responsive Design**: Mobile-optimized layouts with appropriate touch targets
- **State Management**: Centralized state for current slide, autoplay, and user interactions

**Props:**
- `submissions: FeaturedSubmission[]`: Array of featured submissions to display
- `autoplayInterval?: number`: Configurable autoplay duration (default: 5000ms)
- `className?: string`: Additional CSS classes for customization

**Responsive Behavior:**
- **Desktop**: Hover effects reveal author information and descriptions
- **Mobile**: Direct tap interaction opens full-screen gallery viewer
- **Touch Navigation**: Swipe gestures for slide navigation (future enhancement)

**Technical Implementation:**
- Uses `useMediaQuery` hook for responsive behavior detection
- Integration with `GalleryImageViewer` for full-screen viewing
- Automatic pause on user interaction with smart resume logic
- Keyboard navigation support (arrow keys, ESC)

#### `GalleryImageViewer.tsx`

Enhanced full-screen image viewer specifically designed for gallery submissions:

**Location**: `frontend/src/components/gallery/GalleryImageViewer.tsx`

**Key Features:**
- **High-quality Display**: Zoom and pan capabilities with smooth interactions
- **Touch Gesture Support**: Double-tap zoom, pinch-to-zoom, drag navigation
- **Submission Metadata**: Author information, issue title, and description display
- **Navigation Controls**: Next/previous buttons and keyboard support

**Props:**
- `submission: FeaturedSubmission`: Current submission data
- `submissions: FeaturedSubmission[]`: Full array for navigation
- `isOpen: boolean`: Visibility state
- `onClose: () => void`: Close handler
- `onNavigate?: (direction: 'prev' | 'next') => void`: Navigation handler

**Information Display:**
- **Author**: "Photo by [nickname]" with elegant typography
- **Issue Title**: Contest or weekly issue identification
- **Description**: Quoted description with italic styling for artistic presentation
- **Clean Design**: Simplified metadata focusing on core submission information

**Mobile Optimization:**
- **Touch-friendly Controls**: Large touch targets for navigation
- **Gesture Recognition**: Zoom, pan, and navigation gestures
- **Performance**: Lazy loading and optimized image rendering

### Voting Components (`/components/voting`)

- **`VoteCard`**: Displays a submission with voting actions.
- **`VoteImage`**: Renders the image within a `VoteCard`, handling aspect ratio and loading states.
- **`VoteInstructions`**: Provides guidance to users on the voting process.

### Promotion Components (`/components/promotion`)

- **`PromotionPageContent`**: (Public) Renders the entire content of a promotion page, including title, description, and a gallery of images.
- **`PromotionConfigSelector`**: (Admin) A dropdown component allowing admins to browse, select, create, and delete different promotion configurations.
- **`PromotionConfigForm`**: (Admin) A form for creating or updating a promotion's settings, such as its title, URL, and description.
- **`PromotionImageManager`**: (Admin) A comprehensive tool for uploading, ordering, and deleting images associated with a promotion.

### Generic UI Components (`/components/ui`)

This directory contains generic, reusable components that form the building blocks of the user interface. They are designed to be application-agnostic and are used extensively across the platform.

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

## Static Content Pages

### About Page

The About page provides comprehensive information about the Munich Weekly platform:

- **Location**: `/app/about/page.tsx`
- **Key Sections**:
  - Project Overview: Description of the platform's purpose and operational workflow
  - Independent Development: Technical development information
  - Selection Process: Explanation of how photos are selected for publication
  - Privacy Policy: Link to detailed privacy policy
  - Ongoing Development: Information about platform's development status
- **Features**:
  - Responsive layout with clear section hierarchy
  - Visual elements including logo and branded styling
  - WeChat Official Account information (`【慕尼黑学联CSSA】`) for cross-platform availability
  - External links to GitHub repository and privacy policy
  - Consistent typography with the rest of the platform