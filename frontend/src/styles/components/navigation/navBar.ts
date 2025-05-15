/**
 * Navigation bar component styles
 * Defines styles for main navigation and mobile navigation
 */

import { cn } from '@/lib/utils';

/**
 * Main navigation container styles
 */
export const navContainerVariants = {
  main: 'sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100',
  transparent: 'sticky top-0 z-50 bg-transparent',
  colored: 'sticky top-0 z-50 bg-blue-600 text-white',
};

/**
 * Navigation link variants
 */
export const navLinkVariants = {
  default: 'text-base text-gray-600 hover:text-black whitespace-nowrap font-medium',
  active: 'text-black font-semibold',
  light: 'text-base text-white/80 hover:text-white whitespace-nowrap font-medium',
  lightActive: 'text-white font-semibold',
};

/**
 * User menu variants
 */
export const userMenuVariants = {
  container: 'relative',
  trigger: 'flex items-center gap-2',
  dropdown: 'absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200',
  item: 'block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100',
  separator: 'border-t border-gray-100 my-1',
  logout: 'block px-4 py-2 text-sm text-red-500 hover:bg-gray-100 w-full text-left',
};

/**
 * Mobile navigation variants
 */
export const mobileNavVariants = {
  toggle: 'p-2 text-gray-600 focus:outline-none',
  overlay: 'fixed inset-0 bg-black bg-opacity-50 z-50',
  container: 'absolute right-0 top-0 bottom-0 w-64 bg-white shadow-xl p-5 overflow-y-auto',
  userInfo: 'pb-4 mb-4 border-b border-gray-200',
  userProfile: 'flex items-center gap-3 mb-4',
  avatar: 'w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden',
  navItem: 'block py-2 text-gray-600 hover:text-black',
  navItemActive: 'block px-3 py-2 rounded-md text-base font-medium bg-gray-100 text-black',
  closeButton: 'absolute top-4 right-4 text-gray-500 hover:text-black',
};

/**
 * Get navigation container styles
 */
export function getNavContainerStyles({
  variant = 'main',
  className,
}: {
  variant?: keyof typeof navContainerVariants;
  className?: string;
} = {}) {
  return cn(
    navContainerVariants[variant],
    className
  );
}

/**
 * Get navigation link styles
 */
export function getNavLinkStyles({
  isActive = false,
  isLight = false,
  className,
}: {
  isActive?: boolean;
  isLight?: boolean;
  className?: string;
} = {}) {
  return cn(
    isLight 
      ? (isActive ? navLinkVariants.lightActive : navLinkVariants.light)
      : (isActive ? navLinkVariants.active : navLinkVariants.default),
    className
  );
}

/**
 * Get user menu styles
 */
export function getUserMenuStyles(
  element: keyof typeof userMenuVariants,
  className?: string
) {
  return cn(
    userMenuVariants[element],
    className
  );
}

/**
 * Get mobile navigation styles
 */
export function getMobileNavStyles(
  element: keyof typeof mobileNavVariants,
  className?: string
) {
  return cn(
    mobileNavVariants[element],
    className
  );
} 