'use client';

import { Container } from '@/components/ui/Container';

export default function GalleryPage() {
  return (
    <Container className="py-8">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">
          Photo Gallery
        </h1>
        <div className="max-w-2xl mx-auto">
          <p className="text-xl text-gray-600 mb-8">
            Featured photography showcase coming soon
          </p>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Coming Soon
            </h2>
            <p className="text-gray-600">
              We are carefully curating a beautiful photo gallery to showcase the finest photography from our community.
              Stay tuned!
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
} 