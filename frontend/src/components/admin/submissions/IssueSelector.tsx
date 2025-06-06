import React from "react";
import { Issue } from "@/types/submission";
import { formatDate } from "@/lib/utils";

interface IssueSelectorProps {
  issues: Issue[];
  selectedIssue: number | null;
  onIssueChange: (issueId: number) => void;
}

/**
 * Component for selecting and displaying issue information
 * Shows issue selector dropdown and detailed information about the selected issue
 */
export function IssueSelector({ issues, selectedIssue, onIssueChange }: IssueSelectorProps) {
  const handleIssueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onIssueChange(Number(e.target.value));
  };
  
  // Sort issues by ID in descending order (newest first)
  const sortedIssues = [...issues].sort((a, b) => b.id - a.id);
  
  // Find the currently selected issue
  const currentIssue = sortedIssues.find(i => i.id === selectedIssue);

  return (
    <div>
      {/* Issue selector */}
      <div className="flex items-center mb-6">
        <label htmlFor="issue-selector" className="mr-2 text-sm text-gray-700">
          Select Issue:
        </label>
        <select
          id="issue-selector"
          className="border border-gray-300 rounded-md py-1.5 px-3 text-sm"
          value={selectedIssue || ""}
          onChange={handleIssueChange}
        >
          {sortedIssues.map(issue => (
            <option key={issue.id} value={issue.id}>
              Issue {issue.id} - {issue.title}
            </option>
          ))}
        </select>
      </div>

      {/* Selected issue info */}
      {selectedIssue && currentIssue && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            {currentIssue.title}
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            {currentIssue.description}
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <div>
              <span className="font-medium">Submission Period:</span>{" "}
              {formatDate(currentIssue.submissionStart)} - {formatDate(currentIssue.submissionEnd)} (CET)
            </div>
            <div>
              <span className="font-medium">Voting Period:</span>{" "}
              {formatDate(currentIssue.votingStart)} - {formatDate(currentIssue.votingEnd)} (CET)
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 