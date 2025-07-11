# Munich Weekly Frontend Architecture Overview

## Introduction

Munich Weekly is a photography submission and voting platform, built with modern technology stack that provides a responsive user interface supporting multiple devices. This document provides an overview of the frontend architecture.

## Documentation Guide

This document serves as the entry point to the frontend development documentation system, which includes the following related documents:

### Development & Contribution
- [**Contributing Guide**](./contributing.md) - GitHub Flow workflow and development guidelines
- [**Frontend Architecture Details**](./frontend-architecture.md) - Detailed architecture design and technical decisions
- [**UI Component Library**](./ui-components.md) - UI component library specifications and usage guide
- [**Style System**](./style-system.md) - Comprehensive documentation of the style management system
- [**Masonry Layout System**](./masonry-layout-system.md) - Hybrid masonry layout combining backend optimization with frontend responsive positioning

### Security & Authentication
- [**Authentication & Security**](./auth.md) - Complete security implementation including frontend auth
- [**Security Summary**](./security-summary.md) - Executive overview of security posture
- [**Privacy Policy**](./privacy.md) - GDPR compliance and anonymous voting system

### Infrastructure & API
- [**Storage System**](./storage.md) - Image storage architecture and implementation details
- [**Image CDN System**](./image-cdn.md) - Advanced image optimization and delivery architecture
- [**API Reference**](./api.md) - Complete API endpoint documentation
- [**Deployment Guide**](./deployment.md) - Production deployment and configuration

### Project Overview
- [**Main Documentation**](../README.md) - Project overview and quick start guide

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API + Custom Hooks
- **Authentication**: JWT tokens
- **Storage System**: Dual-mode storage (Local & Cloudflare R2)
- **Image Processing**: Cloudflare Worker + Image Resizing
- **API Integration**: Modular API structure organized by business functionality
- **Image Optimization**: Next.js Image component with CDN integration

## Project Structure

The frontend project follows a feature-based and component-based architecture, with clear separation of concerns. Here's the overall project folder structure:

```
frontend/
├── public/                 # Static assets
│   ├── config/             # Configuration files
│   ├── images/             # Image assets
│   │   └── home/           # Home page images
│   └── uploads/            # User uploaded files
├── scripts/                # Utility scripts
├── src/
│   ├── api/                # Modular API directory
│   │   ├── auth/           # Authentication-related APIs
│   │   ├── issues/         # Issue-related APIs
│   │   ├── submissions/    # Submission-related APIs
│   │   ├── users/          # User-related APIs
│   │   └── votes/          # Voting-related APIs
│   ├── app/                # Next.js App Router pages
│   │   ├── account/        # User account section
│   │   │   ├── home-settings/ # Home page settings
│   │   │   ├── manage-issues/ # Issue management
│   │   │   │   ├── create/    # Create new issue
│   │   │   │   └── [id]/edit/ # Edit existing issue
│   │   │   ├── manage-submissions/ # Submission management
│   │   │   ├── settings/     # User settings
│   │   │   ├── submissions/  # User submissions
│   │   │   └── users/        # User management
│   │   ├── admin/          # Admin panel routes
│   │   │   └── submissions/ # Admin submission management
│   │   ├── about/          # About page
│   │   ├── api/            # API routes
│   │   │   ├── admin/      # Admin API routes
│   │   │   │   ├── config/ # Admin config API
│   │   │   │   └── upload/ # Admin upload API
│   │   │   └── config/     # Config API routes
│   │   ├── content/        # Content pages
│   │   ├── debug/          # Development debug tools
│   │   ├── forgot-password/# Password recovery
│   │   ├── gallery/        # Gallery page
│   │   ├── privacy-policy/ # Privacy policy page
│   │   ├── register/       # Registration page
│   │   ├── reset-password/ # Password reset page
│   │   ├── submit/         # Submission page
│   │   ├── test/           # Test pages
│   │   └── vote/           # Voting page
│   ├── components/         # UI components
│   │   ├── admin/          # Admin components
│   │   │   └── submissions/# Admin submission components
│   │   ├── auth/           # Authentication components
│   │   ├── home/           # Home page components
│   │   ├── navigation/     # Navigation components
│   │   ├── submission/     # Submission components
│   │   ├── gallery/        # Gallery components
│   │   ├── ui/             # Core UI components
│   │   └── voting/         # Voting components
│   ├── context/            # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions and constants
│   ├── styles/             # Style management system
│   │   └── components/     # Component-specific styles
│   │       └── navigation/ # Navigation-specific styles
│   ├── theme/              # Theme-related directory
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Additional utilities
```

## Core Features

### 1. Authentication System

- JWT token authentication mechanism
- User registration and login
- Session persistence
- Permission control
- Password reset flow with email verification
- Integration with third-party authentication providers

### 2. User Interface

- Responsive design
- Glassmorphism design elements
- Component-based architecture
- Image optimization techniques
- **Footer Component**: Persistent footer with contact information and navigation links (visible at page bottom)

### 3. Home Page Experience

- **Dynamic Hero Image**: Large, attention-grabbing hero image with interactive hover effects
- **Responsive Interaction**: Desktop users see descriptions on hover, mobile users see them on tap
- **Content Management**: Admin-configurable hero image, description text, and caption through dedicated interface
- **Animation Effects**: Subtle scaling and fade effects create an engaging, modern user experience
- **Contextual Information**: Page introduction section provides key information about the platform's purpose
- **Footer Display**: Contact information and essential links displayed at the bottom of the page

### 4. Content Management

- User profile management
- Work submission system
- Admin approval workflow
- Voting mechanism
- **Issue management system** with full CRUD operations
- Dual-mode image storage (local/cloud)
- **GDPR-compliant submission deletion** with special process for selected photos

#### 4.1. Issue Management System (Admin Only)

A comprehensive issue management interface allows administrators to create, view, and edit weekly photography issues:

**Key Features:**
- **Issue Creation** (`/account/manage-issues/create`): Create new issues with title, description, and time periods
- **Issue Listing** (`/account/manage-issues`): View all issues in a responsive table with quick actions
- **Issue Editing** (`/account/manage-issues/[id]/edit`): Full editing interface for existing issues
- **Time Period Management**: Set and modify submission and voting windows with validation
- **Status Indicators**: Visual feedback for issue states and time periods

**Technical Implementation:**
- Form validation ensuring logical time ordering (submission → voting, start → end)
- Real-time error handling and success feedback
- Responsive design with mobile-optimized layouts
- Integration with backend Issue API endpoints

**Admin Tools:**
- Quick edit buttons in issue lists with modern UI styling
- Direct navigation to submission management for each issue
- Comprehensive form validation with user-friendly error messages

#### 4.2. Public Voting Page (`/vote`)

To enhance user engagement and broaden participation, a new public voting page has been introduced at the `/vote` route. This page allows anonymous users (i.e., users not logged in) to participate in the voting process for active issues.

**Key functionalities of the `/vote` page:**

*   **Active Issue Detection**: The page automatically identifies and displays submissions for the currently active voting issue based on predefined `votingStart` and `votingEnd` dates.
*   **Submission Display**: Submissions for the active issue are presented using a specialized view of the `SubmissionCard` component, optimized for the voting context.
*   **Anonymous Voting**: Users can cast votes without needing to log in. Each anonymous user's vote is tracked via a `visitorId` stored in a cookie, ensuring one vote per submission per user.
*   **Real-time Feedback**: Upon successful voting, the UI updates locally to reflect the vote count increment and button state change without a full page reload, providing a smooth user experience.
*   **Loading and Error States**: The page includes clear loading indicators while fetching data and informative messages for error scenarios or when no issues are currently open for voting.

This feature is supported by:
*   The `VoteButton.tsx` component, which encapsulates voting logic.
*   The `visitorId.ts` utility for managing anonymous user identification.
*   Updates to the `votesApi` client to handle cookie-based `visitorId` transmission.

### 5. Image Processing System

The platform implements an advanced image processing system utilizing Cloudflare Workers and Image Resizing:

- **On-demand Image Optimization** - Images are processed at request time based on usage context
- **Format-aware Delivery** - Automatic detection and delivery of modern formats (WebP, AVIF)
- **Responsive Loading** - Different image sizes are served based on device requirements
- **Performance Optimization** - Only thumbnails are loaded in list views, with high-quality versions loaded on demand
- **CDN Integration** - Efficient global delivery through Cloudflare's edge network

This system is implemented through:

- Cloudflare Worker (`image-worker`) that processes image requests
- **Robust error handling** for deleted or unavailable images with graceful fallbacks
- Frontend utility functions that generate appropriate image URLs with transformation parameters
- Integration with Next.js Image component for client-side optimization
- Specialized viewing components that request high-quality versions only when needed

For complete details, see the [Image CDN System](./image-cdn.md) documentation.

### 6. Advanced Masonry Layout System

Munich Weekly implements a sophisticated JavaScript-based masonry layout system for displaying photo submissions in a Pinterest-style grid. This system provides optimal space utilization and visual appeal through intelligent positioning algorithms.

**Key Features:**
- **Dynamic Column Height Calculation** - Real-time tracking of each column's height for optimal placement
- **Wide Image Spanning** - Images with aspect ratio ≥16:9 automatically span 2 columns
- **Greedy Best-Fit Algorithm** - Intelligent item placement that minimizes gaps by selecting optimal positions
- **Responsive Design** - 2 columns on mobile, 4 columns on desktop with smooth transitions
- **Progressive Loading** - Skeleton screens and progress indicators during image dimension loading

**Technical Implementation:**
- **JavaScript-based Positioning** - Precise pixel-level control unlike CSS Grid or CSS Columns
- **Absolute Positioning** - Each item is positioned with calculated x, y coordinates
- **Batch Image Loading** - Efficient concurrent loading with 24-hour caching
- **Smart Content Height** - Dynamic calculation including text content and metadata areas

**Algorithm Innovation:**
The system uses a Greedy Best-Fit algorithm that dynamically selects items from the remaining pool to fill gaps optimally. Instead of placing items sequentially, it chooses the item that can be positioned at the lowest Y coordinate, resulting in tighter, more visually appealing layouts.

**Components:**
- `MasonryGallery` - Main display component with absolute positioning
- `useMasonryLayout` - Core layout calculation hook
- `useImageDimensions` - Batch image dimension loading with caching
- `MasonrySubmissionCard` - Cards optimized for masonry display with dynamic text sizing

This system is used across multiple pages including the voting interface (`/vote`), user submissions management (`/account/submissions`), and testing environments. For complete technical details, see the [Masonry Layout System](./masonry-layout-system.md) documentation.

### 7. Gallery System

Munich Weekly features a comprehensive gallery system with both featured carousel and issue-based organization:

**Gallery Issue Management:**
- **Issue-based Organization**: Display photography issues with automatic ordering by ID (newest first)
- **Cover Image Management**: Upload and manage cover images for visual appeal with responsive sizing
- **Submission Ordering**: Admin control over submission display order with hero image designation
- **Publication Control**: Draft/published status for controlled content release

**Gallery Issue Display:**
- **Clean Design**: Minimal interface focusing on photographic content presentation
- **Hero Presentation**: Large featured images with optimal responsive sizing and minimal margins
- **Vertical Layout**: Sequential submission display with title and author attribution
- **Full-screen Viewing**: Advanced image viewer with zoom, pan, and touch gesture support

**Admin Management Interface:**
- **Issue Configuration**: Create, edit, and delete gallery issue configurations with visual feedback
- **Cover Upload**: Drag-and-drop cover image management with instant preview and processing
- **Order Management**: Visual drag-and-drop interface for submission ordering with live preview
- **Publication Toggle**: Instant enable/disable of gallery issues with status indicators
- **Bulk Operations**: Manage multiple configurations simultaneously with confirmation dialogs

**Featured Carousel (`/gallery`):**
- **Auto-playing Display** - Smooth transitions with configurable intervals (5-second default)
- **Interactive Navigation** - Arrow buttons and dot indicators for manual navigation
- **Responsive Design** - Optimized layouts for desktop and mobile viewing experiences
- **Full-screen Viewing** - Integrated with enhanced image viewer for detailed inspection

**Gallery Image Viewer:**
- **High-quality Display** - Zoom and pan capabilities for detailed photo inspection
- **Touch Gesture Support** - Double-tap zoom, pinch-to-zoom, and drag navigation on mobile
- **Keyboard Navigation** - ESC to close, arrow keys for next/previous navigation
- **Submission Metadata** - Author information, issue title, and descriptions with elegant styling

**Mobile Optimization:**
- **Direct Interaction** - Tap to open full-screen viewer (bypassing desktop hover states)
- **Touch-friendly Controls** - Larger touch targets and gesture-based navigation
- **Performance Optimized** - Lazy loading and progressive enhancement
- **Responsive Margins** - Desktop margins for visual appeal, mobile edge-to-edge for maximum space utilization

**Technical Architecture:**
- `GalleryIssueCard` component for issue display with hover effects and action buttons
- `GallerySubmissionCard` component with clean image presentation and attribution
- `FeaturedCarousel` component with state management for autoplay and navigation
- `GalleryImageViewer` extending base `ImageViewer` with gallery-specific features
- Integration with Gallery API for fetching featured submissions and issue management
- Responsive interaction patterns adapting to device capabilities

### 8. Enhanced Container System & Layout Optimization

Munich Weekly features a modern, flexible container system optimized for photography presentation and responsive design:

**Enhanced Padding Configuration:**
- **Mobile**: 20px (upgraded from 16px for better content breathing space)
- **Tablet**: 32px (new breakpoint for improved medium screen experience)
- **Desktop**: 40px (upgraded from 20px for professional visual hierarchy)
- **Ultra-wide**: 60px (support for modern ultra-wide displays up to 1800px)

**Container Variants:**
- `default`: Standard responsive container (1400px max-width)
- `narrow`: Focused content layout (1000px max-width) for reading experiences
- `wide`: Photography galleries and submission grids (1600px max-width)
- `ultrawide`: Modern display support (1800px max-width)
- `minimal`: Reduced padding for data-dense interfaces

**Responsive Masonry Configurations:**
- **Vote Page**: Dynamic column width calculation with adaptive margins (px-2 to lg:px-6)
- **Account Pages**: Compact layouts with responsive gaps (8px mobile → 16px desktop)
- **Gallery Views**: Balanced display with smart column distribution (2-4 columns based on device)

**Account Layout Optimization:**
- Sidebar navigation with minimal left margin for professional appearance
- Customized masonry grid preventing image truncation
- Responsive spacing that adapts to content density needs

This system provides consistent, professional layouts across all devices while maintaining optimal space utilization for photography presentation.

### 8. Navigation System

- Responsive navigation
- Mobile sidebar menu
- User-state aware elements

### 10. API Integration System

- Modular API structure
- Grouped by business function (authentication, users, submissions, **issues**, votes, **gallery** ✨ **NEW**)
- Unified error handling
- **Enhanced Issue API**: Full CRUD operations with `getAllIssues()`, `getIssueById()`, `createIssue()`, and `updateIssue()`
- **Gallery API**: Featured submissions management with `getFeaturedSubmissions()`, `getGalleryStats()`, and admin configuration endpoints
- **Batch Vote Optimization**: `checkBatchVoteStatus()` reduces N individual requests to 1 batch request
- **Performance improvements**: 95%+ reduction in vote status API calls
- JWT authentication integration with automatic token management
- Comprehensive error handling with user-friendly messages

### 11. Style Management System

- Centralized style functions
- Type-safe style variants
- Component-specific style modules
- Animation support with tailwindcss-animate
- Theme consistency across components
- Structure for future dark mode support

### 11. Real-time Update System

The platform features an advanced real-time content synchronization system that ensures immediate updates across all interfaces without manual refresh:

**Key Features:**
- **Instant Updates**: Changes to homepage content appear immediately across all browser tabs
- **Cache Management**: Smart cache busting ensures new images load without browser cache issues
- **Cross-tab Sync**: Updates are synchronized across multiple browser tabs automatically
- **Admin Interface**: Real-time preview of uploaded content in admin settings

**Implementation Highlights:**
- **Event-driven Architecture**: Uses custom events for same-tab communication
- **localStorage Events**: Enables cross-tab communication for updates
- **Polling Fallback**: 30-second polling mechanism as backup for event failures
- **Version Parameters**: Image URLs include timestamps for cache busting
- **Smart State Management**: React hooks with proper dependency management to prevent infinite loops

**Components Involved:**
- `useConfigAdmin` hook: Manages configuration state with real-time updates
- Homepage component: Listens for updates and refreshes content automatically
- HeroImage component: Handles cache busting with version parameters
- Admin settings page: Provides real-time preview and triggers system-wide updates

This system provides a seamless content management experience where administrators see changes instantly, and all users receive updates without manual intervention.

## Implemented Components

### Navigation Components
- MainNav (desktop navigation)
- MobileNav (mobile menu)
- Logo

### Authentication Components
- LoginForm: Modal-based authentication form with email/password fields and glassmorphism effect
- RegisterForm: User registration interface with form validation

### Layout Components
- Container
- AccountLayout

### Base UI Components
- Modal: Glassmorphism-style modal dialog with customizable overlay variants (default, dark, light)
- Link
- Thumbnail
- Pagination
- Button: Consistent button styling with multiple variants (primary, secondary, ghost)

### Submission Related Components
- SubmissionCard
- ImageGrid
- ImageViewer
- SubmissionForm: Form for adding descriptions to photo submissions
- ImageUploader: Component for uploading and previewing submission photos

### Admin Components
- SubmissionTable
- IssueSelector
- LoadingErrorStates
- DebugTools

### Issue Management Components
- ManageIssuesPage: Admin interface for viewing and managing all issues
- CreateIssuePage: Form interface for creating new issues with submission and voting periods

## Custom Hooks

### Authentication Hooks
- `useAuth`: Provided by AuthContext, manages user authentication state, permission checking and related operations

### Data Management Hooks
- `useSubmissions`: Manages submission data and operations

### Development Tools Hooks
- `useDebugTools`: Provides debugging and development tools

## Feature Implementation

### Authentication System
The application uses a modal-based authentication approach rather than dedicated pages. This design choice provides:
- Seamless user experience with uninterrupted browsing context
- Consistent visual presentation across the application
- Reduced page transitions and navigation complexity

The authentication flow:
1. User attempts to access restricted content (e.g., submission page)
2. System detects unauthenticated status and displays a prompt modal
3. User clicks to proceed to the login modal
4. After successful authentication, user continues with the original task without page reload

### Photo Submission Flow
The submission system follows a structured three-step process:
1. **Issue Selection**: User selects the active issue to submit to
2. **Photo Upload**: 
   - Drag-and-drop or file selection interface with preview
   - Supports JPEG and PNG formats up to 20MB
   - Includes guidance for multiple submissions (maximum 4 photos per issue)
   - Real-time validation and upload progress tracking
3. **Description Entry**: Text form for providing context about the submission

This workflow provides:
- Clear guidance through a potentially complex process
- Organized data collection with appropriate validation at each step
- Visual feedback on progress and completion status
- Consistent guidelines regarding submission limitations

### Admin Review System
For content moderation, the admin interface provides:
- Tabular view of all submissions with filtering options
- Quick-review capabilities for approving or rejecting content
- Batch operations for efficient management

## API Module Structure

The frontend API adopts a modular structure, grouped by business function to improve code maintainability and extensibility:

- **auth**: Authentication-related APIs, including registration, login, and third-party authentication
- **users**: User-related APIs, including retrieving user information and updating user profiles
- **issues**: Issue-related APIs, including retrieving issue lists, creating new issues, and getting issue details
- **submissions**: Submission-related APIs, including creating, reviewing, and managing submissions
- **votes**: Voting-related APIs, including submitting votes and checking vote status

API module usage:

```typescript
// Import needed API modules
import { authApi, submissionsApi, issuesApi } from "@/api";

// Using authentication API
const handleLogin = async () => {
  const response = await authApi.loginWithEmail({
    email: "user@example.com",
    password: "password123"
  });
};

// Using submissions API
const loadSubmissions = async () => {
  const submissions = await submissionsApi.getUserSubmissions();
};

// Using issues API
const createNewIssue = async () => {
  const issue = await issuesApi.createIssue({
    title: "Weekly Issue Title",
    description: "This week's theme description",
    submissionStart: "2023-06-01T00:00:00Z",
    submissionEnd: "2023-06-07T23:59:59Z",
    votingStart: "2023-06-08T00:00:00Z",
    votingEnd: "2023-06-14T23:59:59Z"
  });
};
```

## Development Process

1. Understand the project architecture and component structure
2. Use the existing component library to build new features
3. Ensure code passes TypeScript type checking
4. Maintain good code comments and documentation
5. Follow modular API structure for API calls

