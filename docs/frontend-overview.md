# Munich Weekly Frontend Architecture Overview

## Introduction

Munich Weekly is a photography submission and voting platform, built with modern technology stack that provides a responsive user interface supporting multiple devices. This document provides an overview of the frontend architecture.

## Documentation Guide

This document serves as the entry point to the frontend development documentation system, which includes the following related documents:

- [**Frontend Architecture Details**](./frontend-architecture.md) - Detailed architecture design and technical decisions
- [**UI Component Library**](./ui-components.md) - UI component library specifications and usage guide
- [**Development Guide**](./dev-guide.md) - Frontend development processes and best practices

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API + Custom Hooks
- **Authentication**: JWT tokens
- **API Integration**: Fetch API with RESTful endpoints
- **Image Optimization**: Next.js Image component

## Project Structure

The frontend project follows a feature-based and component-based architecture, with clear separation of concerns:

```
frontend/
├── .next/                  # Next.js build output
├── node_modules/           # Dependencies
├── public/                 # Static assets
│   ├── favicon.png         # Site favicon
│   ├── logo.svg            # Brand logo
│   ├── globe.svg           # Various site icons
│   ├── file.svg
│   └── window.svg
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── account/        # User account pages
│   │   │   ├── layout.tsx  # Account section layout
│   │   │   ├── page.tsx    # Main account page
│   │   │   ├── submissions/# User's submissions management
│   │   │   ├── settings/   # User settings
│   │   │   └── manage-submissions/ # Admin submission management
│   │   ├── admin/          # Admin panel
│   │   ├── login/          # Login page
│   │   ├── register/       # Registration page
│   │   ├── content/        # Content pages
│   │   ├── globals.css     # Global CSS
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Homepage
│   ├── components/         # UI components
│   │   ├── admin/          # Admin components
│   │   ├── auth/           # Authentication components
│   │   ├── navigation/     # Navigation components
│   │   │   ├── MainNav.tsx # Desktop navigation
│   │   │   └── MobileNav.tsx # Mobile navigation menu
│   │   ├── submission/     # Submission-related components
│   │   ├── ui/             # Core UI components
│   │   │   ├── Button.tsx  # Button component
│   │   │   ├── Container.tsx # Container layout component
│   │   │   ├── Link.tsx    # Link component
│   │   │   ├── Logo.tsx    # Logo component
│   │   │   ├── Modal.tsx   # Modal dialog component
│   │   │   ├── Pagination.tsx # Pagination component
│   │   │   └── Thumbnail.tsx # Image thumbnail component
│   │   ├── Header.tsx      # Main header component
│   │   └── MainHeader.tsx  # Alternative header component
│   ├── context/            # React Context providers
│   │   └── AuthContext.tsx # Authentication context
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts      # Authentication hook
│   │   ├── useSubmissions.ts # Submissions data hook
│   │   └── useDebugTools.ts # Development debugging tools
│   ├── lib/                # Utility functions and constants
│   │   ├── api.ts          # API service functions
│   │   ├── constants.ts    # Application constants
│   │   └── utils.ts        # Utility helper functions
│   ├── types/              # TypeScript type definitions
│   │   └── submission.ts   # Submission-related types
│   └── utils/              # Additional utilities
│       └── mockData.ts     # Mock data for development
├── .eslintrc.json          # ESLint configuration
├── next.config.js          # Next.js configuration
├── package.json            # Project dependencies
├── postcss.config.js       # PostCSS configuration
├── tailwind.config.js      # Tailwind CSS configuration
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

## Custom Hooks

### Authentication Hooks
- `useAuth`: Manages user authentication state and operations

### Data Management Hooks
- `useSubmissions`: Manages submission data and operations

### Development Tools Hooks
- `useDebugTools`: Provides debugging and development tools

## Development Process

1. Understand the project architecture and component structure
2. Follow the code standards in the [development guide](./dev-guide.md)
3. Use the existing component library to build new features
4. Ensure code passes TypeScript type checking
5. Maintain good code comments and documentation

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