import React from 'react';
import NextLink from 'next/link';
import { cn } from '@/lib/utils';

interface LinkProps extends React.HTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'nav' | 'button';
  external?: boolean;
}

/**
 * Standard link component that integrates Next.js Link component with consistent styling
 */
export function Link({
  href,
  children,
  className,
  variant = 'default',
  external = false,
  ...props
}: LinkProps) {
  const variantClasses = {
    default: 'text-blue-600 hover:text-blue-800 underline',
    nav: 'text-gray-600 hover:text-black text-sm font-medium no-underline',
    button: 'inline-block px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 no-underline'
  };

  const LinkComponent = external ? 
    ({ children, ...props }: React.HTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode }) => (
      <a target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    ) : NextLink;

  return (
    <LinkComponent
      href={href}
      className={cn(variantClasses[variant], className)}
      {...props}
    >
      {children}
    </LinkComponent>
  );
} 