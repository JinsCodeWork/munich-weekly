# Munich Weekly - Frontend Architecture

## Overview

Munich Weekly is a photography-based weekly publication platform where users can submit, view, and vote on photographs. The frontend is built with a modern tech stack, featuring a responsive design that works across all devices.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: JWT-based authentication with secure HTTP-only cookies
- **State Management**: React Context API
- **Icons**: Font Awesome
- **UI Components**: Custom components with glassmorphism effects

## Core Components Structure

The frontend is organized into a component-based architecture following the Next.js App Router pattern:

```
frontend/
├── public/             # Static assets
├── src/
│   ├── app/            # Next.js App Router pages
│   │   ├── account/    # User account pages
│   │   ├── content/    # Content pages
│   │   └── ...         # Other page routes
│   ├── components/     # Reusable UI components
│   │   ├── auth/       # Authentication components
│   │   ├── navigation/ # Navigation components
│   │   └── ui/         # UI element components
│   ├── context/        # React Context providers
│   ├── lib/            # Utility functions and constants
│   └── ...
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

### Navigation System

A responsive navigation system that adjusts for different screen sizes:

- **MainNav**: Desktop navigation with user account dropdown
- **MobileNav**: Mobile-friendly navigation with sliding menu
- **Logo**: Customizable logo component

### User Account Management

A GitLab-inspired user account management system with:

- **Layout**: Sidebar navigation with main content area
- **Profile Management**: User profile viewing and editing
- **Submissions Management**: Interface for user photo submissions
- **Account Settings**: Security settings and password management

### UI Components

Custom UI components designed for consistency and reusability:

- **Modal**: Glassmorphism-style modal with backdrop blur
- **Container**: Responsive container with consistent padding
- **Form Elements**: Styled input fields, buttons, and form controls

### Responsive Design

The application features a fully responsive design:

- Mobile-first approach with Tailwind CSS
- Responsive navigation that transforms based on viewport size
- Flexible layouts that adapt to different screen sizes

## Authentication Flow

1. **Registration**:
   - User enters email, nickname, and password
   - Frontend validates form data
   - On submission, data is sent to the API endpoint
   - Upon success, the returned JWT token is stored in localStorage
   - User is automatically logged in

2. **Login**:
   - User enters email and password
   - On submission, credentials are verified via the API
   - Upon success, the JWT token is stored in localStorage
   - User info is fetched and stored in the AuthContext

3. **Session Persistence**:
   - On app initialization, the AuthContext checks for a stored JWT token
   - If found, user data is fetched from the API
   - If valid, the user remains logged in
   - If invalid, the token is cleared, and the user is redirected to login

4. **Logout**:
   - Token is removed from localStorage
   - User state is cleared from the AuthContext
   - User is redirected to the homepage

## API Integration

The frontend interacts with the backend API through RESTful endpoints:

- **Authentication Endpoints**:
  - `/api/auth/register`: User registration
  - `/api/auth/login/email`: Email-based login
  - `/api/users/me`: Fetch current user data

- **User Endpoints**:
  - `/api/users/me`: Update user profile information

## Code Conventions

The codebase follows these conventions:

1. **TypeScript**: Strong typing for components, props, and state
2. **Component Structure**: Each component has a defined interface for props
3. **CSS**: Tailwind utility classes with custom extensions when needed
4. **Comments**: Key functions and components are documented with JSDoc comments
5. **File Naming**: Component files use PascalCase, utility files use camelCase

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

## Conclusion

The Munich Weekly frontend provides a solid foundation for a modern, responsive web application. It employs best practices in React and Next.js development, with a clean component structure and well-defined authentication flow. The architecture is designed to be maintainable and scalable as new features are added. 