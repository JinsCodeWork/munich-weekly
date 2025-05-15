import React from "react";
import { AdminSubmissionResponse, SubmissionStatus } from "@/types/submission";
import { formatDate } from "@/lib/utils";
import { Thumbnail } from "@/components/ui/Thumbnail";

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
  // Helper function to get status badge color based on submission status
  const getStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case SubmissionStatus.APPROVED:
        return "bg-green-100 text-green-800";
      case SubmissionStatus.REJECTED:
        return "bg-red-100 text-red-800";
      case SubmissionStatus.SELECTED:
        return "bg-purple-100 text-purple-800";
      case SubmissionStatus.PENDING:
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submission</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Votes</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contributor</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {submissions.map(submission => (
            <tr key={submission.id} className="hover:bg-gray-50">
              <td className="px-4 py-4 whitespace-nowrap">
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
                      <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        Cover
                      </span>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status as SubmissionStatus)}`}>
                  {submission.status}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {formatDate(submission.submittedAt)}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                {submission.voteCount}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {submission.userNickname || "Unknown User"}
                </div>
                <div className="text-xs text-gray-500">
                  {submission.userEmail || ""}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex space-x-2">
                  <button
                    onClick={() => onAction(submission.id, 'approve')}
                    className={`${submission.status !== SubmissionStatus.APPROVED 
                      ? "text-green-600 hover:text-green-900" 
                      : "text-gray-400 cursor-not-allowed"}`}
                    disabled={submission.status === SubmissionStatus.APPROVED || actionLoading === submission.id}
                  >
                    {actionLoading === submission.id ? 'Processing...' : 'Approve'}
                  </button>
                  
                  <button
                    onClick={() => onAction(submission.id, 'reject')}
                    className={`${submission.status !== SubmissionStatus.REJECTED 
                      ? "text-red-600 hover:text-red-900" 
                      : "text-gray-400 cursor-not-allowed"}`}
                    disabled={submission.status === SubmissionStatus.REJECTED || actionLoading === submission.id}
                  >
                    {actionLoading === submission.id ? 'Processing...' : 'Reject'}
                  </button>
                  
                  <button
                    onClick={() => onAction(submission.id, 'select')}
                    className={`${submission.status !== SubmissionStatus.SELECTED 
                      ? "text-purple-600 hover:text-purple-900" 
                      : "text-gray-400 cursor-not-allowed"}`}
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