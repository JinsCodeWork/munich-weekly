"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useSubmissions } from "@/hooks/useSubmissions";
import { useDebugTools } from "@/hooks/useDebugTools";
import { SubmissionTable } from "@/components/admin/submissions/SubmissionTable";
import { IssueSelector } from "@/components/admin/submissions/IssueSelector";
import { DebugTools } from "@/components/admin/submissions/DebugTools";
import { LoadingState, ErrorState } from "@/components/admin/submissions/LoadingErrorStates";
import { AdminSubmissionResponse } from "@/types/submission";
import { ImageViewer } from "@/components/submission/ImageViewer";

/**
 * Admin Submissions Management Page
 * 
 * Integrates multiple components and custom hooks:
 * - SubmissionTable: Displays submission list
 * - IssueSelector: For issue selection
 * - DebugTools: Debugging tools
 * - LoadingState/ErrorState: Loading and error state components
 * - useSubmissions: Manages submission data and operations
 * - useDebugTools: Manages debugging functionality
 */
export default function ManageSubmissionsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get issueId from URL query parameters
  const issueIdParam = searchParams.get('issueId');
  const initialIssueId = issueIdParam ? parseInt(issueIdParam, 10) : null;
  
  // State management
  const [useMockData, setUseMockData] = useState(false);
  
  // Custom hooks
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
    retryLoadSubmissions
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
    toggleMockData
  } = useDebugTools(token, selectedIssue);
  
  // Sync mock data state
  useEffect(() => {
    setUseMockData(debugMockData);
  }, [debugMockData]);
  
  // Image viewer state
  const [showImageViewer, setShowImageViewer] = useState(false);
  
  // Handle submission thumbnail click - directly view full image
  const handleViewSubmission = (submission: AdminSubmissionResponse) => {
    setViewingSubmission(submission);
    setShowImageViewer(true);
  };
  
  // Close image viewer
  const handleCloseImageViewer = () => {
    setShowImageViewer(false);
  };

  // Update URL when selectedIssue changes
  useEffect(() => {
    if (selectedIssue) {
      const currentPath = window.location.pathname;
      const newUrl = `${currentPath}?issueId=${selectedIssue}`;
      
      // Update URL without causing a page refresh
      window.history.replaceState(null, '', newUrl);
    }
  }, [selectedIssue]);

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/account");
    }
  }, [user, router]);

  if (!user || user.role !== "admin") {
    return null; // Prevent flash, wait for redirect
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Submission Management</h1>
      
      {/* Debug tools */}
      <DebugTools
        showDebugInfo={showDebugInfo}
        debugInfo={debugInfo}
        apiTestResult={apiTestResult}
        selectedIssue={selectedIssue}
        token={token}
        onCheckAuthStatus={checkAuthStatus}
        onTestApiConnection={testApiConnection}
        onToggleMockData={toggleMockData}
        useMockData={debugMockData}
        onCloseDebugInfo={() => setShowDebugInfo(false)}
        onCloseApiTestResult={() => setApiTestResult(null)}
      />
      
      {/* Issue selector */}
      {issues.length > 0 && (
        <IssueSelector
          issues={issues}
          selectedIssue={selectedIssue}
          onIssueChange={setSelectedIssue}
        />
      )}
      
      {/* Download Selected Button */}
      {selectedIssue && submissions.some(s => s.status === 'selected') && (
        <div className="mb-6">
          <button
            onClick={handleDownloadSelected}
            disabled={isDownloading}
            className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            {isDownloading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Preparing Download...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Selected Photos
              </>
            )}
          </button>
          <p className="text-sm text-gray-600 mt-1">
            Download all selected submissions as a ZIP file ({submissions.filter(s => s.status === 'selected').length} photos)
          </p>
        </div>
      )}
      
      {/* Loading state */}
      {loading && <LoadingState />}
      
      {/* Error state */}
      {error && (
        <ErrorState
          message={error}
          onRetry={retryLoadSubmissions}
          onUseMockData={toggleMockData}
          showMockDataOption={!useMockData}
        />
      )}
      
      {/* Submissions table */}
      {!loading && !error && submissions.length > 0 && (
        <SubmissionTable
          submissions={submissions}
          onViewSubmission={handleViewSubmission}
          onAction={handleSubmissionAction}
          actionLoading={actionLoading}
        />
      )}
      
      {/* No data message */}
      {!loading && !error && submissions.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500">No submissions found for this issue</p>
        </div>
      )}
      
      {/* Image viewer */}
      {viewingSubmission && (
        <ImageViewer
          imageUrl={viewingSubmission.imageUrl}
          description={viewingSubmission.description}
          isOpen={showImageViewer}
          onClose={handleCloseImageViewer}
        />
      )}
    </div>
  );
} 