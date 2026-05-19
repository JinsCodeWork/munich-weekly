import React from "react";
import { AdminSubmissionResponse } from "@/types/submission";
import { SubmissionTable } from "@/components/admin/submissions/SubmissionTable";

export interface ManageSubmissionsTableSectionProps {
  submissions: AdminSubmissionResponse[];
  onViewSubmission: (submission: AdminSubmissionResponse) => void;
  onAction: (
    submissionId: number,
    action: "approve" | "reject" | "select",
  ) => void;
  actionLoading: number | null;
}

export function ManageSubmissionsTableSection({
  submissions,
  onViewSubmission,
  onAction,
  actionLoading,
}: ManageSubmissionsTableSectionProps) {
  return (
    <SubmissionTable
      submissions={submissions}
      onViewSubmission={onViewSubmission}
      onAction={onAction}
      actionLoading={actionLoading}
    />
  );
}
