"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { getOrGenerateVisitorId } from '@/lib/visitorId';
import { votesApi } from '@/api'; // Corrected import based on @/api/index.ts
import { ThumbsUp, Loader2, CheckCircle } from 'lucide-react'; // Using lucide-react icons

interface VoteButtonProps {
  submissionId: number;
  initialVoteCount?: number; // Optional initial vote count for display
  onVoteSuccess?: (submissionId: number, newVoteCount?: number) => void;
  className?: string;
}

export function VoteButton({ 
  submissionId,
  initialVoteCount,
  onVoteSuccess,
  className
}: VoteButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  // const [currentVoteCount, setCurrentVoteCount] = useState(initialVoteCount || 0);

  const checkStatus = useCallback(async () => {
    // Ensure visitorId cookie is set. This needs to run client-side.
    getOrGenerateVisitorId(); 
    setIsLoading(true);
    try {
      const status = await votesApi.checkVoteStatus(submissionId);
      setHasVoted(status.voted);
      // If API provided current vote count, could update here too
    } catch (err: any) {
      console.error(`VoteButton: Failed to check vote status for submissionId: ${submissionId}. Raw Error:`, err);
      if (err && err.message) {
        console.error(`VoteButton: Error message:`, err.message);
      }
      // You can add more specific checks here if err has other properties like err.response or err.data
      setError(`Could not check vote status for ID ${submissionId}.`);
      setHasVoted(false);
    } finally {
      setIsLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleVoteClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (hasVoted === true || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      await votesApi.submitVote(submissionId);
      setHasVoted(true);
      // Optimistic update could happen here if desired
      // setCurrentVoteCount(prev => prev + 1); 
      if (onVoteSuccess) {
        // If submitVote returned new count, pass it here
        onVoteSuccess(submissionId);
      }
      // Potentially show a temporary success message or icon change
    } catch (err: any) {
      console.error(`Failed to vote for submission ${submissionId}:`, err);
      // Check if error message is from our API (e.g. already voted, though checkStatus should prevent this)
      if (err.message && err.message.includes("already voted")) { // Example check
        setHasVoted(true); // Sync state if backend says already voted
        setError("You have already voted for this item.");
      } else {
        setError("Vote failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  let buttonContent = <><ThumbsUp size={16} className="mr-2" /> Vote</>;
  let buttonVariant: 'primary' | 'secondary' | 'ghost' = 'secondary';
  let isDisabled = isLoading || hasVoted === true;

  if (isLoading && hasVoted === null) { // Initial loading of status
    buttonContent = <><Loader2 size={16} className="mr-2 animate-spin" /> Loading...</>;
    buttonVariant = 'ghost';
  } else if (isLoading) { // Loading during vote submission
    buttonContent = <><Loader2 size={16} className="mr-2 animate-spin" /> Voting...</>;
    buttonVariant = 'secondary';
  } else if (hasVoted === true) {
    buttonContent = <><CheckCircle size={16} className="mr-2 text-green-500" /> Voted</>;
    buttonVariant = 'ghost';
    isDisabled = true;
  } else if (hasVoted === false) {
    buttonContent = <><ThumbsUp size={16} className="mr-2" /> Vote</>;
    buttonVariant = 'primary'; // Or 'primary' for more emphasis
  }
  // else hasVoted is null and not loading (e.g. initial state or error in checkStatus)

  if (error && !isLoading) {
    // Optionally, render error message near the button or rely on a toast system
    // For now, the button might just be enabled to retry unless it's an "already voted" error.
    if (error.includes("already voted")) {
        buttonContent = <><CheckCircle size={16} className="mr-2 text-green-500" /> Voted</>;
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
      className={`flex items-center ${className || ''}`}
    >
      {buttonContent}
    </Button>
  );
} 