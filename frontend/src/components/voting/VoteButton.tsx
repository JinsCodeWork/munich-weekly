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

  // 在移动端使用更简短的文本
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  let buttonContent;
  if (isMobile) {
    // 移动端上使用更紧凑的文本
    if (isLoading && hasVoted === null) {
      buttonContent = <Loader2 size={16} className="animate-spin" />;
    } else if (isLoading) {
      buttonContent = <Loader2 size={16} className="animate-spin" />;
    } else if (hasVoted === true) {
      buttonContent = <CheckCircle size={16} className="text-green-500" />;
    } else {
      buttonContent = <ThumbsUp size={16} />;
    }
  } else {
    // 桌面端使用正常文本
    if (isLoading && hasVoted === null) {
      buttonContent = <><Loader2 size={16} className="mr-1 animate-spin" /> Loading</>;
    } else if (isLoading) {
      buttonContent = <><Loader2 size={16} className="mr-1 animate-spin" /> Voting</>;
    } else if (hasVoted === true) {
      buttonContent = <><CheckCircle size={16} className="mr-1 text-green-500" /> Voted</>;
    } else {
      buttonContent = <><ThumbsUp size={16} className="mr-1" /> Vote</>;
    }
  }

  let buttonVariant: 'primary' | 'secondary' | 'ghost' = 'secondary';
  let isDisabled = isLoading || hasVoted === true;

  if (hasVoted === true) {
    buttonVariant = 'ghost';
    isDisabled = true;
  } else if (hasVoted === false) {
    buttonVariant = 'primary';
  }

  if (error && !isLoading) {
    if (error.includes("already voted")) {
      buttonContent = isMobile 
        ? <CheckCircle size={16} className="text-green-500" />
        : <><CheckCircle size={16} className="mr-1 text-green-500" /> Voted</>;
      buttonVariant = 'ghost';
      isDisabled = true;
    }
  }

  return (
    <Button 
      onClick={handleVoteClick} 
      disabled={isDisabled} 
      variant={buttonVariant} 
      size="md"
      className={`flex items-center justify-center text-center ${className || ''}`}
    >
      {buttonContent}
    </Button>
  );
} 