import { useState, useEffect } from "react";
import { AdminSubmissionResponse, Issue} from "@/types/submission";
import { issuesApi, submissionsApi } from "@/api";
import { generateMockSubmissions } from "@/utils/mockData";

/**
 * Custom hook for managing submissions data and operations
 * Handles fetching issues and submissions, and performing actions on submissions
 */
export function useSubmissions(useMockData: boolean = false) {
  // State for issues and submissions data
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<AdminSubmissionResponse[]>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for tracking submission actions
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<AdminSubmissionResponse | null>(null);

  // Mock data generator function
  const MOCK_SUBMISSIONS = (): AdminSubmissionResponse[] => {
    return generateMockSubmissions();
  };

  // Load issues on component mount
  useEffect(() => {
    const loadIssues = async () => {
      try {
        const issuesData = await issuesApi.getAllIssues();
        setIssues(issuesData || []);
        if (issuesData && issuesData.length > 0) {
          setSelectedIssue(issuesData[0].id);
        }
      } catch (err) {
        console.error("Failed to load issues:", err);
        setIssues([]);
        
        // Create a mock issue if unable to load issues
        const mockIssue: Issue = {
          id: 1,
          title: "Issue 1 Photography Weekly",
          description: "This is a themed photography contest, welcome to submit!",
          submissionStart: new Date(Date.now() - 10 * 86400000).toISOString(),
          submissionEnd: new Date(Date.now() + 10 * 86400000).toISOString(),
          votingStart: new Date(Date.now() + 11 * 86400000).toISOString(),
          votingEnd: new Date(Date.now() + 20 * 86400000).toISOString(),
          createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
        };
        setIssues([mockIssue]);
        setSelectedIssue(1);
      }
    };
    
    loadIssues();
  }, []);

  // Load submissions when selected issue changes
  useEffect(() => {
    const loadSubmissions = async () => {
      if (!selectedIssue) return;
      
      setLoading(true);
      setError(null);
      
      try {
        if (useMockData) {
          // Use mock data
          setSubmissions(MOCK_SUBMISSIONS());
        } else {
          // Use real API
          const response = await submissionsApi.getAllSubmissionsByIssue(selectedIssue);
          setSubmissions(response);
        }
      } catch (err) {
        console.error("Failed to load submissions:", err);
        setError("Failed to load submissions. Please try again.");
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (selectedIssue && issues.length > 0) {
      loadSubmissions();
    }
  }, [selectedIssue, issues, useMockData]);

  /**
   * Handle submission action (approve, reject, select)
   */
  const handleSubmissionAction = async (submissionId: number, action: 'approve' | 'reject' | 'select') => {
    try {
      setActionLoading(submissionId);
      
      if (!useMockData) {
        // Call the appropriate API
        if (action === 'approve') {
          await submissionsApi.approveSubmission(submissionId);
        } else if (action === 'reject') {
          await submissionsApi.rejectSubmission(submissionId);
        } else if (action === 'select') {
          await submissionsApi.selectSubmission(submissionId);
        }
      }
      
      // Update local state
      setSubmissions(prev => 
        prev.map(sub => {
          if (sub.id === submissionId) {
            return { 
              ...sub, 
              status: action === 'approve' ? 'approved' : 
                     action === 'reject' ? 'rejected' : 'selected' 
            };
          }
          return sub;
        })
      );
    } catch (err) {
      console.error(`Failed to ${action} submission:`, err);
      alert(`Failed to ${action} submission. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  // Function to retry loading submissions
  const retryLoadSubmissions = () => {
    if (selectedIssue) {
      // Just trigger the effect by setting the selected issue again
      const currentIssue = selectedIssue;
      setSelectedIssue(null);
      setTimeout(() => setSelectedIssue(currentIssue), 0);
    }
  };

  return {
    issues,
    selectedIssue,
    setSelectedIssue,
    submissions,
    loading,
    error,
    actionLoading,
    viewingSubmission,
    setViewingSubmission,
    handleSubmissionAction,
    retryLoadSubmissions
  };
} 