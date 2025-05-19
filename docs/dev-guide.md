# Munich Weekly Frontend Development Guide

## Introduction

This guide provides development specifications and best practices for the Munich Weekly frontend application. Developers should refer to this document to ensure code quality, consistency, and maintainability.

## Development Environment Setup

### Prerequisites

- Node.js (v16.0.0 or higher)
- npm (v7.0.0 or higher) or Yarn (v1.22.0 or higher)
- Git

### Project Setup

```bash
# Clone repository
git clone https://github.com/your-organization/munich-weekly.git
cd munich-weekly

# Install dependencies
cd frontend
npm install

# Start development server
npm run dev
```

## Project Architecture

Munich Weekly frontend adopts the Next.js App Router architecture, with the following main structure:

```
frontend/
├── public/                # Static assets
├── src/
│   ├── app/              # Next.js pages and layouts
│   ├── components/       # UI components
│   ├── context/          # React Context providers
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utility functions and constants
└── .env.local            # Environment variables
```

For more detailed architecture information, please refer to the [Frontend Architecture Documentation](./frontend-architecture.md).

## Coding Standards

### TypeScript

- All code must be written in TypeScript
- Define interfaces for all component Props
- Avoid using the `any` type
- Use type inference to reduce redundant type declarations

### Component Standards

- Component files use PascalCase naming
- Each component should have a clearly defined responsibility
- Complex components should be broken down into smaller sub-components
- Use JSDoc comments to document component functionality

### Styling

- Use Tailwind CSS for styling
- For conditional styles, use the `cn` utility function
- Follow mobile-first responsive design principles
- Keep style consistent with the design system

## Component Development

### Base Components

Base UI components are located in the `src/components/ui` directory:

```tsx
// Component structure example
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "base styles",
        variant === 'primary' && "primary styles",
        // Other conditional styles...
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

For more details on UI components, please refer to the [UI Component Library Documentation](./ui-components.md).

## State Management

### Local State

- Use `useState` and `useReducer` to manage component internal state

### Global State

- Use React Context API to manage global state
- Simplify state access through custom hooks
- Encapsulate related state logic in dedicated Context

### Authentication State

- Use `AuthContext` and `useAuth` hook to manage user authentication
- JWT tokens are stored in localStorage
- Protected routes should check authentication status

## API Integration

- Use Fetch API for HTTP requests
- API endpoints are defined in `src/lib/api.ts`
- Add JWT token for authenticated requests
- Implement consistent error handling strategy

## Storage Configuration

The application supports two storage options for image uploads:

### Local Storage (Development)

When working in development environments, local storage is used by default. To configure:

```
# In backend/application.properties
storage.mode=LOCAL
uploads.directory=./uploads
```

This stores files in the local filesystem under the `uploads` directory.

### Cloudflare R2 Storage (Production)

For production environments, Cloudflare R2 cloud storage is used:

```
# In backend/application.properties
storage.mode=R2
cloudflare.r2.access-key=${CLOUDFLARE_R2_ACCESS_KEY}
cloudflare.r2.secret-key=${CLOUDFLARE_R2_SECRET_KEY}
cloudflare.r2.endpoint=${CLOUDFLARE_R2_ENDPOINT}
cloudflare.r2.bucket=${CLOUDFLARE_R2_BUCKET:munichweekly-photoupload}
cloudflare.r2.public-url=${CLOUDFLARE_R2_PUBLIC_URL}
```

For development testing with R2 storage, set up a local `.env` file with your Cloudflare R2 credentials. See [Storage Documentation](./storage.md) for details.

## Custom Hooks

### useAuth

Hook for managing user authentication.

```tsx
const { user, token, loading, login, logout } = useAuth();
```

### useSubmissions

Hook for managing submission data.

```tsx
const { 
  submissions, 
  loading, 
  error,
  handleSubmissionAction 
} = useSubmissions();
```

## Performance Optimization

- Use `React.memo` to reduce unnecessary re-renders
- Optimize list rendering performance
- Use Next.js Image component for image optimization
- Implement code splitting and lazy loading

## Testing

- Use Jest and React Testing Library for unit testing
- Write tests for key components and functionality
- Test responsive behavior at different viewport sizes
- Ensure keyboard accessibility

## Deployment

See the [Deployment Documentation](./deployment.md) for deployment process details.

## Reference Documentation

- [Frontend Architecture Details](./frontend-architecture.md)
- [UI Component Library](./ui-components.md)
