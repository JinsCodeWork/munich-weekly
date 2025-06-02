"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { votesApi } from '@/api';
import { useAuth } from '@/context/AuthContext';

interface VoteStatusContextType {
  // Vote status management
  getVoteStatus: (submissionId: number) => boolean | null;
  isCheckingStatus: (submissionId: number) => boolean;
  
  // Batch operations for performance optimization
  batchCheckVoteStatus: (submissionIds: number[]) => Promise<void>;
  
  // Individual operations (maintains compatibility with existing VoteButton)
  updateVoteStatus: (submissionId: number, hasVoted: boolean) => void;
  
  // Global loading state for initial batch checks
  isInitialLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
  
  // Utility functions
  resetVoteStatus: (submissionId: number) => void;
  clearAllStatus: () => void;
}

const VoteStatusContext = createContext<VoteStatusContextType | undefined>(undefined);

interface VoteStatusProviderProps {
  children: React.ReactNode;
}

/**
 * Vote Status Provider Component
 * 
 * Manages vote status for all submissions globally to optimize performance.
 * Uses batch API calls instead of individual status checks per VoteButton.
 * 
 * Key optimizations:
 * - Batch status checking reduces API calls from N to 1
 * - Caches vote status to prevent duplicate checks
 * - Automatically invalidates cache when user authentication changes
 * - Provides loading states for better UX
 */
export function VoteStatusProvider({ children }: VoteStatusProviderProps) {
  const { user } = useAuth();
  
  // Vote status cache: submissionId -> { hasVoted: boolean, isLoading: boolean }
  const [voteStatusMap, setVoteStatusMap] = useState<Map<number, { hasVoted: boolean | null; isLoading: boolean }>>(new Map());
  
  // Global states
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Track which submissions are currently being checked individually
  const individualChecksRef = useRef<Set<number>>(new Set());
  
  // Cache invalidation when user authentication changes
  useEffect(() => {
    // Clear all cached status when user changes (login/logout)
    setVoteStatusMap(new Map());
    setHasError(false);
    setErrorMessage(null);
  }, [user?.id]); // Only trigger when user ID changes, not on every user object change
  
  /**
   * Get the cached vote status for a submission
   */
  const getVoteStatus = useCallback((submissionId: number): boolean | null => {
    const status = voteStatusMap.get(submissionId);
    return status?.hasVoted ?? null;
  }, [voteStatusMap]);
  
  /**
   * Check if a submission status is currently being checked
   */
  const isCheckingStatus = useCallback((submissionId: number): boolean => {
    const status = voteStatusMap.get(submissionId);
    return status?.isLoading ?? false;
  }, [voteStatusMap]);
  
  /**
   * Update vote status for a specific submission
   * Used when voting/unvoting to immediately update the cache
   */
  const updateVoteStatus = useCallback((submissionId: number, hasVoted: boolean) => {
    setVoteStatusMap(prev => {
      const newMap = new Map(prev);
      newMap.set(submissionId, { hasVoted, isLoading: false });
      return newMap;
    });
  }, []);
  
  /**
   * Reset vote status for a specific submission
   * Forces a re-check the next time it's requested
   */
  const resetVoteStatus = useCallback((submissionId: number) => {
    setVoteStatusMap(prev => {
      const newMap = new Map(prev);
      newMap.delete(submissionId);
      return newMap;
    });
    individualChecksRef.current.delete(submissionId);
  }, []);
  
  /**
   * Clear all cached vote status
   * Useful when user authentication changes
   */
  const clearAllStatus = useCallback(() => {
    setVoteStatusMap(new Map());
    setHasError(false);
    setErrorMessage(null);
    individualChecksRef.current.clear();
  }, []);
  
  /**
   * Batch check vote status for multiple submissions
   * This is the main performance optimization - replaces N individual API calls with 1 batch call
   */
  const batchCheckVoteStatus = useCallback(async (submissionIds: number[]) => {
    if (submissionIds.length === 0) return;
    
    // Filter out submissions that are already cached or currently being checked
    const uncachedIds = submissionIds.filter(id => {
      const cached = voteStatusMap.get(id);
      return !cached || cached.hasVoted === null;
    });
    
    if (uncachedIds.length === 0) {
      // All submissions already have cached status
      return;
    }
    
    console.log(`🔍 VoteStatusContext: Batch checking vote status for ${uncachedIds.length}/${submissionIds.length} submissions`);
    
    // Set loading state for uncached submissions
    setVoteStatusMap(prev => {
      const newMap = new Map(prev);
      uncachedIds.forEach(id => {
        newMap.set(id, { hasVoted: null, isLoading: true });
      });
      return newMap;
    });
    
    setIsInitialLoading(true);
    setHasError(false);
    setErrorMessage(null);
    
    try {
      const startTime = performance.now();
      const response = await votesApi.checkBatchVoteStatus(uncachedIds);
      const duration = performance.now() - startTime;
      
      console.log(`✅ VoteStatusContext: Batch check completed in ${duration.toFixed(2)}ms for ${response.totalChecked} submissions`);
      
      // Update cache with results
      setVoteStatusMap(prev => {
        const newMap = new Map(prev);
        
        Object.entries(response.statuses).forEach(([submissionIdStr, hasVoted]) => {
          const submissionId = parseInt(submissionIdStr, 10);
          newMap.set(submissionId, { hasVoted, isLoading: false });
        });
        
        // Mark any submissions not in response as not voted (fallback)
        uncachedIds.forEach(id => {
          if (!(id.toString() in response.statuses)) {
            newMap.set(id, { hasVoted: false, isLoading: false });
          }
        });
        
        return newMap;
      });
      
    } catch (error) {
      console.error('VoteStatusContext: Batch vote status check failed:', error);
      
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to check vote status');
      
      // Set all uncached submissions to not loading with null status
      setVoteStatusMap(prev => {
        const newMap = new Map(prev);
        uncachedIds.forEach(id => {
          newMap.set(id, { hasVoted: false, isLoading: false }); // Fallback to false on error
        });
        return newMap;
      });
      
    } finally {
      setIsInitialLoading(false);
    }
  }, [voteStatusMap]);
  
  const contextValue: VoteStatusContextType = {
    getVoteStatus,
    isCheckingStatus,
    batchCheckVoteStatus,
    updateVoteStatus,
    isInitialLoading,
    hasError,
    errorMessage,
    resetVoteStatus,
    clearAllStatus,
  };
  
  return (
    <VoteStatusContext.Provider value={contextValue}>
      {children}
    </VoteStatusContext.Provider>
  );
}

/**
 * Hook to access vote status context
 * 
 * @throws Error if used outside of VoteStatusProvider
 */
export function useVoteStatus(): VoteStatusContextType {
  const context = useContext(VoteStatusContext);
  
  if (context === undefined) {
    throw new Error('useVoteStatus must be used within a VoteStatusProvider');
  }
  
  return context;
} 