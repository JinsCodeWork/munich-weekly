import { useState, useEffect } from 'react';
import { getAllIssues } from '@/api/issues';
import { Issue } from '@/types/submission';

/**
 * Custom hook for fetching and managing issue data
 * Provides access to all issues and active issues (within submission period)
 */
export function useIssues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [activeIssues, setActiveIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all issues from the API
   */
  const fetchIssues = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const fetchedIssues = await getAllIssues();
      // Sort issues by ID in descending order (newest first)
      const sortedIssues = (fetchedIssues || []).sort((a, b) => b.id - a.id);
      setIssues(sortedIssues);
      
      // Filter for active issues (within submission period)
      const now = new Date();
      const active = sortedIssues.filter(issue => {
        const submissionStart = new Date(issue.submissionStart);
        const submissionEnd = new Date(issue.submissionEnd);
        return submissionStart <= now && now <= submissionEnd;
      });
      
      setActiveIssues(active);
    } catch (err) {
      console.error('Failed to fetch issues:', err);
      setError('Failed to load available issues. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load issues on component mount
  useEffect(() => {
    fetchIssues();
  }, []);

  return {
    issues,
    activeIssues,
    isLoading,
    error,
    fetchIssues,
    setIssues,
    setActiveIssues
  };
} 