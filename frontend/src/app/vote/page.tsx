"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Issue, Submission, SubmissionStatus } from '@/types/submission';
import { issuesApi, submissionsApi } from '@/api';
import { SubmissionCard } from '@/components/submission/SubmissionCard';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button'; // For potential retry/reload

export default function VotePage() {
  const [activeVotingIssue, setActiveVotingIssue] = useState<Issue | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVotingData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allIssues = await issuesApi.getAllIssues();
      if (!allIssues || allIssues.length === 0) {
        setError("No issues found currently. Please check back later.");
        setIsLoading(false);
        setSubmissions([]);
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
        setSubmissions(submissionsWithIssueData);
      } else {
        setActiveVotingIssue(null);
        setSubmissions([]);
        setError("There are no issues currently open for voting. Please check back later.");
      }
    } catch (err) {
      console.error("Error loading voting data:", err);
      setError("Failed to load voting information. Please try again later.");
      setActiveVotingIssue(null);
      setSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVotingData();
  }, [loadVotingData]);

  const handleVoteSuccess = useCallback((submissionId: number) => {
    console.log(`Vote successful for submission ${submissionId}. Incrementing vote count locally.`);
    setSubmissions(prevSubmissions =>
      prevSubmissions.map(sub =>
        sub.id === submissionId
          ? { ...sub, voteCount: (sub.voteCount || 0) + 1 }
          : sub
      )
    );
    // We could also add a small delay or a toast message here
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

      {submissions.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          <p>No submissions currently available for voting in this issue.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {submissions.map(submission => (
            <div key={submission.id} className="relative">
              <SubmissionCard 
                submission={submission} 
                displayContext="voteView" 
                onVoteSuccess={handleVoteSuccess}
              />
              {/* 
                Future VoteButton will be placed here or inside SubmissionCard.
                For example:
                <div className="absolute bottom-4 right-4 z-20">
                  <VoteButton submissionId={submission.id} />
                </div>
                Or integrated more neatly within the card's content area.
              */}
            </div>
          ))}
        </div>
      )}
    </Container>
  );
} 