# Munich Weekly Frontend Architecture Overview

## Introduction

Munich Weekly is a photography submission and voting platform, built with modern technology stack that provides a responsive user interface supporting multiple devices. This document provides an overview of the frontend architecture.

## Documentation Guide

This document serves as the entry point to the frontend development documentation system, which includes the following related documents:

- [**Frontend Architecture Details**](./frontend-architecture.md) - Detailed architecture design and technical decisions
- [**UI Component Library**](./ui-components.md) - UI component library specifications and usage guide
- [**Development Guide**](./frontend-development-guide.md) - Frontend development processes and best practices

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API + Custom Hooks
- **Authentication**: JWT tokens
- **API Integration**: Fetch API with RESTful endpoints
- **Image Optimization**: Next.js Image component

## Project Structure

```
frontend/
├── public/                # Static assets
├── src/
│   ├── app/              # Next.js pages and layouts
│   │   ├── account/      # User account pages
│   │   └── ...
│   ├── components/       # UI components
│   │   ├── admin/        # Admin components
│   │   ├── auth/         # Authentication components
│   │   ├── navigation/   # Navigation components
│   │   ├── submission/   # Submission-related components
│   │   └── ui/           # Core UI components
│   ├── context/          # React Context providers
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utility functions and constants
└── .env.local            # Environment variables
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
2. Follow the code standards in the [development guide](./frontend-development-guide.md)
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