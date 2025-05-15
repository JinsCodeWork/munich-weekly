# Munich Weekly Frontend Architecture Overview

## Introduction

Munich Weekly is a photography submission and voting platform, built with modern technology stack that provides a responsive user interface supporting multiple devices. This document provides an overview of the frontend architecture.

## Documentation Guide

This document serves as the entry point to the frontend development documentation system, which includes the following related documents:

- [**Frontend Architecture Details**](./frontend-architecture.md) - Detailed architecture design and technical decisions
- [**UI Component Library**](./ui-components.md) - UI component library specifications and usage guide
- [**Development Guide**](./dev-guide.md) - Frontend development processes and best practices

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API + Custom Hooks
- **Authentication**: JWT tokens
- **API Integration**: Modular API structure organized by business functionality
- **Image Optimization**: Next.js Image component

## Project Structure

The frontend project follows a feature-based and component-based architecture, with clear separation of concerns. Here's the actual project structure:

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
│   │   │   └── manage-submissions/ # Admin submission management
│   │   ├── admin/          # Admin panel routes
│   │   │   └── submissions/# Admin submission management
│   │   ├── content/        # Content pages
│   │   ├── login/          # Login page
│   │   │   └── page.tsx    # Login page component
│   │   ├── register/       # Registration page
│   │   ├── test/           # Test pages
│   │   │   └── page.tsx    # Test component
│   │   ├── globals.css     # Global CSS
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Homepage
│   ├── components/         # UI components
│   │   ├── admin/          # Admin components
│   │   │   └── submissions/# Admin submission components
│   │   │       ├── DebugTools.tsx     # Development debugging interface
│   │   │       ├── IssueSelector.tsx  # Issue selection component
│   │   │       ├── LoadingErrorStates.tsx # Loading/error handling
│   │   │       └── SubmissionTable.tsx # Submission management table
│   │   ├── auth/           # Authentication components
│   │   │   ├── LoginForm.tsx   # Login form component
│   │   │   └── RegisterForm.tsx # Registration form component
│   │   ├── navigation/     # Navigation components
│   │   │   ├── MainNav.tsx     # Desktop navigation bar
│   │   │   └── MobileNav.tsx   # Mobile navigation menu
│   │   ├── submission/     # Submission components
│   │   │   ├── ImageGrid.tsx   # Grid layout for images
│   │   │   ├── ImageViewer.tsx # Image viewing modal
│   │   │   └── SubmissionCard.tsx # Submission card component
│   │   ├── ui/             # Core UI components
│   │   │   ├── Button.tsx      # Button component
│   │   │   ├── Container.tsx   # Container layout component
│   │   │   ├── Link.tsx        # Link component
│   │   │   ├── Logo.tsx        # Logo component
│   │   │   ├── Modal.tsx       # Modal dialog component
│   │   │   ├── Pagination.tsx  # Pagination component
│   │   │   └── Thumbnail.tsx   # Image thumbnail component
│   │   ├── Header.tsx      # Main header component
│   │   └── MainHeader.tsx  # Alternative header component
│   ├── context/            # React Context providers
│   │   └── AuthContext.tsx # Authentication context
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts      # Authentication hook
│   │   ├── useSubmissions.ts # Submissions data hook
│   │   └── useDebugTools.ts # Development debugging tools
│   ├── lib/                # Utility functions and constants
│   │   ├── constants.ts    # Application constants
│   │   └── utils.ts        # Utility helper functions
│   ├── styles/             # Style-related directory (reserved)
│   ├── theme/              # Theme-related directory (reserved)
│   ├── types/              # TypeScript type definitions
│   │   └── submission.ts   # Submission-related types
│   └── utils/              # Additional utilities
│       └── mockData.ts     # Mock data for development
├── components.json         # Components configuration
├── eslint.config.mjs       # ESLint configuration
├── next.config.js          # Next.js configuration
├── next-env.d.ts           # Next.js TypeScript declarations
├── package.json            # Project dependencies
├── postcss.config.mjs      # PostCSS configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## Core Features

### 1. Authentication System

- JWT token authentication mechanism
- User registration and login
- Session persistence
- Permission control

### 2. User Interface

- Responsive design
- Glassmorphism design elements
- Component-based architecture
- Image optimization techniques

### 3. Content Management

- User profile management
- Work submission system
- Admin approval workflow
- Voting mechanism

### 4. Navigation System

- Responsive navigation
- Mobile sidebar menu
- User-state aware elements

### 5. API Integration System

- Modular API structure
- Grouped by business function (authentication, users, submissions, issues, votes)
- Unified error handling
- TypeScript type safety

## Implemented Components

### Navigation Components
- MainNav (desktop navigation)
- MobileNav (mobile menu)
- Logo

### Authentication Components
- LoginForm
- RegisterForm

### Layout Components
- Container
- AccountLayout

### Base UI Components
- Modal
- Link
- Thumbnail
- Pagination
- Button

### Submission Related Components
- SubmissionCard
- ImageGrid
- ImageViewer

### Admin Components
- SubmissionTable
- IssueSelector
- LoadingErrorStates
- DebugTools

## Custom Hooks

### Authentication Hooks
- `useAuth`: Manages user authentication state and operations

### Data Management Hooks
- `useSubmissions`: Manages submission data and operations

### Development Tools Hooks
- `useDebugTools`: Provides debugging and development tools

## API Module Structure

The frontend API adopts a modular structure, grouped by business function to improve code maintainability and extensibility:

- **auth**: Authentication-related APIs, including registration, login, and third-party authentication
- **users**: User-related APIs, including retrieving user information and updating user profiles
- **issues**: Issue-related APIs, including retrieving issue lists and details
- **submissions**: Submission-related APIs, including creating, reviewing, and managing submissions
- **votes**: Voting-related APIs, including submitting votes and checking vote status

API module usage:

```typescript
// Import needed API modules
import { authApi, submissionsApi } from "@/api";

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

## Contribution Guidelines

1. Follow code standards and development best practices
2. Reuse existing components to ensure UI consistency
3. Ensure responsive design adapts to various devices
4. Write appropriate unit tests
5. Update relevant documentation
6. Use modular API structure for API integration 