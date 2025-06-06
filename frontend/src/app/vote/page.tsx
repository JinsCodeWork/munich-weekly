"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Submission } from '@/types/submission';
import { useIssues } from '@/hooks/useIssues';
import { getSubmissionsByIssue } from '@/api/submissions';
import { MasonryGallery } from '@/components/ui/MasonryGallery';
import { MasonrySubmissionCard } from '@/components/submission/MasonrySubmissionCard';
import { VoteStatusProvider, useVoteStatus } from '@/context/VoteStatusContext';

/**
 * Inner Vote Page Component
 * 
 * Separated to use VoteStatusContext hooks inside the provider.
 * Implements batch vote status checking for optimal performance.
 */
function VotePageContent() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  
  const { issues, isLoading: issueLoading, error: issueError } = useIssues();
  const { batchCheckVoteStatus, isInitialLoading: isLoadingVoteStatus } = useVoteStatus();
  
  // Use ref to track current issue ID to prevent unnecessary re-renders
  const currentIssueIdRef = useRef<number | null>(null);
  
  // Get current issue - only issues within voting period should be shown
  const currentIssue = useMemo(() => {
    const now = new Date();
    
    // Filter issues that are currently in voting period
    const votingIssues = issues.filter(issue => {
      const votingStart = new Date(issue.votingStart);
      const votingEnd = new Date(issue.votingEnd);
      return votingStart <= now && now <= votingEnd;
    });
    
    if (votingIssues.length > 0) {
      return votingIssues[0]; // Return first issue in voting period
    }
    
    return null; // No issues are currently in voting period
  }, [issues]);

  // Load submissions for current issue - removed from useEffect dependencies
  const loadSubmissionsForIssue = useCallback(async (issueId: number) => {
    // Prevent duplicate calls for the same issue
    if (currentIssueIdRef.current === issueId) {
      console.log(`⚠️ VotePage: Skipping duplicate load for issue ${issueId}`);
      return;
    }
    
    currentIssueIdRef.current = issueId;
    setIsLoadingSubmissions(true);
    setSubmissionError(null);
    
    try {
      console.log(`📥 VotePage: Loading submissions for issue ${issueId}`);
      const fetchedSubmissions = await getSubmissionsByIssue(issueId);
      setSubmissions(fetchedSubmissions);
      
      // **MOBILE OPTIMIZATION**: Start vote status check immediately but don't block rendering
      // This allows progressive image loading to work independently
      if (fetchedSubmissions.length > 0) {
        const submissionIds = fetchedSubmissions.map(sub => sub.id);
        console.log(`🔍 VotePage: Starting non-blocking batch vote status check for ${submissionIds.length} submissions`);
        
        // Use setTimeout to ensure submissions render first, then check vote status
        setTimeout(() => {
          batchCheckVoteStatus(submissionIds).catch(error => {
            console.error('Background vote status check failed:', error);
            // Don't show error to user - vote status is optional for viewing
          });
        }, 100); // Small delay to let submissions render first
      }
    } catch (err) {
      console.error('Error loading submissions:', err);
      setSubmissionError(err instanceof Error ? err.message : 'Failed to load submissions');
      setSubmissions([]);
    } finally {
      setIsLoadingSubmissions(false);
    }
  }, [batchCheckVoteStatus]);

  // Load submissions when current issue is available - simplified dependencies
  useEffect(() => {
    if (currentIssue?.id && currentIssue.id !== currentIssueIdRef.current) {
      loadSubmissionsForIssue(currentIssue.id);
    } else if (!issueLoading && !currentIssue) {
      // No current issue and not loading
      currentIssueIdRef.current = null;
      setIsLoadingSubmissions(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIssue?.id, issueLoading]); // Intentionally exclude currentIssue and loadSubmissionsForIssue to prevent infinite loops

  // Stable callback functions with useCallback
  const handleVoteSuccess = useCallback((submissionId: number, newVoteCount?: number) => {
    setSubmissions(prev => prev.map(sub => 
      sub.id === submissionId 
        ? { ...sub, voteCount: newVoteCount !== undefined ? newVoteCount : sub.voteCount }
        : sub
    ));
  }, []);

  const handleVoteCancelled = useCallback((submissionId: number, newVoteCount?: number) => {
    setSubmissions(prev => {
      const updated = prev.map(sub => 
        sub.id === submissionId 
          ? { ...sub, voteCount: newVoteCount !== undefined ? newVoteCount : sub.voteCount }
          : sub
      );
      
      return updated;
    });
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSubmissionClick = useCallback((_submission: Submission) => {
    // Handle submission click if needed
  }, []);

  // Stable functions for MasonryGallery
  const getImageUrl = useCallback((submission: Submission) => submission.imageUrl, []);
  const getSubmissionId = useCallback((submission: Submission) => submission.id, []);

  // **Enhanced render function with progressive loading support**
  const renderSubmissionCard = useCallback((submission: Submission, isWide: boolean, aspectRatio: number, isLoaded: boolean) => (
    <MasonrySubmissionCard
      submission={submission}
      isWide={isWide}
      aspectRatio={aspectRatio}
      displayContext="voteView"
      onVoteSuccess={handleVoteSuccess}
      onVoteCancelled={handleVoteCancelled}
      isImageLoaded={isLoaded}
    />
  ), [handleVoteSuccess, handleVoteCancelled]);

  // Determine overall loading state - prevent flickering by being more specific
  const isOverallLoading = issueLoading || (isLoadingSubmissions && submissions.length === 0);
  
  // **MOBILE OPTIMIZATION**: Only show vote status loader if images are already loaded
  // This prevents vote status loading from blocking progressive image display
  const shouldShowVoteStatusLoader = isLoadingVoteStatus && submissions.length > 0 && !isOverallLoading;

  // Show loading state while checking issues or initially loading submissions
  if (isOverallLoading) {
    return (
      <Container className="py-8" variant="vote">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">
            {issueLoading ? "Loading voting information..." : "Loading submissions..."}
          </p>
        </div>
      </Container>
    );
  }

  // Show error state for issues
  if (issueError) {
    return (
      <Container className="py-8" variant="vote">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <p className="text-lg font-semibold">Failed to load voting information</p>
            <p className="text-sm mt-2">{issueError}</p>
          </div>
        </div>
      </Container>
    );
  }

  // Show error state for submissions
  if (submissionError) {
    return (
      <Container className="py-8" variant="vote">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <p className="text-lg font-semibold">Failed to load submissions</p>
            <p className="text-sm mt-2">{submissionError}</p>
          </div>
        </div>
      </Container>
    );
  }

  // Show no active voting period state
  if (!currentIssue) {
    return (
      <Container className="py-8" variant="vote">
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Voting</h1>
          <p className="text-lg text-gray-600">No active voting period at this time.</p>
          <p className="text-sm text-gray-500 mt-2">Please check back during a voting period.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8" variant="vote">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {currentIssue.title}
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            {currentIssue.description}
          </p>
          <div className="text-sm text-gray-500">
            <p>Voting Period: {new Date(currentIssue.votingStart).toLocaleDateString()} - {new Date(currentIssue.votingEnd).toLocaleDateString()} (CET)</p>
          </div>
          
          {/* Show subtle vote status loading indicator */}
          {shouldShowVoteStatusLoader && (
            <div className="mt-2 text-sm text-gray-500 flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
              Checking vote status...
            </div>
          )}
        </div>

        {/* MasonryGallery with Skyline layout */}
        <MasonryGallery
          issueId={currentIssue.id}
          items={submissions}
          getImageUrl={getImageUrl}
          getSubmissionId={getSubmissionId}
          renderItem={renderSubmissionCard}
          onItemClick={handleSubmissionClick}
          loadingComponent={
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
              <p className="mt-4 text-lg text-gray-600">Loading submissions...</p>
            </div>
          }
          emptyComponent={
            <div className="text-center text-gray-500 py-12">
              <p>No submissions available for voting</p>
            </div>
          }
          errorComponent={(errors, onRetry) => (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <p className="text-lg font-semibold">Failed to load gallery</p>
                {errors.length > 0 && (
                  <p className="text-sm mt-2">{errors[0]}</p>
                )}
              </div>
              <Button onClick={onRetry} variant="secondary">
                Retry
              </Button>
            </div>
          )}
        />
      </div>
    </Container>
  );
}

/**
 * Main Vote Page Component
 * 
 * Wrapped with VoteStatusProvider for optimized vote status management.
 * 
 * Key performance improvements:
 * - Eliminates N individual vote status API calls
 * - Uses batch checking for all submissions at once
 * - Provides global vote status cache
 * - Maintains all existing functionality and appearance
 */
export default function VotePage() {
  return (
    <VoteStatusProvider>
      <VotePageContent />
    </VoteStatusProvider>
  );
} 