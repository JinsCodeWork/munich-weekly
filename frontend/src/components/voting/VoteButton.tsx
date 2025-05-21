"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { getOrGenerateVisitorId } from '@/lib/visitorId';
import { votesApi } from '@/api'; // Corrected import based on @/api/index.ts
import { ThumbsUp, Loader2, CheckCircle } from 'lucide-react'; // Using lucide-react icons
import { useAuth } from '@/context/AuthContext';

interface VoteButtonProps {
  submissionId: number;
  initialVoteCount?: number; // Optional initial vote count for display
  onVoteSuccess?: (submissionId: number, newVoteCount?: number) => void;
  className?: string;
}

export function VoteButton({ 
  submissionId,
  onVoteSuccess,
  className
}: VoteButtonProps) {
  const { user } = useAuth(); // 获取当前登录用户
  const [isLoading, setIsLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  // const [currentVoteCount, setCurrentVoteCount] = useState(initialVoteCount || 0);

  const checkStatus = useCallback(async () => {
    // 重置状态，因为用户可能变化了
    setHasVoted(null);
    setError(null);
    
    // 确保匿名用户有visitorId
    if (!user) {
      getOrGenerateVisitorId();
    }
    
    setIsLoading(true);
    try {
      const status = await votesApi.checkVoteStatus(submissionId);
      setHasVoted(status.voted);
      console.log(`VoteButton: Checked vote status for submission ${submissionId}, user ${user?.id || 'anonymous'}, status:`, status.voted);
    } catch (err: Error | unknown) {
      console.error(`VoteButton: Failed to check vote status for submissionId: ${submissionId}. Raw Error:`, err);
      if (err instanceof Error) {
        console.error(`VoteButton: Error message:`, err.message);
      }
      setError(`Could not check vote status for ID ${submissionId}.`);
      setHasVoted(false);
    } finally {
      setIsLoading(false);
    }
  }, [submissionId, user]); // 依赖项添加user，用户变化时重新检查

  // 初始化和用户变化时检查投票状态
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleVoteClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (hasVoted === true || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await votesApi.submitVote(submissionId);
      setHasVoted(true);
      
      console.log(`Vote successful for submission ${submissionId}, user ${user?.id || 'anonymous'}. Server returned vote count: ${response.voteCount}`);
      
      // Use the vote count returned from the server
      if (onVoteSuccess && response.voteCount) {
        onVoteSuccess(submissionId, response.voteCount);
      }
    } catch (err: Error | unknown) {
      console.error(`Failed to vote for submission ${submissionId}:`, err);
      // Check if error message is from our API (e.g. already voted, though checkStatus should prevent this)
      if (err instanceof Error && err.message.includes("already voted")) { // Example check
        setHasVoted(true); // Sync state if backend says already voted
        setError("You have already voted for this item.");
      } else {
        setError("Vote failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  let buttonContent = <><ThumbsUp size={16} className="mr-1" /> Vote</>;
  let buttonVariant: 'primary' | 'secondary' | 'ghost' = 'secondary';
  let isDisabled = isLoading || hasVoted === true;

  if (isLoading && hasVoted === null) { // Initial loading of status
    buttonContent = <><Loader2 size={16} className="mr-1 animate-spin" /> Loading</>;
    buttonVariant = 'ghost';
  } else if (isLoading) { // Loading during vote submission
    buttonContent = <><Loader2 size={16} className="mr-1 animate-spin" /> Voting</>;
    buttonVariant = 'secondary';
  } else if (hasVoted === true) {
    buttonContent = <><CheckCircle size={16} className="mr-1 text-green-500" /> Voted</>;
    buttonVariant = 'ghost';
    isDisabled = true;
  } else if (hasVoted === false) {
    buttonContent = <><ThumbsUp size={16} className="mr-1" /> Vote</>;
    buttonVariant = 'primary'; // Or 'primary' for more emphasis
  }
  // else hasVoted is null and not loading (e.g. initial state or error in checkStatus)

  if (error && !isLoading) {
    // Optionally, render error message near the button or rely on a toast system
    // For now, the button might just be enabled to retry unless it's an "already voted" error.
    if (error.includes("already voted")) {
        buttonContent = <><CheckCircle size={16} className="mr-1 text-green-500" /> Voted</>;
        buttonVariant = 'ghost';
        isDisabled = true;
    } else {
        // Show error or allow retry
    }
  }

  return (
    <Button 
      onClick={handleVoteClick} 
      disabled={isDisabled} 
      variant={buttonVariant} 
      size="md"
      className={`flex items-center justify-center text-center whitespace-nowrap ${className || ''}`}
    >
      {buttonContent}
    </Button>
  );
} 