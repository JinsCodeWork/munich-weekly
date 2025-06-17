import React from 'react';
import Link from 'next/link';
import { Thumbnail } from '@/components/ui/Thumbnail';
import { Container } from '@/components/ui/Container';
import { 
  getHeaderContainerStyles, 
  getNavLinkStyles
} from '@/styles';

/**
 * Main header component for the application
 * Responsive header with logo, navigation and login controls
 */
export default function MainHeader() {
  return (
    <header className={getHeaderContainerStyles({ variant: 'default' })}>
      <Container className="py-3">
        <div className="grid grid-cols-[200px_1fr_100px] items-center gap-4">
          {/* Logo area */}
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
            <div className="text-xl font-bold tracking-wide">Munich Weekly</div>
          </div>
          
          {/* Navigation menu */}
          <div className="flex">
                            <Link href="/gallery" className={getNavLinkStyles({ className: 'mr-6' })}>Gallery</Link>
            <a href="#" className={getNavLinkStyles({ className: 'mr-6' })}>Submit</a>
            <a href="#" className={getNavLinkStyles({ className: 'mr-6' })}>Vote</a>
            <a href="#" className={getNavLinkStyles({ className: 'mr-6' })}>About</a>
          </div>
          
          {/* Login button */}
          <div className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer text-right">
            Login
          </div>
        </div>
      </Container>
    </header>
  );
} 