import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 网站Logo组件，可复用在多个位置
 */
export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const sizes = {
    sm: { logo: 32, fontSize: 'text-base' },
    md: { logo: 40, fontSize: 'text-xl' },
    lg: { logo: 48, fontSize: 'text-2xl' }
  };

  const { logo, fontSize } = sizes[size];

  return (
    <Link href="/" className={cn("flex items-center", className)}>
      <div className="mr-3 flex-shrink-0" style={{ width: `${logo}px`, height: `${logo}px` }}>
        <Image 
          src="/logo.svg" 
          alt="Munich Weekly Logo" 
          width={logo}
          height={logo}
          className="w-full h-full object-contain"
          priority
        />
      </div>
      {showText && (
        <div className={cn(
          fontSize, 
          "font-semibold tracking-tight whitespace-nowrap"
        )}>
          Munich Weekly
        </div>
      )}
    </Link>
  );
}
