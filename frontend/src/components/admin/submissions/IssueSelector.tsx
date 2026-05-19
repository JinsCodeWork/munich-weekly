import React from "react";
import { Issue } from "@/types/submission";
import { IssueSelector as UiIssueSelector } from "@/components/ui/IssueSelector";

interface IssueSelectorProps {
  issues: Issue[];
  selectedIssue: number | null;
  onIssueChange: (issueId: number) => void;
}

/**
 * Admin issue picker: same public API as before, implemented with shared `ui/IssueSelector`.
 */
export function IssueSelector({ issues, selectedIssue, onIssueChange }: IssueSelectorProps) {
  const selected =
    selectedIssue != null ? issues.find((i) => i.id === selectedIssue) ?? null : null;

  return (
    <UiIssueSelector
      issues={issues}
      selectedIssue={selected}
      onSelectIssue={(issue) => {
        if (issue) {
          onIssueChange(issue.id);
        }
      }}
      includeEmptyOption={false}
      label="Select Issue:"
      formatOptionLabel={(i) => `Issue ${i.id} - ${i.title}`}
    />
  );
}
