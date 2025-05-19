"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Issue, Submission, SubmissionStatus } from '@/types/submission';
import { issuesApi, submissionsApi } from '@/api';
import { SubmissionCard } from '@/components/submission/SubmissionCard';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';

export default function VotePage() {
  const [activeVotingIssue, setActiveVotingIssue] = useState<Issue | null>(null);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]); // 所有投稿
  const [displayedSubmissions, setDisplayedSubmissions] = useState<Submission[]>([]); // 当前页显示的投稿
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16; // 固定每页显示16个项目
  const [totalPages, setTotalPages] = useState(1);

  const loadVotingData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allIssues = await issuesApi.getAllIssues();
      if (!allIssues || allIssues.length === 0) {
        setError("No issues found currently. Please check back later.");
        setIsLoading(false);
        setAllSubmissions([]);
        return;
      }

      const now = new Date();
      const currentVotingIssue = allIssues.find(issue => {
        const votingStart = new Date(issue.votingStart);
        const votingEnd = new Date(issue.votingEnd);
        return votingStart <= now && now <= votingEnd;
      });

      if (currentVotingIssue) {
        setActiveVotingIssue(currentVotingIssue);
        const fetchedSubmissions = await submissionsApi.getSubmissionsByIssue(currentVotingIssue.id);
        
        console.log("VotePage: Fetched submissions for issue", currentVotingIssue.id, ":", JSON.stringify(fetchedSubmissions.map(s => ({ id: s.id, status: s.status })), null, 2));

        const submissionsWithIssueData: Submission[] = (fetchedSubmissions || [])
          .map(sub => ({
            ...sub,
            issue: currentVotingIssue,
            status: sub.status as SubmissionStatus, 
          }));
        
        // 保存所有投稿
        setAllSubmissions(submissionsWithIssueData);
        
        // 计算总页数
        const totalPagesCount = Math.ceil(submissionsWithIssueData.length / itemsPerPage);
        setTotalPages(totalPagesCount);
        
        // 更新当前页的投稿
        updateDisplayedSubmissions(submissionsWithIssueData, 1, itemsPerPage);
      } else {
        setActiveVotingIssue(null);
        setAllSubmissions([]);
        setDisplayedSubmissions([]);
        setError("There are no issues currently open for voting. Please check back later.");
      }
    } catch (err) {
      console.error("Error loading voting data:", err);
      setError("Failed to load voting information. Please try again later.");
      setActiveVotingIssue(null);
      setAllSubmissions([]);
      setDisplayedSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [itemsPerPage]);
  
  // 根据当前页码更新显示的投稿
  const updateDisplayedSubmissions = (submissions: Submission[], page: number, perPage: number) => {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedItems = submissions.slice(startIndex, endIndex);
    setDisplayedSubmissions(paginatedItems);
  };
  
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

  if (!activeVotingIssue) {
    return (
      <Container className="py-10 text-center">
        <h1 className="text-2xl font-semibold mb-4">Voting Closed</h1>
        <p className="text-gray-600">There are no issues currently open for voting. Please check back later!</p>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">{activeVotingIssue.title}</h1>
        <p className="mt-2 text-lg text-gray-600">{activeVotingIssue.description}</p>
        <p className="mt-1 text-sm text-gray-500">
          Voting period: {new Date(activeVotingIssue.votingStart).toLocaleDateString()} - {new Date(activeVotingIssue.votingEnd).toLocaleDateString()}
        </p>
      </div>
      
      {allSubmissions.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          <p>No submissions currently available for voting in this issue.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {displayedSubmissions.map(submission => (
              <div key={submission.id} className="relative">
                <SubmissionCard 
                  submission={submission} 
                  displayContext="voteView" 
                  onVoteSuccess={handleVoteSuccess}
                />
              </div>
            ))}
          </div>
          
          {/* 分页组件 */}
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