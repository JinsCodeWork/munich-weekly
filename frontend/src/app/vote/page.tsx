"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Issue, Submission, SubmissionStatus } from '@/types/submission';
import { issuesApi, submissionsApi } from '@/api';
import { MasonrySubmissionCard } from '@/components/submission/MasonrySubmissionCard';
import { MasonryGallery } from '@/components/ui/MasonryGallery';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { CONTAINER_CONFIG } from '@/styles/components/container';

export default function VotePage() {
  const [activeVotingIssue, setActiveVotingIssue] = useState<Issue | null>(null);
  const [previousIssue, setPreviousIssue] = useState<Issue | null>(null);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]); // 所有投稿，不再分页
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'current' | 'previous'>('current'); // View mode state

  // Function to load submissions for a specific issue
  const loadSubmissionsForIssue = useCallback(async (issue: Issue) => {
    try {
      setIsLoading(true);
      const fetchedSubmissions = await submissionsApi.getSubmissionsByIssue(issue.id);
      
      console.log("VotePage: Fetched submissions for issue", issue.id, ":", JSON.stringify(fetchedSubmissions.map(s => ({ id: s.id, status: s.status })), null, 2));

      const submissionsWithIssueData: Submission[] = (fetchedSubmissions || [])
        .map(sub => ({
          ...sub,
          issue: issue,
          status: sub.status as SubmissionStatus, 
        }));
      
      // 直接保存所有投稿，不再进行分页处理
      setAllSubmissions(submissionsWithIssueData);
      
      console.log(`Loaded ${submissionsWithIssueData.length} submissions for issue ${issue.id}`);
    } catch (err) {
      console.error("Error loading submissions for issue:", err);
      setError("Failed to load submissions. Please try again later.");
      setAllSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadVotingData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allIssues = await issuesApi.getAllIssues();
      if (!allIssues || allIssues.length === 0) {
        setIsLoading(false);
        setAllSubmissions([]);
        setActiveVotingIssue(null);
        setPreviousIssue(null);
        return;
      }

      // Sort issues by voting end date in descending order to find the most recent ones
      const sortedIssues = allIssues.sort((a, b) => 
        new Date(b.votingEnd).getTime() - new Date(a.votingEnd).getTime()
      );

      const now = new Date();
      const currentVotingIssue = sortedIssues.find(issue => {
        const votingStart = new Date(issue.votingStart);
        const votingEnd = new Date(issue.votingEnd);
        return votingStart <= now && now <= votingEnd;
      });

      // Find the most recent issue that has completed voting
      const prevIssue = sortedIssues.find(issue => {
        const votingEnd = new Date(issue.votingEnd);
        return votingEnd < now;
      });

      setActiveVotingIssue(currentVotingIssue || null);
      setPreviousIssue(prevIssue || null);

      if (currentVotingIssue) {
        setViewMode('current');
        await loadSubmissionsForIssue(currentVotingIssue);
      } else {
        setAllSubmissions([]);
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error loading voting data:", err);
      setError("Failed to load voting information. Please try again later.");
      setActiveVotingIssue(null);
      setPreviousIssue(null);
      setAllSubmissions([]);
      setIsLoading(false);
    }
  }, [loadSubmissionsForIssue]);

  // Handle switching to previous issue view
  const handleViewPreviousIssue = useCallback(async () => {
    if (!previousIssue) return;
    
    setViewMode('previous');
    await loadSubmissionsForIssue(previousIssue);
  }, [previousIssue, loadSubmissionsForIssue]);

  // Handle returning to current view
  const handleBackToCurrent = useCallback(async () => {
    setViewMode('current');
    if (activeVotingIssue) {
      await loadSubmissionsForIssue(activeVotingIssue);
    } else {
      setAllSubmissions([]);
      setIsLoading(false);
    }
  }, [activeVotingIssue, loadSubmissionsForIssue]);

  useEffect(() => {
    loadVotingData();
  }, [loadVotingData]);

  const handleVoteSuccess = useCallback((submissionId: number, newVoteCount?: number) => {
    console.log(`Vote successful for submission ${submissionId}. Using vote count ${newVoteCount} from server.`);
    
    // 如果后端返回了新的投票计数，使用它；否则使用本地计算（+1）作为后备方案
    setAllSubmissions(prevSubmissions => prevSubmissions.map(sub => {
      if (sub.id === submissionId) {
        // 如果服务器返回了新的投票计数，则使用它，否则递增本地计数
        const updatedVoteCount = newVoteCount !== undefined ? newVoteCount : (sub.voteCount || 0) + 1;
        return { ...sub, voteCount: updatedVoteCount };
      }
      return sub;
    }));
  }, []);
  
  const handleVoteCancelled = useCallback((submissionId: number, newVoteCount?: number) => {
    console.log(`Vote cancelled for submission ${submissionId}. Using vote count ${newVoteCount} from server.`);
    
    // 如果后端返回了新的投票计数，使用它；否则使用本地计算（-1）作为后备方案
    setAllSubmissions(prevSubmissions => prevSubmissions.map(sub => {
      if (sub.id === submissionId) {
        // 如果服务器返回了新的投票计数，则使用它，否则减少本地计数
        const updatedVoteCount = newVoteCount !== undefined ? newVoteCount : Math.max(0, (sub.voteCount || 0) - 1);
        return { ...sub, voteCount: updatedVoteCount };
      }
      return sub;
    }));
  }, []);

  // Handle individual submission click for detail view
  const handleSubmissionClick = useCallback((submission: Submission) => {
    console.log('Submission clicked for detail view:', submission.id);
    // Could implement modal detail view or navigation here
  }, []);

  if (isLoading) {
    return (
      <Container className="py-10 text-center" spacing="standard">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-lg">Loading voting content...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-10 text-center" spacing="standard">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600 text-lg font-medium mb-4">Error</p>
          <p className="text-red-700 mb-4">{error}</p>
          <Button 
            onClick={loadVotingData} 
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            Try Again
          </Button>
        </div>
      </Container>
    );
  }

  if (!activeVotingIssue && !previousIssue) {
    return (
      <Container className="py-10" spacing="standard">
        <div className="text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">No Active Voting Period</h2>
            <p className="text-blue-700 mb-4">
              There are currently no submissions available for voting. Please check back later when a new voting period begins.
            </p>
            <p className="text-blue-600 text-sm">
              Voting periods are announced in advance. Stay tuned for updates!
            </p>
          </div>
        </div>
      </Container>
    );
  }

  if (viewMode === 'current' && !activeVotingIssue) {
    return (
      <Container className="py-10 text-center" spacing="standard">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-yellow-900 mb-4">No Current Voting Period</h2>
          <p className="text-yellow-700 mb-6">
            There is no active voting period right now.
          </p>
          {previousIssue && (
            <Button 
              onClick={handleViewPreviousIssue}
              variant="outline"
              className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
            >
              View Previous Results
            </Button>
          )}
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8" variant="ultrawide" spacing="generous">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="text-center">
          {viewMode === 'current' && activeVotingIssue ? (
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Issue: {activeVotingIssue.title}
              </h1>
              <p className="text-lg text-gray-500 mb-4">
                {activeVotingIssue.description}
              </p>
              <div className="flex justify-center items-center space-x-6 text-sm text-gray-500">
                <span>
                  Voting started: {new Date(activeVotingIssue.votingStart).toLocaleDateString()}
                </span>
                <span>•</span>
                <span>
                  Voting ends: {new Date(activeVotingIssue.votingEnd).toLocaleDateString()}
                </span>
              </div>
              
              {/* Submissions count display */}
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  {allSubmissions.length} submissions available for voting
                </p>
              </div>
              
              {/* View Previous Results Button */}
              {previousIssue && (
                <div className="mt-6">
                  <Button 
                    onClick={handleViewPreviousIssue}
                    variant="outline"
                    className="text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    View Previous Results ({previousIssue.title})
                  </Button>
                </div>
              )}
            </div>
          ) : viewMode === 'previous' && previousIssue ? (
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Issue: {previousIssue.title}
              </h1>
              <p className="text-lg text-gray-500 mb-4">
                {previousIssue.description}
              </p>
              <div className="flex justify-center items-center space-x-6 text-sm text-gray-500 mb-6">
                <span>
                  Voting period: {new Date(previousIssue.votingStart).toLocaleDateString()} - {new Date(previousIssue.votingEnd).toLocaleDateString()}
                </span>
              </div>
              
              {/* Submissions count display */}
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  {allSubmissions.length} submissions from this issue
                </p>
              </div>
              
              {/* Back to Current Button */}
              {activeVotingIssue && (
                <Button 
                  onClick={handleBackToCurrent}
                  variant="primary"
                  className="mr-4"
                >
                  Back to Current Voting
                </Button>
              )}
            </div>
          ) : null}
        </div>

        {allSubmissions.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <p>No submissions available for this issue.</p>
          </div>
        ) : (
          /* Enhanced MasonryGallery with unified layout optimized for voting display */
          <MasonryGallery
            items={allSubmissions}
            getImageUrl={(submission) => submission.imageUrl}
            renderItem={(submission, isWide, aspectRatio) => (
              <MasonrySubmissionCard
                submission={submission}
                isWide={isWide}
                aspectRatio={aspectRatio}
                displayContext={viewMode === "previous" ? "previousResults" : "voteView"}
                onVoteSuccess={viewMode === "current" ? handleVoteSuccess : undefined}
                onVoteCancelled={viewMode === "current" ? handleVoteCancelled : undefined}
                enableHoverEffects={true}
                showWideIndicator={false}
              />
            )}
            onItemClick={handleSubmissionClick}
            config={{
              columnWidth: CONTAINER_CONFIG.voteMasonry.columnWidth,
              gap: CONTAINER_CONFIG.voteMasonry.gap,
              mobileColumns: CONTAINER_CONFIG.voteMasonry.columns.mobile,
              tabletColumns: CONTAINER_CONFIG.voteMasonry.columns.tablet,
              desktopColumns: CONTAINER_CONFIG.voteMasonry.columns.desktop,
            }}
            loadingComponent={
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading submissions...</p>
              </div>
            }
            emptyComponent={
              <div className="text-center text-gray-500 py-10">
                <p>No submissions available for this issue.</p>
              </div>
            }
            errorComponent={(errors, onRetry) => (
              <div className="text-center py-8">
                <div className="text-red-500 mb-4">
                  <p>Failed to load {errors.length} image(s)</p>
                </div>
                <Button onClick={onRetry} variant="secondary" size="sm">
                  Retry Failed Images
                </Button>
              </div>
            )}
          />
        )}
      </div>
    </Container>
  );
} 