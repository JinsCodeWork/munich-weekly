/**
 * Promotion Page Not Found
 * Custom 404 page for invalid promotion URLs
 */

import React from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

export default function PromotionNotFound() {
  return (
    <Container className="py-8" spacing="standard">
      <div className="text-center py-16">
        <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
          {/* 404 Icon */}
          <div className="relative">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-12 h-12 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" 
                />
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-sm font-bold">!</span>
            </div>
          </div>

          {/* Error Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Promotion Page Not Found
            </h1>
            <p className="text-gray-600">
              The promotion page you&apos;re looking for doesn&apos;t exist or is no longer available.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Link href="/" className="flex-1">
              <Button variant="primary" size="md" className="w-full">
                Go to Homepage
              </Button>
            </Link>
            <Link href="/gallery" className="flex-1">
              <Button variant="outline" size="md" className="w-full">
                Browse Gallery
              </Button>
            </Link>
          </div>

          {/* Additional Help */}
          <div className="text-sm text-gray-500 pt-4 border-t border-gray-200 w-full">
            <p>
              If you believe this is an error, please{' '}
              <Link href="/about" className="text-blue-600 hover:text-blue-800 underline">
                contact us
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
} 