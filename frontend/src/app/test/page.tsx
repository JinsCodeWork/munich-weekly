'use client';

import { Container } from '@/components/ui/Container';

export default function TestPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Container className="py-12" spacing="standard">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Enhanced Container System
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Testing the improved responsive container system with modern spacing.
          </p>
        </div>
      </Container>

      <Container variant="default" spacing="standard" className="py-8 bg-white border-y">
        <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-blue-900 mb-3">Default Container - Standard Spacing</h2>
          <p className="text-blue-700">
            Max width: 1400px, Enhanced responsive padding for modern UX
          </p>
        </div>
      </Container>

      <Container variant="narrow" spacing="standard" className="py-8">
        <div className="bg-green-50 border-2 border-dashed border-green-200 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-green-900 mb-3">Narrow Container</h2>
          <p className="text-green-700">
            Max width: 1000px, Perfect for content-focused pages
          </p>
        </div>
      </Container>

      <Container variant="wide" spacing="generous" className="py-8 bg-white border-y">
        <div className="bg-purple-50 border-2 border-dashed border-purple-200 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-purple-900 mb-3">Wide Container - Generous Spacing</h2>
          <p className="text-purple-700">
            Max width: 1600px, Ideal for masonry layouts and wide content
          </p>
        </div>
      </Container>
    </main>
  );
} 