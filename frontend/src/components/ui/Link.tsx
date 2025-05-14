import React from 'react';
import NextLink from 'next/link';
import { cn } from '@/lib/utils';

interface LinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'nav' | 'button';
  external?: boolean;
  [key: string]: any;
}

/**
 * 标准链接组件，整合Next.js的Link组件，并提供一致的样式
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
    ({ children, ...props }: any) => (
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