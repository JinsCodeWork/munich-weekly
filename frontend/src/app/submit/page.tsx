'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { IssueSelector } from '@/components/ui/IssueSelector';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { LoadingErrorStates } from '@/components/ui/LoadingErrorStates';
import { LoginForm } from "@/components/auth/LoginForm";
import { useIssues } from '@/hooks/useIssues';
import { useFileUpload } from '@/hooks/useFileUpload';
import { getFormContainerStyles } from '@/styles';
import { cn } from '@/lib/utils';
import { Issue } from '@/types/submission';
import { createSubmission } from '@/api/submissions';

/**
 * Submission Page
 * Allows users to submit photos to active issues
 */
export default function SubmitPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { activeIssues, isLoading, error: issuesError, fetchIssues } = useIssues();
  const { file, handleFileSelect, error: fileError, isUploading, uploadFileWithFetch } = useFileUpload();
  
  // State for workflow steps
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [initialAuthCheckDone, setInitialAuthCheckDone] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  // 上传逻辑：先创建submission，再上传图片
  const handleSubmit = async () => {
    if (!selectedIssue || !description.trim() || !file) {
      setSubmitError("Please select an issue, upload a photo and add a description");
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // 1. 创建submission
      console.log("Starting submission creation...");
      const res = await createSubmission({
        issueId: selectedIssue.id,
        description: description.trim()
      });
      console.log("Submission created successfully:", res);
      
      // 2. 使用改进的钩子函数上传图片，跟踪进度
      console.log("Starting image upload to:", res.uploadUrl);
      const result = await uploadFileWithFetch(res.uploadUrl);
      console.log("Image uploaded successfully:", result);
      
      // 3. 设置成功状态
      setSubmissionSuccess(true);
      
      // 4. 成功后等待显示成功消息，然后跳转到用户的submissions页面
      setTimeout(() => {
        console.log("Redirecting to my submissions page...");
        
        // 在跳转前确保将token保存在会话存储中，这样即使页面刷新也能保持登录状态
        const currentToken = localStorage.getItem("jwt");
        if (currentToken) {
          sessionStorage.setItem("preserve_auth", "true");
          
          // 使用window.location.href进行完全页面刷新
          window.location.href = '/account/submissions';
        } else {
          // 如果没有token，使用路由器导航（不应该发生这种情况）
          router.push('/account/submissions');
        }
      }, 1500);
      
    } catch (err) {
      console.error("Submission failed:", err);
      setSubmitError(err instanceof Error ? err.message : "An unknown error occurred during submission");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 获取当前显示的错误消息
  const getDisplayError = () => fileError || submitError;

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
          error={issuesError}
          onRetry={fetchIssues}
          emptyState={activeIssues.length === 0 && !isLoading && !issuesError}
          emptyStateMessage="There are no active issues accepting submissions at this time. Please check back later."
          emptyStateIcon="fa-solid fa-calendar-xmark"
        />
        
        {/* Main submission flow */}
        {!isLoading && !issuesError && activeIssues.length > 0 && !submissionSuccess && (
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
            
            {/* Step 2: Upload Photo - 始终显示，不管是否已上传图片 */}
            {selectedIssue && (
              <div className={getFormContainerStyles()}>
                <h2 className="text-lg font-medium mb-4">Step 2: Upload Photo</h2>
                <ImageUploader
                  onFileSelected={handleFileSelect}
                  file={file}
                />
                
                {/* 只有在未上传图片时显示错误消息 */}
                {!file && getDisplayError() && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                    <p className="text-sm">{getDisplayError()}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Step 3: Add Description - 只有在上传图片后显示 */}
            {file && selectedIssue && !submissionSuccess && (
              <div className={getFormContainerStyles()}>
                <h2 className="text-lg font-medium mb-4">Step 3: Add Description</h2>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter your description here..."
                  className={cn(
                    "w-full p-2 border border-gray-300 rounded-md",
                    "focus:outline-none focus:ring-2 focus:ring-primary-500"
                  )}
                />
                
                {/* 显示错误消息 */}
                {getDisplayError() && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                    <p className="text-sm">{getDisplayError()}</p>
                  </div>
                )}
                
                <div className="flex justify-end mt-4">
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting || isUploading || !description.trim()}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Container>
  );
} 