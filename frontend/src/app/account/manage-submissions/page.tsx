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