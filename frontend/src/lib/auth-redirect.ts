/**
 * Authentication redirect utilities
 * Handles redirecting users back to original requested page after successful login
 */

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

/**
 * Get redirect path from URL and session storage
 */
export const getRedirectPath = (): string => {
  try {
    // First check URL query parameters
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const redirectParam = params.get('redirect');
      
      if (redirectParam) {
        return redirectParam;
      }
      
      // If URL param doesn't exist, check session storage
      const storedRedirect = sessionStorage.getItem('auth_redirect');
      if (storedRedirect) {
        // Clear stored redirect after use
        sessionStorage.removeItem('auth_redirect');
        return storedRedirect;
      }
    }
  } catch (error) {
    console.error('Failed to get redirect path:', error);
  }
  
  // Default to homepage
  return '/';
};

/**
 * Redirect function to execute after successful login/registration
 */
export const redirectAfterAuth = (router: AppRouterInstance): void => {
  const redirectPath = getRedirectPath();
  
  // Set flag indicating this is a post-authentication redirect
  // This can prevent losing authentication state during redirects
  try {
    sessionStorage.setItem('preserve_auth', 'true');
  } catch (error) {
    console.error('Unable to set preserve_auth flag:', error);
  }
  
  // Execute redirect
  router.push(redirectPath);
};

/**
 * Check if user is already authenticated and redirect away from login/registration page if so
 */
export const redirectIfAuthenticated = (
  isAuthenticated: boolean, 
  loading: boolean, 
  router: AppRouterInstance,
  redirectTo: string = '/'
): void => {
  if (!loading && isAuthenticated) {
    router.push(redirectTo);
  }
}; 