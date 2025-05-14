# Munich Weekly - Frontend Development Guide

## Getting Started

This guide provides step-by-step instructions for setting up and developing the Munich Weekly frontend application.

## Prerequisites

Before starting development, ensure you have the following installed:

- Node.js (v16.0.0 or later)
- npm (v7.0.0 or later) or Yarn (v1.22.0 or later)
- Git

## Repository Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-organization/munich-weekly.git
   cd munich-weekly
   ```

2. Install dependencies:
   ```bash
   # Navigate to the frontend directory
   cd frontend
   
   # Install dependencies
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   
   # Edit the .env.local file with your environment-specific values
   ```

## Development Workflow

### Starting the Development Server

```bash
npm run dev
# or
yarn dev
```

This will start the development server at [http://localhost:3000](http://localhost:3000).

### Building for Production

```bash
npm run build
# or
yarn build
```

### Linting

```bash
npm run lint
# or
yarn lint
```

## Project Structure

The frontend project follows a specific structure that should be maintained during development:

```
frontend/
├── public/             # Static assets
│   ├── fonts/          # Font files
│   └── images/         # Image assets
├── src/
│   ├── app/            # Next.js App Router pages
│   ├── components/     # Reusable UI components
│   ├── context/        # React Context providers
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions and constants
│   ├── styles/         # Global styles and Tailwind configuration
│   └── types/          # TypeScript type definitions
├── .env.example        # Example environment variables
├── .eslintrc.json      # ESLint configuration
├── next.config.js      # Next.js configuration
├── package.json        # Project dependencies and scripts
├── postcss.config.js   # PostCSS configuration for Tailwind
├── tailwind.config.js  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

## Development Guidelines

### Component Development

1. **Creating a New Component**

   New components should be created in the `src/components` directory, organized by feature or type.

   Example of a new UI component:
   ```tsx
   // src/components/ui/Button.tsx
   import React from 'react'
   import { cn } from '@/lib/utils'

   interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
     variant?: 'primary' | 'secondary' | 'outline'
     size?: 'sm' | 'md' | 'lg'
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
           // Base styles
           'inline-flex items-center justify-center rounded-md font-medium transition-colors',
           // Size variants
           size === 'sm' && 'px-3 py-1.5 text-sm',
           size === 'md' && 'px-4 py-2 text-base',
           size === 'lg' && 'px-5 py-2.5 text-lg',
           // Color variants
           variant === 'primary' && 'bg-blue-500 text-white hover:bg-blue-600',
           variant === 'secondary' && 'bg-gray-200 text-gray-900 hover:bg-gray-300',
           variant === 'outline' && 'border border-gray-300 bg-transparent hover:bg-gray-50',
           // Additional classes
           className
         )}
         {...props}
       >
         {children}
       </button>
     )
   }
   ```

2. **Component Documentation**

   Each component should include JSDoc comments describing its purpose, props, and usage:

   ```tsx
   /**
    * Button component with various style variants
    * 
    * @example
    * ```tsx
    * <Button variant="primary" size="md" onClick={handleClick}>
    *   Click Me
    * </Button>
    * ```
    */
   export function Button({ ... }) { ... }
   ```

### Page Development

1. **Creating a New Page**

   Pages are created in the `src/app` directory following Next.js App Router conventions:

   ```tsx
   // src/app/about/page.tsx
   import { Container } from '@/components/ui/Container'

   export const metadata = {
     title: 'About - Munich Weekly',
     description: 'About Munich Weekly photography publication',
   }

   export default function AboutPage() {
     return (
       <Container as="main" className="py-12">
         <h1 className="text-3xl font-bold mb-6">About Munich Weekly</h1>
         <p className="text-lg text-gray-700">
           Munich Weekly is a photography-based publication featuring the best photos from Munich.
         </p>
       </Container>
     )
   }
   ```

2. **Creating Layouts**

   For pages that share common layouts, use the layout pattern:

   ```tsx
   // src/app/blog/layout.tsx
   import { Container } from '@/components/ui/Container'

   export default function BlogLayout({
     children,
   }: {
     children: React.ReactNode
   }) {
     return (
       <div className="bg-gray-50 min-h-screen">
         <Container>
           <div className="grid grid-cols-1 md:grid-cols-12 gap-8 py-8">
             <div className="md:col-span-9">{children}</div>
             <aside className="md:col-span-3">
               {/* Sidebar content */}
             </aside>
           </div>
         </Container>
       </div>
     )
   }
   ```

### Styling

1. **Using Tailwind CSS**

   Styles are primarily applied using Tailwind CSS classes:

   ```tsx
   <div className="flex flex-col space-y-4 p-6 bg-white rounded-lg shadow-md">
     <h2 className="text-2xl font-bold text-gray-900">Title</h2>
     <p className="text-base text-gray-700">Content here</p>
   </div>
   ```

2. **Custom Styles**

   For custom styles that extend Tailwind, use the `cn` utility:

   ```tsx
   import { cn } from '@/lib/utils'

   <div className={cn(
     'base-styles',
     condition && 'conditional-styles',
     customClass
   )}>
     Content
   </div>
   ```

3. **Responsive Design**

   Always design with a mobile-first approach, using Tailwind's responsive prefixes:

   ```tsx
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
     {/* Content will be 1 column on mobile, 2 on tablet, 3 on desktop */}
   </div>
   ```

### State Management

1. **Local Component State**

   For component-specific state, use React's `useState` and `useReducer` hooks:

   ```tsx
   function Counter() {
     const [count, setCount] = useState(0)
     
     return (
       <div>
         <p>Count: {count}</p>
         <button onClick={() => setCount(count + 1)}>Increment</button>
       </div>
     )
   }
   ```

2. **Global Application State**

   For global state, use React Context with custom hooks:

   ```tsx
   // Access the authentication context
   function ProfilePage() {
     const { user, logout } = useAuth()
     
     if (!user) return <div>Please log in</div>
     
     return (
       <div>
         <h1>Welcome, {user.nickname}</h1>
         <button onClick={logout}>Logout</button>
       </div>
     )
   }
   ```

### API Integration

1. **API Requests**

   Use the Fetch API for making requests to the backend:

   ```tsx
   async function fetchUserData() {
     try {
       const response = await fetch('/api/users/me', {
         headers: {
           'Authorization': `Bearer ${localStorage.getItem('jwt')}`
         }
       })
       
       if (!response.ok) {
         throw new Error('Failed to fetch user data')
       }
       
       const data = await response.json()
       return data
     } catch (error) {
       console.error('Error fetching user data:', error)
       throw error
     }
   }
   ```

2. **API Error Handling**

   Implement consistent error handling for API requests:

   ```tsx
   async function submitForm(formData) {
     setLoading(true)
     setError(null)
     
     try {
       const response = await fetch('/api/endpoint', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${localStorage.getItem('jwt')}`
         },
         body: JSON.stringify(formData)
       })
       
       const data = await response.json()
       
       if (!response.ok) {
         throw new Error(data.error || 'An unknown error occurred')
       }
       
       return data
     } catch (error) {
       setError(error.message)
       throw error
     } finally {
       setLoading(false)
     }
   }
   ```

### Authentication Integration

1. **Protected Routes**

   For pages that require authentication, use the `useAuth` hook with redirection:

   ```tsx
   'use client'
   
   import { useAuth } from '@/context/AuthContext'
   import { useRouter } from 'next/navigation'
   import { useEffect } from 'react'

   export default function ProtectedPage() {
     const { user, loading } = useAuth()
     const router = useRouter()
     
     useEffect(() => {
       if (!loading && !user) {
         router.push('/login')
       }
     }, [user, loading, router])
     
     if (loading) {
       return <div>Loading...</div>
     }
     
     if (!user) {
       return null // Will redirect
     }
     
     return <div>Protected content here</div>
   }
   ```

2. **Making Authenticated Requests**

   Include authentication tokens in your API requests:

   ```tsx
   const fetchProtectedData = async () => {
     const token = localStorage.getItem('jwt')
     
     if (!token) {
       throw new Error('No authentication token')
     }
     
     const response = await fetch('/api/protected-endpoint', {
       headers: {
         'Authorization': `Bearer ${token}`
       }
     })
     
     // Handle response
   }
   ```

## Testing

### Running Tests

```bash
npm run test
# or
yarn test
```

### Component Testing

Write tests for components using Jest and React Testing Library:

```tsx
// src/components/ui/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
  
  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
  
  it('applies the correct classes for variants', () => {
    const { rerender } = render(<Button variant="primary">Button</Button>)
    expect(screen.getByText('Button')).toHaveClass('bg-blue-500')
    
    rerender(<Button variant="secondary">Button</Button>)
    expect(screen.getByText('Button')).toHaveClass('bg-gray-200')
  })
})
```

## Deployment

### Production Build

To prepare the application for deployment:

```bash
npm run build
# or
yarn build
```

This generates optimized production files in the `.next` directory.

### Static Export (Optional)

For static site hosting:

```bash
npm run export
# or
yarn export
```

This generates static HTML files in the `out` directory.

## Common Issues and Solutions

### Image Optimization

When using Next.js Image component, ensure proper configuration:

```tsx
import Image from 'next/image'

// Good practice: specify width and height
<Image 
  src="/images/photo.jpg" 
  alt="Description" 
  width={800} 
  height={600} 
  className="rounded-lg"
/>
```

### Authentication Errors

If experiencing authentication issues:

1. Check token storage in localStorage
2. Ensure proper Authorization headers in requests
3. Verify token expiration handling

### API Connection Issues

For API connection problems:

1. Check API URL configuration in environment variables
2. Verify CORS settings if APIs are on different domains
3. Check the network tab in browser dev tools for detailed error responses

## Conclusion

This guide provides the fundamentals for developing the Munich Weekly frontend application. By following these guidelines, you'll maintain consistency and best practices throughout the codebase.

For more detailed information, refer to:
- [UI Component Library](./ui-components.md)
- [Frontend Architecture](./frontend-architecture.md) 