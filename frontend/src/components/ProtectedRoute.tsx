"use client"

import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { isStorageAvailable } from '@/api'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string // Optional, if provided, user must have this specific role
  fallbackPath?: string // Optional, redirect path, defaults to /login
}

export const ProtectedRoute = ({
  children,
  requiredRole,
  fallbackPath = '/login'
}: ProtectedRouteProps) => {
  const { loading, isAuthenticated, hasRole } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const authenticated = isAuthenticated()
  const hasRequiredRole = !requiredRole || hasRole(requiredRole)

  useEffect(() => {
    // Wait for authentication state to complete loading
    if (!loading) {
      // If user is not logged in, redirect to login page
      if (!authenticated) {
        // Save current URL in session to return after login
        try {
          sessionStorage.setItem('auth_redirect', pathname)
          // Set flag to prevent losing auth state during redirects
          sessionStorage.setItem('preserve_auth', 'true')
        } catch (error) {
          console.error('Unable to save redirect URL:', error)
        }

        // Redirect to login page
        router.push(`${fallbackPath}?redirect=${encodeURIComponent(pathname)}`)
      }
      // If a specific role is required and user doesn't have it
      else if (!hasRequiredRole) {
        // Redirect to forbidden page
        router.push('/403')
      }
    }
  }, [loading, authenticated, hasRequiredRole, router, pathname, fallbackPath])

  // Storage availability warning
  useEffect(() => {
    if (!loading && authenticated && !isStorageAvailable('localStorage')) {
      console.warn('LocalStorage is not available! Authentication state may be lost after page refresh.')
    }
  }, [loading, authenticated])

  // When authentication check is in progress or user doesn't meet criteria, don't render content
  if (loading || !authenticated || !hasRequiredRole) {
    // Display loading state
    return <div className="flex justify-center items-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
    </div>
  }

  // If authentication check passes, render children
  return <>{children}</>
}
