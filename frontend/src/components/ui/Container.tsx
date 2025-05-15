import React from 'react';
import { getContainerStyles } from '@/styles/components/container';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  variant?: 'default' | 'narrow' | 'wide' | 'fluid';
}

/**
 * Standard container component providing consistent page width and margins
 */
export function Container({
  children,
  className,
  as: Component = 'div',
  variant = 'default',
  ...props
}: ContainerProps) {
  return (
    <Component
      className={getContainerStyles({
        variant,
        className
      })}
      {...props}
    >
      {children}
    </Component>
  );
} 