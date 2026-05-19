import React from "react";
import { Issue, AdminSubmissionResponse } from "@/types/submission";
import { IssueSelector } from "@/components/ui/IssueSelector";

export interface ManageSubmissionsToolbarProps {
  debugTools: React.ReactNode;
  issues: Issue[];
  selectedIssue: number | null;
  onIssueChange: (issueId: number) => void;
  submissions: AdminSubmissionResponse[];
  onDownloadSelected: () => void;
  isDownloading: boolean;
}

export function ManageSubmissionsToolbar({
  debugTools,
  issues,
  selectedIssue,
  onIssueChange,
  submissions,
  onDownloadSelected,
  isDownloading,
}: ManageSubmissionsToolbarProps) {
  const selectedCount = submissions.filter((s) => s.status === "selected").length;
  const showDownload = Boolean(
    selectedIssue && submissions.some((s) => s.status === "selected"),
  );

  return (
    <>
      {debugTools}

      {issues.length > 0 && (
        <IssueSelector
          issues={issues}
          selectedIssue={
            selectedIssue != null
              ? issues.find((i) => i.id === selectedIssue) ?? null
              : null
          }
          onSelectIssue={(issue) => {
            if (issue) {
              onIssueChange(issue.id);
            }
          }}
          includeEmptyOption={false}
          label="Select Issue:"
          formatOptionLabel={(i) => `Issue ${i.id} - ${i.title}`}
        />
      )}

      {showDownload && (
        <div className="mb-6">
          <button
            type="button"
            onClick={onDownloadSelected}
            disabled={isDownloading}
            className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            {isDownloading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Preparing Download...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download Selected Photos
              </>
            )}
          </button>
          <p className="text-sm text-gray-600 mt-1">
            Download all selected submissions as a ZIP file ({selectedCount} photos)
          </p>
        </div>
      )}
    </>
  );
}
