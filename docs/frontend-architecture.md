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
│   │   ├── test/           # Test pages
│   │   ├── globals.css     # Global CSS
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Homepage
│   ├── components/         # UI components
│   │   ├── admin/          # Admin components
│   │   │   └── submissions/# Admin submission components
│   │   │       ├── DebugTools.tsx     # Development debugging
│   │   │       ├── IssueSelector.tsx  # Issue selection
│   │   │       ├── LoadingErrorStates.tsx # Loading/error states
│   │   │       └── SubmissionTable.tsx # Submission table
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
│   │   ├── ui/             # Core UI components
│   │   │   ├── Button.tsx      # Button component
│   │   │   ├── Container.tsx   # Container layout
│   │   │   ├── Link.tsx        # Link component
│   │   │   ├── Logo.tsx        # Logo component
│   │   │   ├── Modal.tsx       # Modal dialog
│   │   │   ├── Pagination.tsx  # Pagination component
│   │   │   └── Thumbnail.tsx   # Image thumbnail
│   │   ├── Header.tsx      # Main header component
│   │   └── MainHeader.tsx  # Alternative header
│   ├── context/            # React Context providers
│   │   └── AuthContext.tsx # Authentication context
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts      # Authentication hook
│   │   ├── useSubmissions.ts # Submissions data hook
│   │   └── useDebugTools.ts # Development debugging hook
│   ├── lib/                # Utility functions and constants
│   │   ├── constants.ts    # Application constants
│   │   └── utils.ts        # Utility helper functions
│   ├── styles/             # Style-related directory (reserved)
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
- **Session Management**: Persistent sessions using localStorage
- **Logout Functionality**: Complete session termination

Authentication components:
- `LoginForm`: A modal-based login form with email/password fields
- `RegisterForm`: A modal-based registration form with validation
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
- **IssueSelector**: Component for selecting publication issues

### UI Components

Custom UI components designed for consistency and reusability:

- **Modal**: Glassmorphism-style modal with backdrop blur
- **Container**: Responsive container with consistent padding
- **Button**: Styled button component with variants
- **Link**: Enhanced link component with Next.js integration
- **Pagination**: Component for paginating through content
- **Thumbnail**: Image thumbnail component with Next.js Image integration

### Development Tools

Components and hooks for development and debugging:

- **DebugTools**: Interface for testing and debugging functionality
- **useDebugTools**: Hook for accessing debugging utilities
- **LoadingErrorStates**: Components for handling loading and error states
- **mockData**: Mock data utilities for development and testing

### Authentication Flow

1. **Registration**:
   - User enters email, nickname, and password
   - Frontend validates form data
   - On submission, data is sent to the API endpoint
   - Upon success, the returned JWT token is stored in localStorage
   - User is automatically logged in

2. **Login**:
   - User enters email and password in the modal dialog
   - On submission, credentials are verified via the API
   - Upon success, the JWT token is stored in localStorage
   - User info is fetched and stored in the AuthContext
   - User continues with their intended action without page transitions

3. **Session Persistence**:
   - On app initialization, the AuthContext checks for a stored JWT token
   - If found, user data is fetched from the API
   - If valid, the user remains logged in
   - If invalid, the token is cleared, and the user is redirected to login

4. **Contextual Authentication**:
   - When accessing protected features (like photo submission), authentication is handled contextually
   - System presents a modal prompt with feature description ("Share Your Perspective")
   - User proceeds to login modal directly from the prompt
   - After successful authentication, user resumes their original task

5. **Logout**:
   - Token is removed from localStorage
   - User state is cleared from the AuthContext
   - User is redirected to the homepage

6. **Role-Based Access Control**:
   - User roles (admin, user) are stored in the AuthContext
   - Components can check user roles to control UI rendering
   - Protected routes verify user roles to restrict access

### Content Submission System

The application implements a user-friendly content submission system:

1. **Submission Flow**:
   - Three-step process with clear progression
   - Each step becomes available after completing the previous one
   - Visual feedback indicates current step and progress

2. **Issue Selection**:
   - Users select from currently active issues
   - System filters issues based on submission period dates
   - Clear presentation of issue details and guidelines

3. **Photo Upload**:
   - Interactive drag-and-drop or file browser interface
   - Strict file type validation (only JPEG and PNG formats supported)
   - File size limit of 20MB per submission
   - Clear guidelines for multiple submissions (maximum 4 photos per issue)
   - Progress indicator during upload
   - Preview functionality before proceeding

4. **Description Entry**:
   - Form for adding context to submissions
   - Character count with limits
   - Validation to ensure complete submissions
   - Success feedback upon completion

### Modal Dialog System

The application uses a consistent modal dialog system rather than multiple page transitions:

1. **Dialog Architecture**:
   - Centralized Modal component with customizable variants
   - Overlay system with appropriate opacity levels for different contexts
   - Content variants to support different visual styles (standard, glassmorphism)

2. **User Experience Benefits**:
   - Maintains browsing context without page reloads
   - Provides focused interaction for specific tasks
   - Reduces navigation complexity and improves flow

3. **Implementation Approach**:
   - Dialog content is component-based for reusability
   - Animation effects enhance user experience
   - Backdrop interactions (click to dismiss) improve usability

## API Integration

### Modular API Structure

The frontend API is organized in a modular way, categorized by business functionality:

```
api/
├── auth/           # Authentication-related APIs (registration, login, third-party auth)
├── users/          # User-related APIs (user info retrieval, profile updates)
├── issues/         # Issue-related APIs (retrieving issue lists, getting single issues)
├── submissions/    # Submission-related APIs (submitting, reviewing, querying submissions)
├── votes/          # Voting-related APIs (submitting votes, checking vote status)
├── http.ts         # Common HTTP request utility functions
├── types.ts        # API error type definitions
└── index.ts        # Unified API export module
```

Example of using APIs in components:

```typescript
// Import specific API modules
import { authApi, usersApi, submissionsApi } from "@/api";

// Using authentication API
const handleLogin = async () => {
  try {
    const response = await authApi.loginWithEmail({
      email: "user@example.com",
      password: "password123"
    });
    // Handle login response
  } catch (error) {
    // Handle error
  }
};

// Using submissions API
const loadSubmissions = async () => {
  try {
    const submissions = await submissionsApi.getUserSubmissions();
    // Handle submission data
  } catch (error) {
    // Handle error
  }
};
```

### REST API Endpoints

The frontend interacts with the backend through the following RESTful endpoints:

- **Authentication Endpoints**:
  - `/api/auth/register`: User registration
  - `/api/auth/login/email`: Email-based login
  - `/api/auth/login/provider`: Third-party provider login
  - `/api/auth/bind`: Bind third-party account
  - `/api/auth/providers`: Get linked third-party providers

- **User Endpoints**:
  - `/api/users/me`: Get current user data
  - `/api/users`: Get all users (admin only)

- **Submission Endpoints**:
  - `/api/submissions`: Get/create submissions
  - `/api/submissions/mine`: Get user's own submissions
  - `/api/submissions/all`: Get all submissions (admin only)
  - `/api/submissions/{id}/approve`: Approve submission
  - `/api/submissions/{id}/reject`: Reject submission
  - `/api/submissions/{id}/select`: Select submission as featured

- **Issue Endpoints**:
  - `/api/issues`: Get all issues
  - `/api/issues/{id}`: Get specific issue

- **Voting Endpoints**:
  - `/api/votes`: Submit vote
  - `/api/votes/check`: Check vote status

## Code Conventions

The codebase follows these conventions:

1. **TypeScript**: Strong typing for components, props, and state
2. **Component Structure**: Each component has a defined interface for props
3. **CSS**: Tailwind utility classes with custom extensions when needed
4. **Comments**: Key functions and components are documented with JSDoc comments
5. **File Naming**: Component files use PascalCase, utility files use camelCase
6. **API Modularization**: APIs grouped by business functionality, using unified HTTP request utilities

## Future Enhancements

The frontend is designed for extensibility, with planned features including:

1. **Internationalization**: Language switching between English and Chinese
2. **Theme Customization**: Light/dark mode support
3. **Notifications System**: Real-time notifications for user interactions
4. **Advanced Image Uploads**: Enhanced image upload with preview and editing
5. **Social Features**: Sharing and commenting functionality

## Development Guidelines

For developers working on the frontend:

1. **Component Creation**: New components should follow the established patterns
2. **State Management**: Use React Context for global state, local state for component-specific needs
3. **Styling**: Use Tailwind classes directly in components and extract common patterns to the utility layer
4. **Responsiveness**: Always design with mobile-first approach
5. **Authentication**: Secure endpoints should verify the JWT token via the AuthContext
6. **API Integration**: Use modular API structure organized by business functionality

## Style Management

The application implements a systematic approach to style management using a combination of Tailwind CSS and TypeScript:

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

Key features of the style system:
- **Centralized style functions**: Replaces inline styles with reusable style functions
- **Type-safe style variants**: TypeScript-powered style variants with proper type checking
- **Theme consistency**: Unified theme variables for colors, spacing, and animations
- **Animation support**: Integration with tailwindcss-animate for consistent animations
- **Responsive design**: Mobile-first responsive styles with consistent breakpoints
- **Dark mode ready**: Structure supports future theme switching capabilities

## Conclusion

The Munich Weekly frontend provides a solid foundation for a modern, responsive web application. It employs best practices in React and Next.js development, with a clean component structure and well-defined authentication flow. The architecture is designed to be maintainable and scalable as new features are added. 