import { NextResponse } from 'next/server';

// This endpoint has been disabled for security reasons
// All upload functionality should use the backend API endpoints:
// - /api/submissions/admin/upload-hero (for homepage hero image)
// - /api/submissions/{id}/upload (for user submissions)
// - /api/promotion/admin/images/{id}/upload (for promotion images)
export async function POST() {
  console.warn('Attempted access to deprecated/disabled endpoint: /frontend-api/admin/upload');
  
  return NextResponse.json({ 
    error: 'This endpoint has been disabled for security reasons.',
    message: 'Please use the appropriate backend API endpoint instead.',
    alternatives: {
      heroImage: '/api/submissions/admin/upload-hero',
      userSubmission: '/api/submissions/{submissionId}/upload',
      promotionImage: '/api/promotion/admin/images/{imageId}/upload'
    },
    status: 'DEPRECATED'
  }, { status: 410 }); // 410 Gone - indicates the resource is permanently unavailable
} 