"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Issue, Submission, SubmissionStatus } from '@/types/submission';
import { issuesApi, submissionsApi } from '@/api';
import { SubmissionCard } from '@/components/submission/SubmissionCard';
import { MasonryGrid } from '@/components/ui/MasonryGrid';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';

export default function VotePage() {
  const [activeVotingIssue, setActiveVotingIssue] = useState<Issue | null>(null);
  const [previousIssue, setPreviousIssue] = useState<Issue | null>(null);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]); // 所有投稿
  const [displayedSubmissions, setDisplayedSubmissions] = useState<Submission[]>([]); // 当前页显示的投稿
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'current' | 'previous'>('current'); // New state for view mode
  
  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16; // 固定每页显示16个项目
  const [totalPages, setTotalPages] = useState(1);

  // 根据当前页码更新显示的投稿
  const updateDisplayedSubmissions = (submissions: Submission[], page: number, perPage: number) => {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedItems = submissions.slice(startIndex, endIndex);
    setDisplayedSubmissions(paginatedItems);
  };

  // Function to load submissions for a specific issue
  const loadSubmissionsForIssue = useCallback(async (issue: Issue) => {
    try {
      const fetchedSubmissions = await submissionsApi.getSubmissionsByIssue(issue.id);
      
      console.log("VotePage: Fetched submissions for issue", issue.id, ":", JSON.stringify(fetchedSubmissions.map(s => ({ id: s.id, status: s.status })), null, 2));

      const submissionsWithIssueData: Submission[] = (fetchedSubmissions || [])
        .map(sub => ({
          ...sub,
          issue: issue,
          status: sub.status as SubmissionStatus, 
        }));
      
      // 保存所有投稿
      setAllSubmissions(submissionsWithIssueData);
      
      // 计算总页数
      const totalPagesCount = Math.ceil(submissionsWithIssueData.length / itemsPerPage);
      setTotalPages(totalPagesCount);
      
      // 更新当前页的投稿
      updateDisplayedSubmissions(submissionsWithIssueData, 1, itemsPerPage);
      setCurrentPage(1); // Reset to first page when switching issues
    } catch (err) {
      console.error("Error loading submissions for issue:", err);
      setError("Failed to load submissions. Please try again later.");
    }
  }, [itemsPerPage]);

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
        setDisplayedSubmissions([]);
      }
    } catch (err) {
      console.error("Error loading voting data:", err);
      setError("Failed to load voting information. Please try again later.");
      setActiveVotingIssue(null);
      setPreviousIssue(null);
      setAllSubmissions([]);
      setDisplayedSubmissions([]);
    }
    setIsLoading(false);
  }, [loadSubmissionsForIssue]);

  // Handle switching to previous issue view
  const handleViewPreviousIssue = useCallback(async () => {
    if (!previousIssue) return;
    
    setIsLoading(true);
    setViewMode('previous');
    await loadSubmissionsForIssue(previousIssue);
    setIsLoading(false);
  }, [previousIssue, loadSubmissionsForIssue]);

  // Handle returning to current view
  const handleBackToCurrent = useCallback(() => {
    setViewMode('current');
    if (activeVotingIssue) {
      loadSubmissionsForIssue(activeVotingIssue);
    } else {
      setAllSubmissions([]);
      setDisplayedSubmissions([]);
    }
  }, [activeVotingIssue, loadSubmissionsForIssue]);
  
  // 处理页码变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateDisplayedSubmissions(allSubmissions, page, itemsPerPage);
    // 滚动到页面顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    loadVotingData();
  }, [loadVotingData]);

  const handleVoteSuccess = useCallback((submissionId: number, newVoteCount?: number) => {
    console.log(`Vote successful for submission ${submissionId}. Using vote count ${newVoteCount} from server.`);
    
    // 如果后端返回了新的投票计数，使用它；否则使用本地计算（+1）作为后备方案
    const voteUpdateFn = (sub: Submission) => {
      if (sub.id === submissionId) {
        // 如果服务器返回了新的投票计数，则使用它，否则递增本地计数
        const updatedVoteCount = newVoteCount !== undefined ? newVoteCount : (sub.voteCount || 0) + 1;
        return { ...sub, voteCount: updatedVoteCount };
      }
      return sub;
    };

    // 更新所有投稿中的投票计数
    setAllSubmissions(prevSubmissions => prevSubmissions.map(voteUpdateFn));
    
    // 同时更新当前页显示的投稿
    setDisplayedSubmissions(prevSubmissions => prevSubmissions.map(voteUpdateFn));
  }, []);
  
  const handleVoteCancelled = useCallback((submissionId: number, newVoteCount?: number) => {
    console.log(`Vote cancelled for submission ${submissionId}. Using vote count ${newVoteCount} from server.`);
    
    // 如果后端返回了新的投票计数，使用它；否则使用本地计算（-1）作为后备方案
    const voteUpdateFn = (sub: Submission) => {
      if (sub.id === submissionId) {
        // 如果服务器返回了新的投票计数，则使用它，否则减少本地计数
        const updatedVoteCount = newVoteCount !== undefined ? newVoteCount : Math.max(0, (sub.voteCount || 0) - 1);
        return { ...sub, voteCount: updatedVoteCount };
      }
      return sub;
    };

    // 更新所有投稿中的投票计数
    setAllSubmissions(prevSubmissions => prevSubmissions.map(voteUpdateFn));
    
    // 同时更新当前页显示的投稿
    setDisplayedSubmissions(prevSubmissions => prevSubmissions.map(voteUpdateFn));
  }, []);

  if (isLoading) {
    return (
      <Container className="py-10 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-lg">Loading voting content...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-10 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <Button onClick={loadVotingData} variant="secondary">Try Again</Button>
      </Container>
    );
  }

  // Show no current voting period UI
  if (!activeVotingIssue && viewMode === 'current') {
    return (
      <Container className="py-10">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-8 text-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="mx-auto h-12 w-12 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-gray-800">
              No Current Voting Period
            </h2>
            <p className="mt-2 text-gray-600">
              There are no issues currently open for voting.
            </p>
            
            {/* Show button to view previous results if available */}
            {previousIssue ? (
              <div className="mt-6">
                <Button 
                  onClick={handleViewPreviousIssue}
                  variant="primary"
                  size="md"
                  className="mx-auto"
                >
                  View Previous Voting Results
                </Button>
                <p className="mt-2 text-sm text-gray-500">
                  See the results from &quot;{previousIssue.title}&quot;
                </p>
              </div>
            ) : (
              <p className="mt-4 text-gray-500">
                No previous voting results are available at this time.
              </p>
            )}
          </div>
        </div>
      </Container>
    );
  }

  // Determine which issue to display based on view mode
  const displayIssue = viewMode === 'current' ? activeVotingIssue : previousIssue;
  const isViewingPrevious = viewMode === 'previous';

  if (!displayIssue) {
    return (
      <Container className="py-10 text-center">
        <p className="text-gray-500">No issue data available.</p>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      {/* Back button when viewing previous results */}
      {isViewingPrevious && (
        <div className="mb-6">
          <Button 
            onClick={handleBackToCurrent}
            variant="secondary"
            size="sm"
          >
            ← Back to Current
          </Button>
        </div>
      )}

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          {displayIssue.title}
          {isViewingPrevious && (
            <span className="ml-2 text-lg font-medium text-gray-500">
              (Previous Results)
            </span>
          )}
        </h1>
        <p className="mt-2 text-lg text-gray-600">{displayIssue.description}</p>
        <p className="mt-1 text-sm text-gray-500">
          Voting period: {new Date(displayIssue.votingStart).toLocaleDateString()} - {new Date(displayIssue.votingEnd).toLocaleDateString()}
        </p>
        {isViewingPrevious && (
          <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            Voting Completed
          </div>
        )}
      </div>
      
      {allSubmissions.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          <p>No submissions available for this issue.</p>
        </div>
      ) : (
        <>
          <MasonryGrid
            gap={6}
            isLoading={isLoading}
            emptyState={
              <div className="text-center text-gray-500 py-10">
                <p>No submissions available for this issue.</p>
              </div>
            }
          >
            {displayedSubmissions.map(submission => (
              <SubmissionCard 
                key={submission.id}
                submission={submission} 
                displayContext={isViewingPrevious ? "previousResults" : "voteView"}
                onVoteSuccess={!isViewingPrevious ? handleVoteSuccess : undefined}
                onVoteCancelled={!isViewingPrevious ? handleVoteCancelled : undefined}
                layoutMode="masonry"
              />
            ))}
          </MasonryGrid>
          
          {/* Pagination component */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              showFirstLastButtons
              showPageSelector
              maxVisiblePages={5}
              simplifyOnMobile
            />
          )}
        </>
      )}
    </Container>
  );
} 