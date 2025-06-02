"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { getOrGenerateVisitorId } from '@/lib/visitorId';
import { votesApi } from '@/api';
import { ThumbsUp, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useVoteStatus } from '@/context/VoteStatusContext';

interface VoteButtonProps {
  submissionId: number;
  initialVoteCount?: number; // Optional initial vote count for display
  onVoteSuccess?: (submissionId: number, newVoteCount?: number) => void;
  onVoteCancelled?: (submissionId: number, newVoteCount?: number) => void;
  className?: string;
  allowUnvote?: boolean; // Whether to allow users to cancel their vote
}

/**
 * Optimized VoteButton Component
 * 
 * Uses VoteStatusContext for efficient vote status management:
 * - Eliminates individual API calls per button (major performance improvement)
 * - Maintains all existing functionality and appearance
 * - Uses batch status checking through context
 * - Provides immediate feedback for voting actions
 * 
 * Performance improvements:
 * - No individual checkVoteStatus API calls on mount
 * - Relies on batch checking from parent components
 * - Caches vote status globally across all buttons
 */
export function VoteButton({ 
  submissionId,
  onVoteSuccess,
  onVoteCancelled,
  className,
  allowUnvote = true // By default, allow users to cancel votes
}: VoteButtonProps) {
  const { user } = useAuth();
  const { 
    getVoteStatus, 
    isCheckingStatus, 
    updateVoteStatus, 
    resetVoteStatus 
  } = useVoteStatus();
  
  // Local state for voting actions (not for status checking)
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visitorId, setVisitorId] = useState<string | null>(null);

  // Initialize visitorId for anonymous users
  useEffect(() => {
    if (!user) {
      const id = getOrGenerateVisitorId();
      setVisitorId(id);
    }
  }, [user]);

  // Get vote status from context (no individual API calls)
  const hasVoted = getVoteStatus(submissionId);
  const isCheckingVoteStatus = isCheckingStatus(submissionId);

  // Combined loading state: either checking status or actively voting
  const isLoading = isCheckingVoteStatus || isVoting;

  /**
   * Submit a new vote
   */
  const handleSubmitVote = useCallback(async () => {
    setIsVoting(true);
    setError(null);
    
    try {
      // Ensure we have visitorId for anonymous users
      if (!user && !visitorId) {
        const newVisitorId = getOrGenerateVisitorId();
        setVisitorId(newVisitorId);
      }
      
      const response = await votesApi.submitVote(submissionId);
      
      // Update vote status in context immediately
      updateVoteStatus(submissionId, true);
      
      console.log(`Vote successful for submission ${submissionId}, user ${user?.id || 'anonymous'}, visitorId: ${visitorId}. Server returned vote count: ${response.voteCount}`);
      
      // Notify parent component of successful vote
      if (onVoteSuccess && response.voteCount) {
        onVoteSuccess(submissionId, response.voteCount);
      }
      
    } catch (err: Error | unknown) {
      console.error(`Failed to vote for submission ${submissionId}:`, err);
      
      // Handle specific error cases
      if (err instanceof Error && err.message.includes("already voted")) {
        updateVoteStatus(submissionId, true); // Sync with backend state
        setError("You have already voted for this item.");
      } else {
        setError("Vote failed. Please try again.");
        // Reset vote status to trigger re-check if needed
        resetVoteStatus(submissionId);
      }
    } finally {
      setIsVoting(false);
    }
  }, [submissionId, user, visitorId, onVoteSuccess, updateVoteStatus, resetVoteStatus]);

  /**
   * Cancel an existing vote
   */
  const handleCancelVote = useCallback(async () => {
    setIsVoting(true);
    setError(null);
    
    try {
      // Ensure we have visitorId for anonymous users
      if (!user && !visitorId) {
        const newVisitorId = getOrGenerateVisitorId();
        setVisitorId(newVisitorId);
      }
      
      console.log(`Attempting to cancel vote for submission ${submissionId}, user ${user?.id || 'anonymous'}, visitorId: ${visitorId}`);
      
      const response = await votesApi.cancelVote(submissionId);
      
      if (response.success) {
        // Update vote status in context immediately
        updateVoteStatus(submissionId, false);
        
        console.log(`Vote cancelled for submission ${submissionId}, user ${user?.id || 'anonymous'}, visitorId: ${visitorId}. Server returned vote count: ${response.voteCount}`);
        
        // Notify parent component of cancelled vote
        if (onVoteCancelled && response.voteCount !== undefined) {
          onVoteCancelled(submissionId, response.voteCount);
        }
      } else {
        throw new Error("Failed to cancel vote");
      }
    } catch (err: Error | unknown) {
      console.error(`Failed to cancel vote for submission ${submissionId}:`, err);
      setError("Failed to cancel vote. Please try again.");
      
      // Reset vote status to trigger re-check
      resetVoteStatus(submissionId);
    } finally {
      setIsVoting(false);
    }
  }, [submissionId, user, visitorId, onVoteCancelled, updateVoteStatus, resetVoteStatus]);

  /**
   * Handle vote click - submit or cancel vote
   * Now includes all dependencies properly
   */
  const handleVoteClick = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    
    if (isLoading) return;

    console.log(`VoteButton: Click handler, hasVoted=${hasVoted}, allowUnvote=${allowUnvote}, user=${user?.id || 'anonymous'}, visitorId=${visitorId}`);

    // If already voted and unvoting is allowed, cancel the vote
    if (hasVoted === true && allowUnvote) {
      await handleCancelVote();
      return;
    }

    // Otherwise, submit a new vote
    await handleSubmitVote();
  }, [hasVoted, allowUnvote, isLoading, user, visitorId, handleCancelVote, handleSubmitVote]);

  // Determine button appearance based on mobile/desktop
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  // Button content based on state
  let buttonContent;
  if (isMobile) {
    // Mobile: compact icons only
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
    // Desktop: icons with text
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

  // Button variant and disabled state
  let buttonVariant: 'primary' | 'secondary' | 'ghost' = 'secondary';
  let isDisabled = isLoading || (hasVoted === true && !allowUnvote);

  if (hasVoted === true) {
    buttonVariant = 'ghost'; // Special styling for voted state
  } else if (hasVoted === false) {
    buttonVariant = 'primary';
  }

  // Handle error states
  if (error && !isLoading) {
    if (error.includes("already voted")) {
      buttonContent = isMobile 
        ? <CheckCircle size={16} className="text-green-500" />
        : <><CheckCircle size={16} className="mr-1 text-green-500" /> Voted</>;
      buttonVariant = 'ghost';
      isDisabled = !allowUnvote;
    }
  }

  // Tooltip for voted state
  const buttonTitle = hasVoted && allowUnvote ? "Click to cancel vote" : "";

  // Enhanced touch area for mobile
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
        // Ensure touch events work properly on mobile
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