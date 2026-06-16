'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { useAuth } from '@/context/AuthContext';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { IssueSelector } from '@/components/ui/IssueSelector';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { LoadingErrorStates } from '@/components/ui/LoadingErrorStates';
import { useIssues } from '@/hooks/useIssues';
import { useFileUpload } from '@/hooks/useFileUpload';
import { getFormContainerStyles } from '@/styles';
import { cn } from '@/lib/utils';
import { Issue } from '@/types/submission';
import { createAnonymousSubmission, createSubmission, uploadAnonymousSubmissionFile } from '@/api/submissions';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

/** Max photo description length on `/submit` (must stay in sync with backend). */
const MAX_PHOTO_DESCRIPTION_LENGTH = 2000;

/**
 * Submission Page
 * Allows users to submit photos to active issues
 */
export default function SubmitPage() {
  const router = useRouter();
  const { user, loading, openLogin } = useAuth();
  const { activeIssues, isLoading, error: issuesError, fetchIssues } = useIssues();
  const { file, handleFileSelect, error: fileError, uploadFileWithFetch } = useFileUpload();

  // State for workflow steps
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [initialAuthCheckDone, setInitialAuthCheckDone] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isAnonymousMode, setIsAnonymousMode] = useState(false);
  const [isLoginFlow, setIsLoginFlow] = useState(false);
  const [anonymousContactEmail, setAnonymousContactEmail] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [acceptedPrivacyPolicy, setAcceptedPrivacyPolicy] = useState(false);

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // Initial auth check and modal setup
  useEffect(() => {
    if (!loading) {
      const timer = window.setTimeout(() => {
        if (!user) {
          setShowInfoModal(true);
        }
        setInitialAuthCheckDone(true);
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [user, loading]);

  // Redirect to home if info modal is closed and user is not continuing anonymously
  useEffect(() => {
    if (initialAuthCheckDone && !loading && !user && !showInfoModal && !isAnonymousMode && !isLoginFlow) {
      router.push('/');
    }
  }, [user, loading, showInfoModal, router, initialAuthCheckDone, isAnonymousMode, isLoginFlow]);

  useEffect(() => {
    if (!isAnonymousMode || !turnstileReady || !turnstileSiteKey || !window.turnstile) {
      return;
    }

    const container = document.getElementById('anonymous-turnstile');
    if (!container || container.childElementCount > 0) {
      return;
    }

    const widgetId = window.turnstile.render(container, {
      sitekey: turnstileSiteKey,
      callback: setCaptchaToken,
      'expired-callback': () => setCaptchaToken(''),
      'error-callback': () => setCaptchaToken('')
    });
    turnstileWidgetIdRef.current = widgetId;
  }, [isAnonymousMode, turnstileReady, turnstileSiteKey, file]);

  // Handle login button click - show login modal and hide info modal
  const handleLoginClick = () => {
    setIsLoginFlow(true);
    setShowInfoModal(false); // Hide the info modal first
    openLogin(); // Use global login modal
  };

  // Handle close info modal
  const handleCloseInfoModal = () => {
    setShowInfoModal(false);
    router.push('/');
  };

  const handleAnonymousClick = () => {
    setIsAnonymousMode(true);
    setShowInfoModal(false);
  };

  const resetAnonymousCaptcha = () => {
    setCaptchaToken('');
    if (turnstileWidgetIdRef.current && window.turnstile) {
      window.turnstile.reset(turnstileWidgetIdRef.current);
    }
  };

  // 上传逻辑：先创建submission，再上传图片
  const handleSubmit = async () => {
    if (!selectedIssue || !description.trim() || !file) {
      setSubmitError("Please select an issue, upload a photo and add a description");
      return;
    }

    // 验证描述长度
    if (description.trim().length > MAX_PHOTO_DESCRIPTION_LENGTH) {
      setSubmitError(`Description must be ${MAX_PHOTO_DESCRIPTION_LENGTH} characters or less`);
      return;
    }

    if (!acceptedPrivacyPolicy) {
      setSubmitError("Please confirm that you agree to the Privacy Policy before submitting");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (isAnonymousMode && !user) {
        if (!captchaToken) {
          setSubmitError("Please complete the verification before submitting anonymously");
          return;
        }

        const res = await createAnonymousSubmission({
          issueId: selectedIssue.id,
          description: description.trim(),
          contactEmail: anonymousContactEmail.trim() || undefined,
          captchaToken
        });
        const anonymousUpload = await uploadAnonymousSubmissionFile(res.uploadUrl, res.uploadToken, file);
        if (anonymousUpload.success !== true || !anonymousUpload.imageUrl.trim()) {
          throw new Error('Upload did not complete successfully');
        }
      } else {
        const res = await createSubmission({
          issueId: selectedIssue.id,
          description: description.trim()
        });
        const authUpload = await uploadFileWithFetch(res.uploadUrl);
        if (authUpload.success !== true || !authUpload.imageUrl.trim()) {
          throw new Error('Upload did not complete successfully');
        }
      }

      // 3. Set success state
      setSubmissionSuccess(true);

      if (!isAnonymousMode || user) {
        setTimeout(() => {
          const currentToken = localStorage.getItem("jwt");
          if (currentToken) {
            sessionStorage.setItem("preserve_auth", "true");
            window.location.href = '/account/submissions';
          } else {
            router.push('/account/submissions');
          }
        }, 1500);
      }

    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "An unknown error occurred during submission");
      if (isAnonymousMode && !user) {
        resetAnonymousCaptcha();
      }
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

  if (!user && !isAnonymousMode && isLoginFlow) {
    return (
      <Container className="py-8">
        <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h1 className="font-heading text-2xl font-bold mb-4">Continue Your Submission</h1>
          <p className="font-sans text-gray-600 mb-6">
            Log in to manage your submissions later, or continue anonymously without a submission history.
          </p>
          <div className="space-y-3">
            <Button onClick={openLogin} className="w-full">
              Log In to Continue
            </Button>
            <Button onClick={handleAnonymousClick} variant="secondary" className="w-full">
              Continue Anonymously
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  // For unauthenticated users, ask whether they want to log in or continue anonymously.
  if (!user && !isAnonymousMode) {
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
            <h3 className="font-heading text-3xl font-bold text-white mb-8 tracking-wider animate-fadeIn opacity-0" style={{ animationDelay: "0.1s" }}>
              Share Your Perspective
            </h3>

            <p className="font-sans text-white text-center mb-8 animate-fadeIn opacity-0" style={{ animationDelay: "0.2s" }}>
              Ready to share your unique view of the world? Log in to manage your submissions, or continue anonymously.
            </p>

            <button
              onClick={handleLoginClick}
              className={cn(
                "font-sans w-full max-w-xs py-4 rounded-full text-lg font-semibold tracking-wide transition-colors",
                "animate-fadeIn opacity-0 bg-white text-gray-900 hover:bg-gray-200",
                "shadow-md shadow-white/20"
              )}
              style={{ animationDelay: "0.3s" }}
            >
              Log In to Continue
            </button>

            <button
              onClick={handleAnonymousClick}
              className={cn(
                "font-sans w-full max-w-xs py-4 mt-4 rounded-full text-lg font-semibold tracking-wide transition-colors",
                "animate-fadeIn opacity-0 border border-white/60 text-white hover:bg-white/10",
                "shadow-md shadow-black/20"
              )}
              style={{ animationDelay: "0.4s" }}
            >
              Continue Anonymously
            </button>
          </div>
        </Modal>

        {/* Invisible wrapper to keep modals mounted */}
        <div className="fixed inset-0 pointer-events-none" aria-hidden="true"></div>
      </>
    );
  }

  return (
    <Container className="py-8">
      {isAnonymousMode && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
          onLoad={() => setTurnstileReady(true)}
          onReady={() => setTurnstileReady(true)}
        />
      )}
      <div className="max-w-3xl mx-auto">
        <h1 className="font-heading text-2xl font-bold mb-6">Submit Your Photo</h1>
        {isAnonymousMode && !user && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-6">
            <p className="font-sans text-sm">
              You are submitting anonymously. You will not be able to view or edit this submission later.
            </p>
          </div>
        )}

        {/* Success message */}
        {submissionSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div className="ml-3">
                <p className="font-sans text-sm font-medium">
                  {isAnonymousMode && !user
                    ? 'Your anonymous submission has been received and is pending review.'
                    : 'Your photo has been submitted successfully!'}
                </p>
                {(!isAnonymousMode || user) && (
                  <p className="font-sans text-sm mt-1">
                    Redirecting to your submissions...
                  </p>
                )}
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
          hideEmptyStateIcon={true}
        />

        {/* Main submission flow */}
        {!isLoading && !issuesError && activeIssues.length > 0 && !submissionSuccess && (
          <div className="space-y-8">
            {/* Step 1: Select an issue */}
            <div className={getFormContainerStyles()}>
              <h2 className="font-heading text-lg font-medium mb-4">Step 1: Select an Issue</h2>
              <IssueSelector
                issues={activeIssues}
                selectedIssue={selectedIssue}
                onSelectIssue={setSelectedIssue}
              />
            </div>

            {/* Step 2: Upload Photo - Always display, regardless of whether image has been uploaded */}
            {selectedIssue && (
              <div className={getFormContainerStyles()}>
                <h2 className="font-heading text-lg font-medium mb-4">Step 2: Upload Photo</h2>
                <ImageUploader
                  onFileSelected={handleFileSelect}
                  file={file}
                />

                {/* Display error message */}
                {getDisplayError() && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                    <p className="font-sans text-sm">
                      {getDisplayError()}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Add description */}
            {file && (
              <div className="mt-6">
                <h2 className="font-heading text-lg font-medium mb-4">Step 3: Add Description</h2>
                <div className="mb-4">
                  <label className="font-heading block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    maxLength={MAX_PHOTO_DESCRIPTION_LENGTH}
                    className="font-sans block w-full rounded-md border border-gray-300 focus:border-gray-500 focus:ring focus:ring-gray-500 focus:ring-opacity-50"
                    placeholder="Tell us about your photo..."
                  />
                  <div className="flex justify-between mt-2">
                    <p className="font-sans text-sm text-gray-500">
                      Max {MAX_PHOTO_DESCRIPTION_LENGTH} characters. Tell us about your photo.
                    </p>
                    <p className="font-sans text-sm text-gray-500">
                      {description.length}/{MAX_PHOTO_DESCRIPTION_LENGTH}
                    </p>
                  </div>
                </div>

                {isAnonymousMode && !user && (
                  <div className="mb-4 space-y-4">
                    <div>
                      <label className="font-heading block text-sm font-medium text-gray-700 mb-1">
                        Contact Email (optional)
                      </label>
                      <input
                        type="email"
                        value={anonymousContactEmail}
                        onChange={(e) => setAnonymousContactEmail(e.target.value)}
                        className="font-sans block w-full rounded-md border border-gray-300 focus:border-gray-500 focus:ring focus:ring-gray-500 focus:ring-opacity-50"
                        placeholder="Only visible to administrators"
                      />
                    </div>

                    <div>
                      <label className="font-heading block text-sm font-medium text-gray-700 mb-2">
                        Verification
                      </label>
                      {turnstileSiteKey ? (
                        <div id="anonymous-turnstile" />
                      ) : (
                        <p className="font-sans text-sm text-red-600">
                          Anonymous submissions require Turnstile to be configured.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <label className="mb-4 flex items-start gap-3 rounded-md border border-gray-200 bg-gray-50 p-4">
                  <input
                    type="checkbox"
                    checked={acceptedPrivacyPolicy}
                    onChange={(e) => setAcceptedPrivacyPolicy(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                  />
                  <span className="font-sans text-sm text-gray-700">
                    I agree to the{' '}
                    <Link
                      href="/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900"
                    >
                      Privacy Policy
                    </Link>
                    , including Munich Weekly&apos;s non-commercial publication and social media display terms.
                  </span>
                </label>

                <Button
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting ||
                    !description.trim() ||
                    (isAnonymousMode && !user && (!turnstileSiteKey || !captchaToken))
                  }
                  className="w-full"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Photo'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Container>
  );
}
