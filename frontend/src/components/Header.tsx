// components/Header.tsx
import React from 'react';
import { Thumbnail } from '@/components/ui/Thumbnail';
import { Container } from '@/components/ui/Container';
import { 
  getHeaderContainerStyles, 
  getHeaderContentStyles, 
  getHeaderTitleStyles 
} from '@/styles';

/**
 * Header component - Page header with logo and navigation
 */
export default function Header() {
  return (
    <header className={getHeaderContainerStyles()}>
      <Container>
        <div className={getHeaderContentStyles({ variant: 'default' })}>
          {/* Logo and title area */}
          <div className="flex items-center">
            <div className="w-8 h-8 mr-2">
              <Thumbnail 
                src="/logo.svg" 
                alt="Munich Weekly Logo" 
                width={32}
                height={32}
                objectFit="contain"
              />
            </div>
            <div className={getHeaderTitleStyles({ variant: 'default' })}>Munich Weekly</div>
          </div>
          
          {/* Navigation menu */}
          <div className="hidden md:flex space-x-6">
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Gallery</a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Submit</a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Vote</a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">About</a>
          </div>
          
          {/* Login button */}
          <div className="hidden md:block text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
            Login
          </div>
        </div>
      </Container>
    </header>
  );
}