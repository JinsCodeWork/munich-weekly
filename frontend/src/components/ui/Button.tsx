import React from 'react';
import { getButtonStyles } from '@/styles/components/button';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Standard button component with multiple style variants
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={getButtonStyles({
        variant,
        size,
        className
      })}
      {...props}
    >
      {children}
    </button>
  );
} 