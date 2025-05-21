# Munich Weekly Frontend Architecture Overview

## Introduction

Munich Weekly is a photography submission and voting platform, built with modern technology stack that provides a responsive user interface supporting multiple devices. This document provides an overview of the frontend architecture.

## Documentation Guide

This document serves as the entry point to the frontend development documentation system, which includes the following related documents:

- [**Frontend Architecture Details**](./frontend-architecture.md) - Detailed architecture design and technical decisions
- [**UI Component Library**](./ui-components.md) - UI component library specifications and usage guide
- [**Style System**](./style-system.md) - Comprehensive documentation of the style management system
- [**Development Guide**](./dev-guide.md) - Frontend development processes and best practices
- [**Storage System**](./storage.md) - Image storage architecture and implementation details
- [**Image CDN System**](./image-cdn.md) - Advanced image optimization and delivery architecture

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
│   │   │   │   └── create/    # Create new issue
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
- Issue management system
- Dual-mode image storage (local/cloud)

#### 4.1. Public Voting Page (`/vote`)

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
- Frontend utility functions that generate appropriate image URLs with transformation parameters
- Integration with Next.js Image component for client-side optimization
- Specialized viewing components that request high-quality versions only when needed

For complete details, see the [Image CDN System](./image-cdn.md) documentation.

### 6. Navigation System

- Responsive navigation
- Mobile sidebar menu
- User-state aware elements

### 7. API Integration System

- Modular API structure
- Grouped by business function (authentication, users, submissions, issues, votes)
- Unified error handling
- TypeScript type safety

### 8. Style Management System

- Centralized style functions
- Type-safe style variants
- Component-specific style modules
- Animation support with tailwindcss-animate
- Theme consistency across components
- Structure for future dark mode support

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
2. Follow the code standards in the [development guide](./dev-guide.md)
3. Use the existing component library to build new features
4. Ensure code passes TypeScript type checking
5. Maintain good code comments and documentation
6. Follow modular API structure for API calls

## Roadmap

Planned feature enhancements:

1. Image submission interface improvements
2. Weekly journal gallery view
3. Voting system refinements
4. User notification system
5. Multilingual support (English/Chinese)
6. Dark mode
7. Batch submission management tools
8. Advanced issue management features

## Contribution Guidelines

1. Follow code standards and development best practices
2. Reuse existing components to ensure UI consistency
3. Ensure responsive design adapts to various devices
4. Write appropriate unit tests
5. Update relevant documentation
6. Use modular API structure for API integration