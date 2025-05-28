import React from 'react';
import { getContainerStyles, responsivePadding } from '@/styles/components/container';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  variant?: 'default' | 'narrow' | 'wide' | 'fluid' | 'ultrawide' | 'minimal' | 'vote';
  spacing?: keyof typeof responsivePadding;
}

/**
 * Enhanced container component providing modern responsive design
 * with flexible spacing and improved UX across all screen sizes
 */
export function Container({
  children,
  className,
  as: Component = 'div',
  variant = 'default',
  spacing,
  ...props
}: ContainerProps) {
  return (
    <Component
      className={getContainerStyles({
        variant,
        spacing,
        className
      })}
      {...props}
    >
      {children}
    </Component>
  );
} 