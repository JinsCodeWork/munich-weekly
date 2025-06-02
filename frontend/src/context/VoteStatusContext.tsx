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
 * - Prevents flickering by optimizing state updates
 */
export function VoteStatusProvider({ children }: VoteStatusProviderProps) {
  const { user } = useAuth();
  
  // Vote status cache: submissionId -> { hasVoted: boolean, isLoading: boolean }
  const [voteStatusMap, setVoteStatusMap] = useState<Map<number, { hasVoted: boolean | null; isLoading: boolean }>>(new Map());
  
  // Global states
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Track which submissions are currently being checked to prevent duplicate calls
  const batchCheckInProgressRef = useRef<boolean>(false);
  const lastUserIdRef = useRef<number | null>(null);
  
  // Cache invalidation when user authentication changes (optimized to prevent unnecessary clears)
  useEffect(() => {
    const currentUserId = user?.id ?? null;
    
    // Only clear cache if user actually changed (not just user object reference)
    if (lastUserIdRef.current !== currentUserId) {
      console.log(`🔄 VoteStatusContext: User changed from ${lastUserIdRef.current} to ${currentUserId}, clearing cache`);
      setVoteStatusMap(new Map());
      setHasError(false);
      setErrorMessage(null);
      lastUserIdRef.current = currentUserId;
    }
  }, [user?.id]);
  
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
  }, []);
  
  /**
   * Clear all cached vote status
   * Useful when user authentication changes
   */
  const clearAllStatus = useCallback(() => {
    setVoteStatusMap(new Map());
    setHasError(false);
    setErrorMessage(null);
    batchCheckInProgressRef.current = false;
  }, []);
  
  /**
   * Batch check vote status for multiple submissions
   * This is the main performance optimization - replaces N individual API calls with 1 batch call
   * Optimized to prevent multiple simultaneous calls and reduce flickering
   * **MOBILE OPTIMIZATION**: Enhanced for slower mobile networks
   */
  const batchCheckVoteStatus = useCallback(async (submissionIds: number[]) => {
    if (submissionIds.length === 0) return;
    
    // Prevent multiple simultaneous batch checks
    if (batchCheckInProgressRef.current) {
      console.log(`⏳ VoteStatusContext: Batch check already in progress, skipping duplicate call`);
      return;
    }
    
    console.log(`🔍 VoteStatusContext: Batch checking vote status for ${submissionIds.length} submissions`);
    
    batchCheckInProgressRef.current = true;
    
    // Filter out submissions that are already cached and set loading state
    let uncachedIds: number[] = [];
    let isFirstCheck = false;
    
    setVoteStatusMap(prev => {
      // Filter uncached submissions based on current state
      uncachedIds = submissionIds.filter(id => {
        const cached = prev.get(id);
        return !cached || cached.hasVoted === null;
      });
      
      if (uncachedIds.length === 0) {
        console.log(`✅ VoteStatusContext: All ${submissionIds.length} submissions already cached`);
        return prev; // No changes needed
      }
      
      // Check if this is the first check (for global loading state)
      isFirstCheck = prev.size === 0;
      
      // **MOBILE OPTIMIZATION**: Set loading state only for first batch to reduce re-renders
      const newMap = new Map(prev);
      if (isFirstCheck) {
        uncachedIds.forEach(id => {
          newMap.set(id, { hasVoted: null, isLoading: true });
        });
      } else {
        // For subsequent checks, don't show loading to avoid UI flicker
        uncachedIds.forEach(id => {
          newMap.set(id, { hasVoted: null, isLoading: false });
        });
      }
      return newMap;
    });
    
    // Exit early if all submissions are cached
    if (uncachedIds.length === 0) {
      batchCheckInProgressRef.current = false;
      return;
    }
    
    // Only set global loading for initial load to avoid blocking progressive rendering
    if (isFirstCheck) {
      setIsInitialLoading(true);
    }
    
    setHasError(false);
    setErrorMessage(null);
    
    try {
      const startTime = performance.now();
      const response = await votesApi.checkBatchVoteStatus(uncachedIds);
      const duration = performance.now() - startTime;
      
      console.log(`✅ VoteStatusContext: Batch check completed in ${duration.toFixed(2)}ms for ${response.totalChecked} submissions`);
      
      // Update cache with results in a single state update to prevent flickering
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
      
      // Set all uncached submissions to not loading with fallback status in single update
      setVoteStatusMap(prev => {
        const newMap = new Map(prev);
        uncachedIds.forEach(id => {
          newMap.set(id, { hasVoted: false, isLoading: false }); // Fallback to false on error
        });
        return newMap;
      });
      
    } finally {
      if (isFirstCheck) {
        setIsInitialLoading(false);
      }
      batchCheckInProgressRef.current = false;
    }
  }, []);
  
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