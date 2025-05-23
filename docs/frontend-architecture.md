# Munich Weekly - Frontend Architecture

## Overview

Munich Weekly is a photography-based weekly publication platform where users can submit, view, and vote on photographs. The frontend is built with a modern tech stack, featuring a responsive design that works across all devices.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: JWT-based authentication with secure HTTP-only cookies
- **State Management**: React Context API + Custom Hooks
- **Icons**: Font Awesome
- **UI Components**: Custom components with glassmorphism effects

## Core Components Structure

The frontend is organized into a component-based architecture following the Next.js App Router pattern. Below is the actual project structure:

```
frontend/
├── public/                 # Static assets
│   ├── favicon.png         # Site favicon
│   ├── logo.svg            # Brand logo
│   ├── globe.svg           # UI icons
│   ├── file.svg            # UI icons
│   ├── next.svg            # Next.js logo
│   ├── vercel.svg          # Vercel logo
│   └── window.svg          # UI icons
├── scripts/                # Utility scripts
│   ├── convert-favicon.js  # Favicon conversion tool
│   └── generate-favicon.js # Favicon generation script
├── src/
│   ├── api/                # Modular API directory
│   │   ├── auth/           # Authentication-related APIs
│   │   │   └── index.ts    # Authentication API exports
│   │   ├── issues/         # Issue-related APIs
│   │   │   └── index.ts    # Issue API exports
│   │   ├── submissions/    # Submission-related APIs
│   │   │   └── index.ts    # Submission API exports
│   │   ├── users/          # User-related APIs
│   │   │   └── index.ts    # User API exports
│   │   ├── votes/          # Voting-related APIs
│   │   │   └── index.ts    # Voting API exports
│   │   ├── http.ts         # Base HTTP request utilities
│   │   ├── types.ts        # API-related type definitions
│   │   └── index.ts        # Unified API exports
│   ├── app/                # Next.js App Router pages
│   │   ├── account/        # User account section
│   │   │   ├── layout.tsx  # Account layout with sidebar
│   │   │   ├── page.tsx    # Main account page
│   │   │   ├── settings/   # User settings
│   │   │   ├── submissions/# User submissions management
│   │   │   └── manage-submissions/ # Submission management
│   │   ├── admin/          # Admin panel routes
│   │   │   └── submissions/# Admin submission management
│   │   ├── content/        # Content pages
│   │   ├── login/          # Login page
│   │   ├── register/       # Registration page
│   │   ├── submit/         # Photo submission page
│   │   ├── vote/           # Public voting page
│   │   ├── test/           # Test pages
│   │   ├── globals.css     # Global CSS
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Homepage
│   ├── components/         # UI components
│   │   ├── admin/          # Admin components
│   │   │   └── submissions/# Admin submission components
│   │   │       ├── DebugTools.tsx     # Development debugging
│   │   │       ├── SubmissionTable.tsx # Submission table
│   │   ├── auth/           # Authentication components
│   │   │   ├── LoginForm.tsx   # Login form
│   │   │   └── RegisterForm.tsx # Registration form
│   │   ├── navigation/     # Navigation components
│   │   │   ├── MainNav.tsx     # Desktop navigation
│   │   │   └── MobileNav.tsx   # Mobile navigation
│   │   ├── submission/     # Submission components
│   │   │   ├── ImageGrid.tsx   # Grid layout for images
│   │   │   ├── ImageViewer.tsx # Image viewing modal
│   │   │   └── SubmissionCard.tsx # Submission card
│   │   ├── voting/         # Voting components
│   │   │   └── VoteButton.tsx  # Interactive voting button
│   │   ├── ui/             # Core UI components
│   │   │   ├── Button.tsx      # Button component
│   │   │   ├── Container.tsx   # Container layout
│   │   │   ├── ImageUploader.tsx # Image upload component
│   │   │   ├── IssueSelector.tsx # Issue selection component
│   │   │   ├── Link.tsx        # Link component
│   │   │   ├── LoadingErrorStates.tsx # Loading/error handling
│   │   │   ├── Logo.tsx        # Logo component
│   │   │   ├── Modal.tsx       # Modal dialog
│   │   │   ├── Pagination.tsx  # Pagination component
│   │   │   ├── SubmissionForm.tsx # Submission form
│   │   │   └── Thumbnail.tsx   # Image thumbnail
│   │   ├── Header.tsx      # Main header component
│   │   └── MainHeader.tsx  # Alternative header
│   ├── context/            # React Context providers
│   │   └── AuthContext.tsx # Authentication context
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts      # Authentication hook
│   │   ├── useDebugTools.ts # Development debugging hook
│   │   ├── useFileUpload.ts # File upload hook
│   │   ├── useIssues.ts    # Issues data hook
│   │   └── useSubmissions.ts # Submissions data hook
│   ├── lib/                # Utility functions and constants
│   │   ├── constants.ts    # Application constants
│   │   └── utils.ts        # Utility helper functions
│   ├── styles/             # Style management system
│   │   ├── components/     # Component-specific styles
│   │   │   ├── form.ts     # Form component styles
│   │   │   └── ...         # Other component styles
│   │   ├── index.ts        # Style exports
│   │   ├── theme.ts        # Theme configuration
│   │   └── variants.ts     # Style variants
│   ├── theme/              # Theme-related directory (reserved)
│   ├── types/              # TypeScript type definitions
│   │   └── submission.ts   # Submission-related types
│   └── utils/              # Additional utilities
│       └── mockData.ts     # Mock data for development
```

## Key Features

### Authentication System

A complete JWT-based authentication system is implemented with:

- **User Registration**: Email-based registration with password validation
- **User Login**: Secure login with JWT token storage
- **Password Reset**: Complete password recovery flow with email verification via Mailjet
- **Session Management**: Persistent sessions using localStorage
- **Logout Functionality**: Complete session termination

Authentication components:
- `LoginForm`: A modal-based login form with email/password fields and "Forgot password?" link
- `RegisterForm`: A modal-based registration form with validation
- `ForgotPasswordPage`: Standalone page for initiating password reset
- `ResetPasswordPage`: Token-secured page for setting a new password
- `AuthContext`: React Context for managing authentication state and user data
- `useAuth`: Custom hook for accessing authentication functionality

### Navigation System

A responsive navigation system that adjusts for different screen sizes:

- **MainNav**: Desktop navigation with user account dropdown
- **MobileNav**: Mobile-friendly navigation with sliding menu
- **Logo**: Customizable logo component
- **Header/MainHeader**: Alternative header implementations

### User Account Management

A user account management system with sidebar navigation:

- **Account Layout**: Sidebar navigation with main content area
- **Profile Management**: User profile viewing and editing
- **Submissions Management**: Interface for user photo submissions
- **Account Settings**: Security settings and password management

### Content Management

Components for managing submission content:

- **SubmissionCard**: Displays individual submissions with metadata
- **ImageGrid**: Grid layout for displaying multiple submissions
- **ImageViewer**: Modal for viewing full-size images
- **SubmissionTable**: Admin interface for managing submissions
- **IssueSelector**: Reusable component for selecting publication issues

### Voting System

A comprehensive anonymous voting system for public engagement:

- **VotePage**: Public voting interface with current and historical result viewing
- **VoteButton**: Interactive voting component with real-time feedback
- **Anonymous Voting**: Cookie-based visitor identification for anonymous participation
- **Previous Results Access**: Graceful fallback to historical voting results when no current voting period is active
- **State Management**: Smart view switching between current voting and previous results
- **Read-only Historical View**: Past voting results displayed in non-interactive format

### UI Components

Custom UI components designed for consistency and reusability:

- **Modal**: Glassmorphism-style modal with backdrop blur
- **Container**: Responsive container with consistent padding
- **Button**: Styled button component with variants
- **Link**: Enhanced link component with Next.js integration
- **Pagination**: Component for paginating through content
- **Thumbnail**: Image thumbnail component with Next.js Image integration
- **ImageUploader**: Reusable component for image upload with preview and validation
- **SubmissionForm**: Standardized form for photo submissions with validation
- **LoadingErrorStates**: Unified component for handling loading, error, and empty states

### Custom Hooks

Reusable logic encapsulated in custom React hooks:

- **useAuth**: Authentication state and methods
- **useSubmissions**: Fetching and managing submission data
- **useConfigAdmin**: Homepage configuration management with real-time updates
- **useDebugTools**: Development and debugging utilities
- **useFileUpload**: File selection, validation, preview, and upload functionality
- **useIssues**: Fetching and filtering issues data

### Real-time Update System

The frontend implements a sophisticated real-time update system for immediate content synchronization:

#### Architecture Overview

The real-time update system uses multiple layers of communication:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Admin Interface │    │  Homepage        │    │ Other Tabs      │
│                 │    │                  │    │                 │
│ Config Update   │◄──►│ Auto Refresh     │◄──►│ Cross-tab Sync  │
│ Image Upload    │    │ Cache Busting    │    │ Event Listening │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        ▲                       ▲
         │                        │                       │
         ▼                        ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Event Communication Layer                       │
│  • Custom Events (same tab)                                    │
│  • localStorage Events (cross-tab)                             │
│  • Polling Mechanism (30s fallback)                           │
└─────────────────────────────────────────────────────────────────┘
```

#### Key Components

1. **useConfigAdmin Hook** (`hooks/useConfigAdmin.ts`):
   - Manages homepage configuration state
   - Handles image uploads with real-time sync
   - Implements event-driven updates
   - Auto-clears success states to prevent infinite loops

2. **Homepage Component** (`app/page.tsx`):
   - Listens for configuration updates via multiple channels
   - Implements smart caching with version parameters
   - Updates image URLs with timestamps for cache busting

3. **HeroImage Component** (`components/home/HeroImage.tsx`):
   - Accepts `lastUpdated` prop for cache management
   - Automatically appends version parameters to image URLs
   - Handles both static and dynamic image sources

4. **Admin Settings Page** (`app/account/home-settings/page.tsx`):
   - Provides real-time preview of uploaded images
   - Shows current image with version parameters
   - Triggers system-wide updates on save

#### Update Mechanisms

1. **Event-Driven Updates** (Primary):
   ```typescript
   // Triggered on successful configuration save
   const event = new CustomEvent('configUpdated', { 
     detail: { config: configData, timestamp: Date.now() } 
   });
   window.dispatchEvent(event);
   ```

2. **Cross-Tab Communication**:
   ```typescript
   // Uses localStorage for cross-tab updates
   localStorage.setItem('hero_image_updated', Date.now().toString());
   ```

3. **Polling Mechanism** (Fallback):
   ```typescript
   // 30-second polling as backup
   setInterval(() => {
     loadConfig();
   }, 30000);
   ```

4. **Cache Busting**:
   ```typescript
   // Version parameters force image refresh
   const imageUrl = `/images/home/hero.jpg?v=${timestamp}`;
   ```

#### Configuration API

The system uses dedicated API endpoints for configuration management:

- **Public API** (`/frontend-api/config`):
  - No authentication required
  - Supports ETag caching
  - Force refresh with `_force=1` parameter

- **Admin API** (`/frontend-api/admin/config`):
  - Requires admin authentication
  - Handles configuration updates
  - Stores data in `/frontend/public/config/homepage.json`

#### Performance Optimizations

1. **Smart State Management**:
   - Uses `useCallback` with stable dependencies
   - Implements `useRef` to avoid unnecessary re-renders
   - Function-based state updates prevent stale closures

2. **Debouncing**:
   - Prevents duplicate reload requests
   - Implements timeout-based debouncing for events

3. **Conditional Updates**:
   - Only updates when configuration actually changes
   - Compares `lastUpdated` timestamps
   - JSON comparison for content changes

4. **Success State Management**:
   - Auto-clears success states after 2 seconds
   - Prevents infinite update loops
   - Clean event listener management

#### Error Handling

The system includes comprehensive error handling:

- **Authentication Errors**: Automatic token refresh attempts
- **Network Failures**: Graceful degradation with retry mechanisms  
- **Upload Failures**: Clear error messages with retry options
- **Sync Failures**: Fallback to polling mechanism

#### Troubleshooting

Common issues and solutions:

1. **Updates Not Appearing**:
   - Check browser console for errors
   - Verify admin authentication
   - Wait for 30-second polling cycle

2. **Infinite Loops**:
   - Success states auto-clear after 2 seconds
   - Event listeners properly cleaned up
   - Debouncing prevents duplicate requests

This real-time update system ensures users see changes immediately without manual page refreshes, providing a seamless content management experience.

### Development Tools

Components and hooks for development and debugging:

- **DebugTools**: Interface for testing and debugging functionality
- **useDebugTools**: Hook for accessing debugging utilities
- **LoadingErrorStates**: Components for handling loading and error states
- **mockData**: Mock data utilities for development and testing

### Home Page Components and Architecture

The home page provides an engaging entry point to the platform with the following components:

1. **HeroImage Component**: 
   - Located at `/components/home/HeroImage.tsx`
   - Displays a large, visually engaging image with hover/tap interaction effects
   - Handles responsive behavior automatically (hover for desktop, tap for mobile)
   - Implements transition animations for text visibility
   - Implements image loading error fallback mechanism
   - Uses Next.js Image component for optimized loading

2. **Home Page Component**:
   - Located at `/app/page.tsx`
   - Client-side component with dynamic content loading
   - Fetches configuration from API with cache-busting mechanism
   - Handles loading states for improved user experience
   - Presents intro text and platform description below hero image

3. **Home Settings Admin Interface**:
   - Located at `/app/account/home-settings/page.tsx`
   - Restricted to admin users (implements role-based access control)
   - Features:
     - Image upload with preview functionality
     - Description text editing
     - Image caption editing
     - Server-side image storage management
     - Configuration file updates
   - Implements proper form validation and error handling

4. **Configuration Management**:
   - Default configuration defined in `/lib/config.ts`
   - Dynamic configuration stored in `/public/config/homepage.json`
   - API endpoints:
     - `GET /api/config` - Retrieves current configuration
     - `POST /api/admin/config` - Updates configuration (admin only)
   - **