"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useManageSubmissionsOrchestration } from "@/hooks/useManageSubmissionsOrchestration";
import { DebugTools } from "@/components/admin/submissions/DebugTools";
import { ImageViewer } from "@/components/submission/ImageViewer";
import { ManageSubmissionsToolbar } from "./components/ManageSubmissionsToolbar";
import { ManageSubmissionsStatusSection } from "./components/ManageSubmissionsStatusSection";
import { ManageSubmissionsTableSection } from "./components/ManageSubmissionsTableSection";

/**
 * Admin submissions shell: auth gate, URL ?issueId= sync, and composed view.
 * Data/actions live in useManageSubmissionsOrchestration; UI is props-driven sections.
 */
export default function ManageSubmissionsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const issueIdParam = searchParams.get("issueId");
  const initialIssueId = issueIdParam ? parseInt(issueIdParam, 10) : null;

  const {
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
  } = useManageSubmissionsOrchestration({ token, initialIssueId });

  useEffect(() => {
    if (selectedIssue) {
      const currentPath = window.location.pathname;
      const newUrl = `${currentPath}?issueId=${selectedIssue}`;
      window.history.replaceState(null, "", newUrl);
    }
  }, [selectedIssue]);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/account");
    }
  }, [user, router]);

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Submission Management</h1>

      <ManageSubmissionsToolbar
        debugTools={
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
        }
        issues={issues}
        selectedIssue={selectedIssue}
        onIssueChange={setSelectedIssue}
        submissions={submissions}
        onDownloadSelected={handleDownloadSelected}
        isDownloading={isDownloading}
      />

      <ManageSubmissionsStatusSection
        loading={loading}
        error={error}
        hasSubmissions={submissions.length > 0}
        onRetry={retryLoadSubmissions}
        onUseMockData={toggleMockData}
        showMockDataOption={!useMockData}
      />

      {!loading && !error && submissions.length > 0 && (
        <ManageSubmissionsTableSection
          submissions={submissions}
          onViewSubmission={handleViewSubmission}
          onAction={handleSubmissionAction}
          actionLoading={actionLoading}
        />
      )}

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
