import React from "react";
import { AdminSubmissionResponse, SubmissionStatus } from "@/types/submission";
import { formatDate } from "@/lib/utils";
import { Thumbnail } from "@/components/ui/Thumbnail";
import { StatusBadge } from "@/components/ui/Badge";
import { mapSubmissionStatusToBadge } from "@/styles/components/badge";
import { getTableHeaderStyles, getTableCellStyles, getTableRowStyles } from "@/styles/components/table";

interface SubmissionTableProps {
  submissions: AdminSubmissionResponse[];
  onViewSubmission: (submission: AdminSubmissionResponse) => void;
  onAction: (submissionId: number, action: 'approve' | 'reject' | 'select') => void;
  actionLoading: number | null;
}

/**
 * Component that renders the submissions table with all submissions data
 * Includes columns for submission details, status, submission date, votes, contributor info, and actions
 */
export function SubmissionTable({ submissions, onViewSubmission, onAction, actionLoading }: SubmissionTableProps) {
  // Action button styles based on status
  const getActionButtonClass = (submission: AdminSubmissionResponse, actionType: 'approve' | 'reject' | 'select') => {
    const isDisabled = 
      (actionType === 'approve' && submission.status === SubmissionStatus.APPROVED) ||
      (actionType === 'reject' && submission.status === SubmissionStatus.REJECTED) ||
      (actionType === 'select' && submission.status === SubmissionStatus.SELECTED) ||
      actionLoading === submission.id;
    
    if (isDisabled) {
      return "text-gray-400 cursor-not-allowed";
    }
    
    const colorMap = {
      'approve': "text-green-600 hover:text-green-900",
      'reject': "text-red-600 hover:text-red-900",
      'select': "text-purple-600 hover:text-purple-900"
    };
    
    return colorMap[actionType];
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className={getTableHeaderStyles()}>Submission</th>
            <th className={getTableHeaderStyles()}>Status</th>
            <th className={getTableHeaderStyles()}>Submitted</th>
            <th className={getTableHeaderStyles()}>Votes</th>
            <th className={getTableHeaderStyles()}>Contributor</th>
            <th className={getTableHeaderStyles()}>Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {submissions.map(submission => (
            <tr key={submission.id} className={getTableRowStyles()}>
              <td className={getTableCellStyles()}>
                <div className="flex items-center">
                  {/* Thumbnail */}
                  <div 
                    className="flex-shrink-0"
                    onClick={() => onViewSubmission(submission)}
                  >
                    <Thumbnail 
                      src={submission.imageUrl} 
                      alt={submission.description}
                      width={64}
                      height={64}
                      rounded={true}
                      objectFit="cover"
                      containerClassName="cursor-pointer"
                    />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                      {submission.description.split('\n')[0]}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {submission.id}
                    </div>
                    {submission.isCover && (
                      <StatusBadge status="cover" variant="rounded" />
                    )}
                  </div>
                </div>
              </td>
              <td className={getTableCellStyles()}>
                <StatusBadge status={mapSubmissionStatusToBadge(submission.status as SubmissionStatus)} />
              </td>
              <td className={getTableCellStyles()}>
                <div className="text-sm text-gray-900">
                  {formatDate(submission.submittedAt)}
                </div>
              </td>
              <td className={getTableCellStyles("text-sm text-gray-500")}>
                {submission.voteCount}
              </td>
              <td className={getTableCellStyles()}>
                <div className="text-sm text-gray-900">
                  {submission.userNickname || "Unknown User"}
                </div>
                <div className="text-xs text-gray-500">
                  {submission.userEmail || ""}
                </div>
              </td>
              <td className={getTableCellStyles("text-right text-sm font-medium")}>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onAction(submission.id, 'approve')}
                    className={getActionButtonClass(submission, 'approve')}
                    disabled={submission.status === SubmissionStatus.APPROVED || actionLoading === submission.id}
                  >
                    {actionLoading === submission.id ? 'Processing...' : 'Approve'}
                  </button>
                  
                  <button
                    onClick={() => onAction(submission.id, 'reject')}
                    className={getActionButtonClass(submission, 'reject')}
                    disabled={submission.status === SubmissionStatus.REJECTED || actionLoading === submission.id}
                  >
                    {actionLoading === submission.id ? 'Processing...' : 'Reject'}
                  </button>
                  
                  <button
                    onClick={() => onAction(submission.id, 'select')}
                    className={getActionButtonClass(submission, 'select')}
                    disabled={submission.status === SubmissionStatus.SELECTED || actionLoading === submission.id}
                  >
                    {actionLoading === submission.id ? 'Processing...' : 'Select'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 