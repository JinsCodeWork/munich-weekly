"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Submission } from '@/types/submission';
import { useIssues } from '@/hooks/useIssues';
import { getSubmissionsByIssue } from '@/api/submissions';
import { MasonryGallery } from '@/components/ui/MasonryGallery';
import { MasonrySubmissionCard } from '@/components/submission/MasonrySubmissionCard';

export default function VotePage() {

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [, setIsLoading] = useState(true); // Keep for potential future use
  const [, setError] = useState<string | null>(null); // Keep for potential future use
  
  const { issues, isLoading: issueLoading, error: issueError } = useIssues();
  
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

  // Load submissions for current issue
  const loadSubmissionsForIssue = useCallback(async (issueId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedSubmissions = await getSubmissionsByIssue(issueId);
      setSubmissions(fetchedSubmissions);
    } catch (err) {
      console.error('Error loading submissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load submissions');
      setSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load submissions when current issue is available
  useEffect(() => {
    if (currentIssue?.id) {
      loadSubmissionsForIssue(currentIssue.id);
    }
  }, [currentIssue?.id, loadSubmissionsForIssue]);

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

  // **FIX: Stable render function that only changes when callback dependencies change**
  const renderSubmissionCard = useCallback((submission: Submission, isWide: boolean, aspectRatio: number) => (
    <MasonrySubmissionCard
      submission={submission}
      isWide={isWide}
      aspectRatio={aspectRatio}
      displayContext="voteView"
      onVoteSuccess={handleVoteSuccess}
      onVoteCancelled={handleVoteCancelled}
    />
  ), [handleVoteSuccess, handleVoteCancelled]);

  // Handle loading states
  if (issueLoading) {
    return (
      <Container className="py-8" variant="vote">
        <div className="text-center">
          <p>Loading current issue...</p>
        </div>
      </Container>
    );
  }

  if (issueError) {
    return (
      <Container className="py-8" variant="vote">
        <div className="text-center text-red-600">
          <p>Error loading current issue: {issueError}</p>
        </div>
      </Container>
    );
  }

  if (!currentIssue) {
    return (
      <Container className="py-8" variant="vote">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">No active voting period</p>
          <p className="text-sm text-gray-500">There are currently no issues open for voting. Please check back later.</p>
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
            <p>Voting Period: {new Date(currentIssue.votingStart).toLocaleDateString()} - {new Date(currentIssue.votingEnd).toLocaleDateString()}</p>
          </div>
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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