import React from 'react';
import { Container } from '@/components/ui/Container';

export default function GalleryComingSoon() {
  return (
    <Container className="py-24 text-center">
      <h1 className="text-4xl font-bold mb-4">Gallery Coming Soon</h1>
      <p className="text-lg text-gray-600 mb-8">
        Our gallery will be officially launched after several rounds of submissions are completed in the coming weeks.
      </p>
      <div className="flex justify-center">
        <span className="inline-block px-6 py-3 bg-gray-100 text-gray-500 rounded-full text-base font-medium">
          Stay tuned!
        </span>
      </div>
    </Container>
  );
} 