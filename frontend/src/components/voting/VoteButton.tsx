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
  onVoteCancelled?: (submissionId: number, newVoteCount?: number) => void;
  className?: string;
  allowUnvote?: boolean; // Whether to allow users to cancel their vote
}

export function VoteButton({ 
  submissionId,
  onVoteSuccess,
  onVoteCancelled,
  className,
  allowUnvote = true // By default, allow users to cancel votes
}: VoteButtonProps) {
  const { user } = useAuth(); // 获取当前登录用户
  const [isLoading, setIsLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  // const [currentVoteCount, setCurrentVoteCount] = useState(initialVoteCount || 0);

  // 初始化visitorId
  useEffect(() => {
    if (!user) {
      const id = getOrGenerateVisitorId();
      setVisitorId(id);
      console.log("Set visitorId:", id);
    }
  }, [user]);

  const checkStatus = useCallback(async () => {
    // 重置状态，因为用户可能变化了
    setHasVoted(null);
    setError(null);
    
    setIsLoading(true);
    try {
      const status = await votesApi.checkVoteStatus(submissionId);
      setHasVoted(status.voted);
      console.log(`VoteButton: Checked vote status for submission ${submissionId}, user ${user?.id || 'anonymous'}, visitorId: ${visitorId}, status:`, status.voted);
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
  }, [submissionId, user, visitorId]); // 依赖项添加user和visitorId，状态变化时重新检查

  // 初始化和用户变化时检查投票状态
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleVoteClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault(); // 添加这一行，防止事件冒泡
    if (isLoading) return;

    console.log(`VoteButton: Click handler, hasVoted=${hasVoted}, allowUnvote=${allowUnvote}, user=${user?.id || 'anonymous'}, visitorId=${visitorId}`);

    // 如果已经投票且允许取消投票，则取消投票
    if (hasVoted === true && allowUnvote) {
      await handleCancelVote();
      return;
    }

    // 否则，提交新投票
    setIsLoading(true);
    setError(null);
    try {
      // 重新确保我们有visitorId（对于未登录用户）
      if (!user && !visitorId) {
        const newVisitorId = getOrGenerateVisitorId();
        setVisitorId(newVisitorId);
        console.log(`VoteButton: Generated new visitorId before vote: ${newVisitorId}`);
      }
      
      const response = await votesApi.submitVote(submissionId);
      setHasVoted(true);
      
      console.log(`Vote successful for submission ${submissionId}, user ${user?.id || 'anonymous'}, visitorId: ${visitorId}. Server returned vote count: ${response.voteCount}`);
      
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

  const handleCancelVote = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 确保未登录用户有visitorId
      if (!user && !visitorId) {
        const newVisitorId = getOrGenerateVisitorId();
        setVisitorId(newVisitorId);
        console.log(`VoteButton: Generated new visitorId before cancel vote: ${newVisitorId}`);
      }
      
      console.log(`Attempting to cancel vote for submission ${submissionId}, user ${user?.id || 'anonymous'}, visitorId: ${visitorId}`);
      
      const response = await votesApi.cancelVote(submissionId);
      
      if (response.success) {
        setHasVoted(false);
        console.log(`Vote cancelled for submission ${submissionId}, user ${user?.id || 'anonymous'}, visitorId: ${visitorId}. Server returned vote count: ${response.voteCount}`);
        
        // Use the vote count returned from the server
        if (onVoteCancelled && response.voteCount !== undefined) {
          onVoteCancelled(submissionId, response.voteCount);
        }
      } else {
        throw new Error("Failed to cancel vote");
      }
    } catch (err: Error | unknown) {
      console.error(`Failed to cancel vote for submission ${submissionId}:`, err);
      setError("Failed to cancel vote. Please try again.");
      // 投票失败时刷新状态
      checkStatus();
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
  // 如果已投票且允许取消，就不禁用按钮
  let isDisabled = isLoading || (hasVoted === true && !allowUnvote);

  if (hasVoted === true) {
    // 如果已投票且允许取消，使用一个特殊样式但不禁用
    buttonVariant = 'ghost';
  } else if (hasVoted === false) {
    buttonVariant = 'primary';
  }

  if (error && !isLoading) {
    if (error.includes("already voted")) {
      buttonContent = isMobile 
        ? <CheckCircle size={16} className="text-green-500" />
        : <><CheckCircle size={16} className="mr-1 text-green-500" /> Voted</>;
      buttonVariant = 'ghost';
      isDisabled = !allowUnvote;
    }
  }

  // 如果用户已投票且允许取消，添加提示信息
  const buttonTitle = hasVoted && allowUnvote ? "点击取消投票" : "";

  // 为移动端增加触摸区域
  const mobileClass = isMobile ? "p-2" : "";

  return (
    <Button 
      onClick={handleVoteClick} 
      disabled={isDisabled} 
      variant={buttonVariant} 
      size={isMobile ? "sm" : "md"}
      title={buttonTitle}
      className={`flex items-center justify-center text-center ${mobileClass} ${className || ''}`}
      onTouchEnd={(e) => {
        // 确保触摸事件在移动端正常工作
        e.preventDefault();
        if (!isDisabled && !isLoading) {
          handleVoteClick(e as unknown as React.MouseEvent<HTMLButtonElement>);
        }
      }}
    >
      {buttonContent}
    </Button>
  );
} 