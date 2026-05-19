import { useEffect, useState, useCallback } from "react";
import { AdminSubmissionResponse } from "@/types/submission";
import { useSubmissions } from "@/hooks/useSubmissions";
import { useDebugTools } from "@/hooks/useDebugTools";

export interface ManageSubmissionsOrchestrationInput {
  token: string | null;
  initialIssueId: number | null;
}

/**
 * Composes submission loading/actions, debug/mock tooling, and image viewer flow
 * for the admin manage-submissions page. URL sync and auth stay in the page shell.
 */
export function useManageSubmissionsOrchestration({
  token,
  initialIssueId,
}: ManageSubmissionsOrchestrationInput) {
  const [useMockData, setUseMockData] = useState(false);
  const {
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
    handleDownloadSelected,
    isDownloading,
    retryLoadSubmissions,
  } = useSubmissions(useMockData, initialIssueId);

  const {
    showDebugInfo,
    setShowDebugInfo,
    apiTestResult,
    setApiTestResult,
    useMockData: debugMockData,
    debugInfo,
    checkAuthStatus,
    testApiConnection,
    toggleMockData,
  } = useDebugTools(token, selectedIssue);

  useEffect(() => {
    setUseMockData(debugMockData);
  }, [debugMockData]);

  const [showImageViewer, setShowImageViewer] = useState(false);

  const handleViewSubmission = useCallback(
    (submission: AdminSubmissionResponse) => {
      setViewingSubmission(submission);
      setShowImageViewer(true);
    },
    [setViewingSubmission],
  );

  const handleCloseImageViewer = useCallback(() => {
    setShowImageViewer(false);
  }, []);

  return {
    issues,
    selectedIssue,
    setSelectedIssue,
    submissions,
    loading,
    error,
    actionLoading,
    viewingSubmission,
    handleSubmissionAction,
    handleDownloadSelected,
    isDownloading,
    retryLoadSubmissions,
    useMockData,
    showDebugInfo,
    setShowDebugInfo,
    apiTestResult,
    setApiTestResult,
    debugMockData,
    debugInfo,
    checkAuthStatus,
    testApiConnection,
    toggleMockData,
    showImageViewer,
    handleViewSubmission,
    handleCloseImageViewer,
  };
}
