'use client';

import React from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';

/**
 * Home page footer component
 */
export function AnimatedFooter() {
  return (
    <footer 
      className="bg-black text-white border-t border-gray-800 w-full"
    >
      <Container className="py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-heading text-lg font-semibold text-white">Contact</h3>
            <div className="flex flex-col space-y-1">
              <div className="flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a 
                  href="mailto:support@munichweekly.art" 
                  className="hover:text-gray-300 transition-colors"
                >
                  support@munichweekly.art
                </a>
                <span className="ml-2 text-xs text-gray-400">(Technical support)</span>
              </div>
              <div className="flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a 
                  href="mailto:contact@munichweekly.art" 
                  className="hover:text-gray-300 transition-colors"
                >
                  contact@munichweekly.art
                </a>
                <span className="ml-2 text-xs text-gray-400">(Inquiries & submissions)</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400">© 2025 Munich Weekly® </span>
            </div>
            <div className="flex space-x-4">
              <Link href="/about" className="text-white hover:text-gray-300 transition-colors text-xs">
                About
              </Link>
              <Link href="/privacy-policy" className="text-white hover:text-gray-300 transition-colors text-xs">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
} 