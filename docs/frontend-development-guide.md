# Munich Weekly 前端开发指南

## 引言

本指南提供Munich Weekly前端应用程序的开发规范和最佳实践。开发人员应参考本文档以确保代码质量、一致性和可维护性。

## 目录

1. [开发环境](#开发环境)
2. [项目结构](#项目结构)
3. [编码规范](#编码规范)
4. [组件开发](#组件开发)
5. [状态管理](#状态管理)
6. [API集成](#API集成)
7. [认证实现](#认证实现)
8. [自定义Hooks](#自定义Hooks)
9. [测试](#测试)
10. [部署](#部署)
11. [常见问题](#常见问题)

## 开发环境

### 前置要求

在开始开发前，请确保安装以下工具：

- Node.js (v16.0.0或更高版本)
- npm (v7.0.0或更高版本)或Yarn (v1.22.0或更高版本)
- Git

### 项目设置

1. 克隆仓库:
   ```bash
   git clone https://github.com/your-organization/munich-weekly.git
   cd munich-weekly
   ```

2. 安装依赖:
   ```bash
   # 导航到前端目录
   cd frontend
   
   # 安装依赖
   npm install
   ```

3. 设置环境变量:
   ```bash
   # 复制示例环境文件
   cp .env.example .env.local
   
   # 编辑.env.local文件，设置环境特定的值
   ```

### 开发流程

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint
```

## 项目结构

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

## 编码规范

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

## 组件开发

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

## 自定义Hooks

The application includes several custom hooks to abstract and reuse common functionalities.

### Authentication Hooks

#### useAuth Hook

The `useAuth` hook provides authentication functionality through React Context:

```tsx
import { useAuth } from '@/context/AuthContext';

function ProfilePage() {
  const { 
    user,          // Current user object or null if not logged in
    token,         // JWT token or null if not logged in
    loading,       // Loading state while checking authentication
    login,         // Function to log user in
    logout         // Function to log user out
  } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <div>Please log in to view this page.</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {user.nickname}!</h1>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      
      {user.avatarUrl && (
        <img src={user.avatarUrl} alt={user.nickname} />
      )}
      
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

**Key Features of useAuth**:
- Provides user information and authentication state
- Manages JWT token storage in localStorage
- Handles login and logout operations
- Fetches user data from API upon authentication
- Manages loading state during authentication checks

**Using Protected Routes**:

```tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user || user.role !== 'admin') {
    return null; // Will redirect in the effect
  }
  
  return (
    <div>
      <h1>Admin Dashboard</h1>
      {/* Admin content */}
    </div>
  );
}
```

**Making Authenticated API Requests**:

```tsx
import { useAuth } from '@/context/AuthContext';

function DataFetchingComponent() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  
  const fetchProtectedData = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/protected-endpoint', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  
  useEffect(() => {
    fetchProtectedData();
  }, [token]);
  
  return (
    <div>
      {/* Render your data */}
    </div>
  );
}
```

### Submission Management Hooks

#### useSubmissions Hook

The `useSubmissions` hook provides comprehensive functionality for managing submission data and operations:

```tsx
import { useSubmissions } from '@/hooks/useSubmissions';

function SubmissionManagementPage() {
  // Initialize the hook with optional mock data flag
  const {
    issues,                 // List of available issues
    selectedIssue,          // Currently selected issue ID
    setSelectedIssue,       // Function to change selected issue
    submissions,            // List of submissions for selected issue
    loading,                // Loading state
    error,                  // Error state
    actionLoading,          // ID of submission with pending action
    viewingSubmission,      // Currently viewing submission
    setViewingSubmission,   // Function to set viewing submission
    handleSubmissionAction, // Function to handle approval/rejection
    retryLoadSubmissions    // Function to retry loading submissions
  } = useSubmissions(false); // Set to true to use mock data
  
  return (
    <div>
      {/* Issue selector */}
      <select 
        value={selectedIssue || ''} 
        onChange={e => setSelectedIssue(Number(e.target.value))}
      >
        {issues.map(issue => (
          <option key={issue.id} value={issue.id}>
            {issue.title}
          </option>
        ))}
      </select>
      
      {/* Loading and error states */}
      {loading && <div>Loading submissions...</div>}
      {error && (
        <div>
          <p>{error}</p>
          <button onClick={retryLoadSubmissions}>Retry</button>
        </div>
      )}
      
      {/* Display submissions */}
      {!loading && !error && submissions.map(submission => (
        <div key={submission.id}>
          <h3>{submission.description}</h3>
          <img 
            src={submission.imageUrl} 
            alt={submission.description}
            onClick={() => setViewingSubmission(submission)}
          />
          
          {/* Action buttons */}
          <div>
            <button 
              onClick={() => handleSubmissionAction(submission.id, 'approve')}
              disabled={actionLoading === submission.id}
            >
              Approve
            </button>
            <button 
              onClick={() => handleSubmissionAction(submission.id, 'reject')}
              disabled={actionLoading === submission.id}
            >
              Reject
            </button>
            <button 
              onClick={() => handleSubmissionAction(submission.id, 'select')}
              disabled={actionLoading === submission.id}
            >
              Select
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Key Features of useSubmissions**:
- Loads issues and automatically selects the first one
- Loads submissions for the selected issue
- Handles API calls for approval, rejection, and selection
- Manages loading and error states
- Supports mock data for development and testing
- Handles viewing a specific submission in detail

### useDebugTools Hook

The `useDebugTools` hook provides developer tools for debugging authentication and API calls:

```tsx
import { useDebugTools } from '@/hooks/useDebugTools';

function DebugComponent() {
  const {
    showDebugInfo,      // State for showing debug info panel
    setShowDebugInfo,   // Toggle debug info panel
    apiTestResult,      // Result of API test
    setApiTestResult,   // Set API test result
    useMockData,        // Whether to use mock data
    debugInfo,          // Debug information object
    checkAuthStatus,    // Function to check auth status
    testApiConnection,  // Function to test API connection
    toggleMockData      // Function to toggle mock data
  } = useDebugTools(token, selectedIssue);
  
  return (
    <div>
      <div className="debug-toolbar">
        <button onClick={checkAuthStatus}>
          Check Auth Status
        </button>
        
        <button onClick={testApiConnection}>
          Test API Connection
        </button>
        
        <button onClick={toggleMockData}>
          {useMockData ? 'Use Real Data' : 'Use Mock Data'}
        </button>
      </div>
      
      {/* Debug info panel */}
      {showDebugInfo && (
        <div className="debug-panel">
          <h3>Debug Information</h3>
          <p>User logged in: {debugInfo.userLoggedIn ? 'Yes' : 'No'}</p>
          <p>User role: {debugInfo.userRole}</p>
          <p>Token in context: {debugInfo.tokenInContext ? 'Yes' : 'No'}</p>
          <p>Token in storage: {debugInfo.tokenInStorage ? 'Yes' : 'No'}</p>
          <p>Token preview: {debugInfo.tokenPreview}</p>
          
          <button onClick={() => setShowDebugInfo(false)}>Close</button>
        </div>
      )}
      
      {/* API test result panel */}
      {apiTestResult && (
        <div className="api-test-panel">
          <h3>API Test Result</h3>
          <pre>{apiTestResult}</pre>
          
          <button onClick={() => setApiTestResult(null)}>Close</button>
        </div>
      )}
    </div>
  );
}
```

**Key Features of useDebugTools**:
- Authentication status verification
- API connection testing
- Mock data toggling
- Detailed debug information display
- Useful during development and troubleshooting

### Combining Custom Hooks

These hooks can be used together to build complex features:

```tsx
function AdminSubmissionPage() {
  const { token } = useAuth(); // Authentication hook
  
  // Submission management functionality
  const submissionTools = useSubmissions(false);
  
  // Debug tools
  const debugTools = useDebugTools(token, submissionTools.selectedIssue);
  
  // Connect the hooks
  useEffect(() => {
    // Sync mock data state between hooks
    if (submissionTools.useMockData !== debugTools.useMockData) {
      // Handle synchronization...
    }
  }, [debugTools.useMockData, submissionTools.useMockData]);
  
  return (
    <div>
      {/* Render your UI using the hooks... */}
    </div>
  );
}
```

## 测试

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

## 部署

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

## 常见问题

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

## 常见UI模式

### Working with UI Components

### Using the Thumbnail Component

The Thumbnail component is designed for optimized image display through Next.js Image:

```tsx
import { Thumbnail } from '@/components/ui/Thumbnail';

// Basic usage
<Thumbnail 
  src="/path/to/image.jpg"
  alt="Description of the image"
  width={200}
  height={150}
/>

// With rounded corners and aspect ratio
<Thumbnail 
  src="/path/to/image.jpg"
  alt="Description of the image"
  rounded
  aspectRatio="video"
  fill
/>

// As a user avatar
<Thumbnail 
  src={user.avatarUrl}
  alt={user.nickname}
  width={40}
  height={40}
  rounded
/>
```

### Using the Link Component

The Link component provides consistent styling and behavior for navigation:

```tsx
import { Link } from '@/components/ui/Link';

// Default link style
<Link href="/gallery">
  View Gallery
</Link>

// Navigation link style
<Link href="/submit" variant="nav">
  Submit Photo
</Link>

// Button-like link
<Link href="/signup" variant="button">
  Sign Up
</Link>

// External link (opens in new tab)
<Link href="https://example.com" external>
  External Resource
</Link>
```

### Using the Pagination Component

The Pagination component helps with navigating through multi-page content:

```tsx
import { Pagination } from '@/components/ui/Pagination';
import { useState } from 'react';

function MyListPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 10;
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Fetch data for the new page
    fetchData(page);
  };
  
  return (
    <div>
      {/* Your list content here */}
      
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
```

### Working with Submission Components

#### Using the SubmissionCard Component

The SubmissionCard component displays a single submission with its details:

```tsx
import { SubmissionCard } from '@/components/submission/SubmissionCard';
import { Submission } from '@/types/submission';

// Example submission data
const submission: Submission = {
  id: 1,
  description: "My beautiful photo\nTaken in Munich",
  imageUrl: "/images/photo1.jpg",
  submittedAt: "2023-10-15T14:30:00Z",
  status: "APPROVED",
  voteCount: 12,
  isCover: false,
  issue: { id: 3, name: "October 2023" }
};

// In your component
function SubmissionsPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <SubmissionCard submission={submission} />
      {/* More submission cards... */}
    </div>
  );
}
```

#### Using the ImageGrid Component

The ImageGrid component creates a responsive grid of image submissions:

```tsx
import { ImageGrid } from '@/components/submission/ImageGrid';

function GalleryPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  
  // Fetch submissions...
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Photo Gallery</h1>
      
      <ImageGrid 
        submissions={submissions}
        columns={4}
        gap={4}
        aspectRatio="video"
      />
    </div>
  );
}
```

#### Using the ImageViewer Component

The ImageViewer component can be used to display full-size images:

```tsx
import { ImageViewer } from '@/components/submission/ImageViewer';

function PhotoDetailPage() {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const photoData = {
    imageUrl: "/images/large-photo.jpg",
    description: "A detailed description of this photo"
  };
  
  return (
    <div>
      <button onClick={() => setIsViewerOpen(true)}>
        View Full Size
      </button>
      
      <ImageViewer
        imageUrl={photoData.imageUrl}
        description={photoData.description}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
      />
    </div>
  );
}
```

### Admin Components Usage

#### Implementing the Submission Management Table

The SubmissionTable component provides a comprehensive interface for managing submissions:

```tsx
import { SubmissionTable } from '@/components/admin/submissions/SubmissionTable';
import { AdminSubmissionResponse } from '@/types/submission';

function AdminPage() {
  const [submissions, setSubmissions] = useState<AdminSubmissionResponse[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  // Fetch admin submissions...
  
  const handleViewSubmission = (submission: AdminSubmissionResponse) => {
    // Open image viewer or go to detail page
  };
  
  const handleSubmissionAction = async (
    submissionId: number, 
    action: 'approve' | 'reject' | 'select'
  ) => {
    setActionLoading(submissionId);
    
    try {
      // Call API to perform the action
      await updateSubmissionStatus(submissionId, action);
      
      // Update local state to reflect the change
      setSubmissions(currentSubmissions => 
        currentSubmissions.map(sub => 
          sub.id === submissionId 
            ? { ...sub, status: action.toUpperCase() } 
            : sub
        )
      );
    } catch (error) {
      console.error(`Error performing ${action} action:`, error);
    } finally {
      setActionLoading(null);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Submission Management</h1>
      
      <SubmissionTable
        submissions={submissions}
        onViewSubmission={handleViewSubmission}
        onAction={handleSubmissionAction}
        actionLoading={actionLoading}
      />
    </div>
  );
}
```

#### Using the Issue Selector

The IssueSelector component allows filtering submissions by issue:

```tsx
import { IssueSelector } from '@/components/admin/submissions/IssueSelector';

function AdminSubmissionsPage() {
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  
  // Fetch issues...
  
  useEffect(() => {
    if (selectedIssue) {
      // Fetch submissions for the selected issue
      fetchSubmissionsByIssue(selectedIssue.id);
    }
  }, [selectedIssue]);
  
  return (
    <div>
      <IssueSelector
        issues={issues}
        selectedIssue={selectedIssue}
        onIssueChange={setSelectedIssue}
      />
      
      {/* Submission table or other content */}
    </div>
  );
}
```

#### Managing Loading and Error States

Proper handling of loading and error states improves user experience:

```tsx
import { LoadingState, ErrorState } from '@/components/admin/submissions/LoadingErrorStates';

function DataFetchingComponent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState([]);
  
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchFromApi();
      setData(result);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  return (
    <div>
      {loading && <LoadingState />}
      
      {error && (
        <ErrorState
          message={error}
          onRetry={fetchData}
          onUseMockData={() => setData(mockData)}
          showMockDataOption={true}
        />
      )}
      
      {!loading && !error && data.length > 0 && (
        /* Render your data */
      )}
    </div>
  );
}
```

## 自定义Hooks

The application includes several custom hooks to abstract and reuse common functionalities.

### Authentication Hooks

#### useAuth Hook

The `useAuth` hook provides authentication functionality through React Context:

```tsx
import { useAuth } from '@/context/AuthContext';

function ProfilePage() {
  const { 
    user,          // Current user object or null if not logged in
    token,         // JWT token or null if not logged in
    loading,       // Loading state while checking authentication
    login,         // Function to log user in
    logout         // Function to log user out
  } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <div>Please log in to view this page.</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {user.nickname}!</h1>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      
      {user.avatarUrl && (
        <img src={user.avatarUrl} alt={user.nickname} />
      )}
      
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

**Key Features of useAuth**:
- Provides user information and authentication state
- Manages JWT token storage in localStorage
- Handles login and logout operations
- Fetches user data from API upon authentication
- Manages loading state during authentication checks

**Using Protected Routes**:

```tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user || user.role !== 'admin') {
    return null; // Will redirect in the effect
  }
  
  return (
    <div>
      <h1>Admin Dashboard</h1>
      {/* Admin content */}
    </div>
  );
}
```

**Making Authenticated API Requests**:

```tsx
import { useAuth } from '@/context/AuthContext';

function DataFetchingComponent() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  
  const fetchProtectedData = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/protected-endpoint', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  
  useEffect(() => {
    fetchProtectedData();
  }, [token]);
  
  return (
    <div>
      {/* Render your data */}
    </div>
  );
}
```

### Submission Management Hooks

#### useSubmissions Hook

The `useSubmissions` hook provides comprehensive functionality for managing submission data and operations:

```tsx
import { useSubmissions } from '@/hooks/useSubmissions';

function SubmissionManagementPage() {
  // Initialize the hook with optional mock data flag
  const {
    issues,                 // List of available issues
    selectedIssue,          // Currently selected issue ID
    setSelectedIssue,       // Function to change selected issue
    submissions,            // List of submissions for selected issue
    loading,                // Loading state
    error,                  // Error state
    actionLoading,          // ID of submission with pending action
    viewingSubmission,      // Currently viewing submission
    setViewingSubmission,   // Function to set viewing submission
    handleSubmissionAction, // Function to handle approval/rejection
    retryLoadSubmissions    // Function to retry loading submissions
  } = useSubmissions(false); // Set to true to use mock data
  
  return (
    <div>
      {/* Issue selector */}
      <select 
        value={selectedIssue || ''} 
        onChange={e => setSelectedIssue(Number(e.target.value))}
      >
        {issues.map(issue => (
          <option key={issue.id} value={issue.id}>
            {issue.title}
          </option>
        ))}
      </select>
      
      {/* Loading and error states */}
      {loading && <div>Loading submissions...</div>}
      {error && (
        <div>
          <p>{error}</p>
          <button onClick={retryLoadSubmissions}>Retry</button>
        </div>
      )}
      
      {/* Display submissions */}
      {!loading && !error && submissions.map(submission => (
        <div key={submission.id}>
          <h3>{submission.description}</h3>
          <img 
            src={submission.imageUrl} 
            alt={submission.description}
            onClick={() => setViewingSubmission(submission)}
          />
          
          {/* Action buttons */}
          <div>
            <button 
              onClick={() => handleSubmissionAction(submission.id, 'approve')}
              disabled={actionLoading === submission.id}
            >
              Approve
            </button>
            <button 
              onClick={() => handleSubmissionAction(submission.id, 'reject')}
              disabled={actionLoading === submission.id}
            >
              Reject
            </button>
            <button 
              onClick={() => handleSubmissionAction(submission.id, 'select')}
              disabled={actionLoading === submission.id}
            >
              Select
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Key Features of useSubmissions**:
- Loads issues and automatically selects the first one
- Loads submissions for the selected issue
- Handles API calls for approval, rejection, and selection
- Manages loading and error states
- Supports mock data for development and testing
- Handles viewing a specific submission in detail

### useDebugTools Hook

The `useDebugTools` hook provides developer tools for debugging authentication and API calls:

```tsx
import { useDebugTools } from '@/hooks/useDebugTools';

function DebugComponent() {
  const {
    showDebugInfo,      // State for showing debug info panel
    setShowDebugInfo,   // Toggle debug info panel
    apiTestResult,      // Result of API test
    setApiTestResult,   // Set API test result
    useMockData,        // Whether to use mock data
    debugInfo,          // Debug information object
    checkAuthStatus,    // Function to check auth status
    testApiConnection,  // Function to test API connection
    toggleMockData      // Function to toggle mock data
  } = useDebugTools(token, selectedIssue);
  
  return (
    <div>
      <div className="debug-toolbar">
        <button onClick={checkAuthStatus}>
          Check Auth Status
        </button>
        
        <button onClick={testApiConnection}>
          Test API Connection
        </button>
        
        <button onClick={toggleMockData}>
          {useMockData ? 'Use Real Data' : 'Use Mock Data'}
        </button>
      </div>
      
      {/* Debug info panel */}
      {showDebugInfo && (
        <div className="debug-panel">
          <h3>Debug Information</h3>
          <p>User logged in: {debugInfo.userLoggedIn ? 'Yes' : 'No'}</p>
          <p>User role: {debugInfo.userRole}</p>
          <p>Token in context: {debugInfo.tokenInContext ? 'Yes' : 'No'}</p>
          <p>Token in storage: {debugInfo.tokenInStorage ? 'Yes' : 'No'}</p>
          <p>Token preview: {debugInfo.tokenPreview}</p>
          
          <button onClick={() => setShowDebugInfo(false)}>Close</button>
        </div>
      )}
      
      {/* API test result panel */}
      {apiTestResult && (
        <div className="api-test-panel">
          <h3>API Test Result</h3>
          <pre>{apiTestResult}</pre>
          
          <button onClick={() => setApiTestResult(null)}>Close</button>
        </div>
      )}
    </div>
  );
}
```

**Key Features of useDebugTools**:
- Authentication status verification
- API connection testing
- Mock data toggling
- Detailed debug information display
- Useful during development and troubleshooting

### Combining Custom Hooks

These hooks can be used together to build complex features:

```tsx
function AdminSubmissionPage() {
  const { token } = useAuth(); // Authentication hook
  
  // Submission management functionality
  const submissionTools = useSubmissions(false);
  
  // Debug tools
  const debugTools = useDebugTools(token, submissionTools.selectedIssue);
  
  // Connect the hooks
  useEffect(() => {
    // Sync mock data state between hooks
    if (submissionTools.useMockData !== debugTools.useMockData) {
      // Handle synchronization...
    }
  }, [debugTools.useMockData, submissionTools.useMockData]);
  
  return (
    <div>
      {/* Render your UI using the hooks... */}
    </div>
  );
}
```

## 结论

本指南提供了开发Munich Weekly前端应用程序的基础知识。通过遵循这些指南，您将保持一致性和最佳实践。

有关更多详细信息，请参考：
- [UI Component Library](./ui-components.md)
- [Frontend Architecture](./frontend-architecture.md) 