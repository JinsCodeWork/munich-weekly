import React from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

/**
 * Standard container component providing consistent page width and margins
 */
export function Container({
  children,
  className,
  as: Component = 'div',
  ...props
}: ContainerProps) {
  return (
    <Component
      className={cn(
        'w-full max-w-[1400px] mx-auto px-5 md:px-6', 
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
} 