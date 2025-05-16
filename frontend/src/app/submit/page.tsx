'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { IssueSelector } from '@/components/ui/IssueSelector';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { SubmissionForm } from '@/components/ui/SubmissionForm';
import { LoadingErrorStates } from '@/components/ui/LoadingErrorStates';
import { LoginForm } from "@/components/auth/LoginForm";
import { useIssues } from '@/hooks/useIssues';
import { getFormContainerStyles } from '@/styles';
import { cn } from '@/lib/utils';
import { Issue } from '@/types/submission';

/**
 * Submission Page
 * Allows users to submit photos to active issues
 */
export default function SubmitPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { activeIssues, isLoading, error, fetchIssues } = useIssues();
  
  // State for workflow steps
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [initialAuthCheckDone, setInitialAuthCheckDone] = useState(false);

  // Initial auth check and modal setup
  useEffect(() => {
    if (!loading) {
      if (!user) {
        setShowInfoModal(true);
        setIsLoginOpen(false);
      }
      setInitialAuthCheckDone(true);
    }
  }, [user, loading]);

  // Redirect to home if both modals are closed and user is not authenticated
  useEffect(() => {
    if (initialAuthCheckDone && !loading && !user && !showInfoModal && !isLoginOpen) {
      router.push('/');
    }
  }, [user, loading, showInfoModal, isLoginOpen, router, initialAuthCheckDone]);

  // Handle image upload completion
  const handleImageUploaded = (imageUrl: string) => {
    setUploadedImageUrl(imageUrl);
  };
  
  // Handle submission success
  const handleSubmissionSuccess = () => {
    setSubmissionSuccess(true);
  };
  
  // Reset to upload step
  const handleReset = () => {
    setUploadedImageUrl(null);
  };
  
  // Reset entire form
  const handleStartOver = () => {
    setSelectedIssue(null);
    setUploadedImageUrl(null);
    setSubmissionSuccess(false);
  };
  
  // Handle login button click - show login modal and hide info modal
  const handleLoginClick = () => {
    setShowInfoModal(false); // Hide the info modal first
    setIsLoginOpen(true); // Then show login modal
  };
  
  // Handle close login modal
  const handleCloseLogin = () => {
    setIsLoginOpen(false);
    // If user is still not logged in and closed the login modal, redirect to home
    if (!user) {
      router.push('/');
    }
  };
  
  // Handle close info modal
  const handleCloseInfoModal = () => {
    setShowInfoModal(false);
    router.push('/');
  };

  // Show loading state while checking auth
  if (loading || !initialAuthCheckDone) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // For unauthenticated users, only show the modals
  if (!user) {
    return (
      <>
        {/* Info modal with glassmorphism effect */}
        <Modal 
          isOpen={showInfoModal} 
          onClose={handleCloseInfoModal}
          overlayVariant="default"
          contentVariant="dark-glass"
        >
          <div className={cn(
            "backdrop-blur-none border-none rounded-lg",
            "p-8 w-[90vw] max-w-md",
            "flex flex-col items-center"
          )}>
            <h3 className="text-3xl font-bold text-white mb-8 tracking-wider animate-fadeIn opacity-0" style={{ animationDelay: "0.1s" }}>
              Share Your Perspective
            </h3>
            
            <p className="text-white text-center mb-8 animate-fadeIn opacity-0" style={{ animationDelay: "0.2s" }}>
              Ready to share your unique view of the world? Please log in to upload your work.
            </p>
            
            <button
              onClick={handleLoginClick}
              className={cn(
                "w-full max-w-xs py-4 rounded-full text-lg font-semibold tracking-wide transition-colors",
                "animate-fadeIn opacity-0 bg-white text-gray-900 hover:bg-gray-200",
                "shadow-md shadow-white/20"
              )}
              style={{ animationDelay: "0.3s" }}
            >
              Log In to Continue
            </button>
          </div>
        </Modal>
        
        {/* Login form modal */}
        <LoginForm isOpen={isLoginOpen} onClose={handleCloseLogin} />
        
        {/* Invisible wrapper to keep modals mounted */}
        <div className="fixed inset-0 pointer-events-none" aria-hidden="true"></div>
      </>
    );
  }

  // Only authenticated users get past this point
  return (
    <Container className="py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Submit Your Photo</h1>
        
        {/* Success message */}
        {submissionSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fa-solid fa-check-circle text-green-400"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  Your photo has been submitted successfully!
                </p>
                <p className="text-sm mt-1">
                  Redirecting to your submissions...
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading/Error/Empty states */}
        <LoadingErrorStates 
          isLoading={isLoading}
          loadingMessage="Loading available issues..."
          error={error}
          onRetry={fetchIssues}
          emptyState={activeIssues.length === 0 && !isLoading && !error}
          emptyStateMessage="There are no active issues accepting submissions at this time. Please check back later."
          emptyStateIcon="fa-solid fa-calendar-xmark"
        />
        
        {/* Main submission flow */}
        {!isLoading && !error && activeIssues.length > 0 && !submissionSuccess && (
          <div className="space-y-8">
            {/* Step 1: Select an issue */}
            <div className={getFormContainerStyles()}>
              <h2 className="text-lg font-medium mb-4">Step 1: Select an Issue</h2>
              <IssueSelector 
                issues={activeIssues} 
                selectedIssue={selectedIssue}
                onSelectIssue={setSelectedIssue}
              />
            </div>
            
            {/* Step 2: Upload Photo */}
            {selectedIssue && (
              <div className={getFormContainerStyles()}>
                <h2 className="text-lg font-medium mb-4">Step 2: Upload Photo</h2>
                {!uploadedImageUrl ? (
                  <ImageUploader onImageUploaded={handleImageUploaded} />
                ) : (
                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-md">
                    <div className="flex items-center">
                      <i className="fa-solid fa-check-circle text-gray-500 mr-2"></i>
                      <span>Image uploaded successfully</span>
                    </div>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={handleReset}
                    >
                      Choose Another
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Step 3: Add Description and Submit */}
            {selectedIssue && uploadedImageUrl && (
              <div className={getFormContainerStyles()}>
                <h2 className="text-lg font-medium mb-4">Step 3: Add Description</h2>
                <SubmissionForm 
                  issueId={selectedIssue.id}
                  imageUrl={uploadedImageUrl}
                  onSuccess={handleSubmissionSuccess}
                  onReset={handleReset}
                />
              </div>
            )}
          </div>
        )}
        
        {/* Success state with option to submit another */}
        {submissionSuccess && (
          <div className={getFormContainerStyles({ className: "text-center" })}>
            <h2 className="text-lg font-medium mb-4">Thank You for Your Submission!</h2>
            <p className="text-gray-600 mb-6">
              Your photo has been submitted and is awaiting review.
              You will be redirected to your submissions page shortly.
            </p>
            <Button onClick={handleStartOver}>
              Submit Another Photo
            </Button>
          </div>
        )}
      </div>
    </Container>
  );
} 