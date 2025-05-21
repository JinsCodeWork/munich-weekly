'use client';

import React from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';

/**
 * About Page Component
 * Provides information about Munich Weekly, its mission, and operations.
 */
export default function AboutPage() {
  return (
    <Container variant="narrow" className="py-12">
      <div className="space-y-10">
        {/* Page Title with Logo */}
        <div className="mb-8">
          <div className="flex items-center justify-center sm:justify-start mb-6">
            <Logo size="lg" showText={false} className="mr-4" />
            <h1 className="font-heading text-4xl font-bold">About Munich Weekly</h1>
          </div>
        </div>
        
        {/* Project Introduction */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl font-semibold mb-2">Project Overview</h2>
          <p>
            Munich Weekly is a non-commercial community platform for local photographers, 
            with a special focus on student work. We aim to showcase creative photography, 
            foster community exchange, and provide exposure to emerging talent.
          </p>
          <p>
            Every week, we run a photography journal activity with a three-stage process: 
            submission of works, community voting, and publication of selected photographs.
          </p>
          <div className="flex items-center mt-4 py-2 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            <p className="text-sm">All publications are also available on WeChat Official Account <span className="font-medium">【慕尼黑学联CSSA】</span></p>
          </div>
        </section>
        
        {/* Project Nature */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl font-semibold mb-2">Independent Development</h2>
          <p>
            This platform is an independently developed project created by photography enthusiast @JinsCodeWork.
            The website, database, API, and frontend are all custom-built and deployed on GitHub.
          </p>
          <div className="mt-4">
            <Link href="https://github.com/JinsCodeWork/munich-weekly" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="md" className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-github">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
                View Project Code
              </Button>
            </Link>
          </div>
        </section>
        
        {/* Content Selection Process */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl font-semibold mb-2">Selection Process</h2>
          <p>
            Each week, we select approximately 10 outstanding works from the submissions to be included in the journal.
          </p>
          <p>
            Our selection process combines public voting results with internal professional review.
            The submission with the highest number of votes will be featured on the cover of the current issue.
          </p>
        </section>
        
        {/* Privacy Policy */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl font-semibold mb-2">Privacy Policy</h2>
          <p>
            We follow data minimization principles and are committed to protecting user privacy.
          </p>
          <div className="mt-4">
            <Link href="/privacy-policy">
              <Button variant="outline" size="md" className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                </svg>
                Munich Weekly Privacy Policy
              </Button>
            </Link>
          </div>
        </section>
        
        {/* Development Status */}
        <section className="space-y-4">
          <h2 className="font-heading text-2xl font-semibold mb-2">Ongoing Development</h2>
          <p>
            The platform is currently in active development, with continuous improvements and new features being added.
            For updates, plans, and code details, please refer to our main GitHub repository.
          </p>
        </section>
      </div>
    </Container>
  );
} 