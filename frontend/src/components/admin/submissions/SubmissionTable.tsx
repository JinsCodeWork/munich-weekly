import React, { useState, useMemo } from "react";
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

// Sort direction type
type SortDirection = 'asc' | 'desc' | null;

// Sort configuration interface
interface SortConfig {
  key: string;
  direction: SortDirection;
}

// Sortable column types
type SortableColumn = 'status' | 'votes';

/**
 * Component that renders the submissions table with all submissions data
 * Includes columns for submission details, status, submission date, votes, contributor info, and actions
 * Features Excel-like sorting for Status and Votes columns
 */
export function SubmissionTable({ submissions, onViewSubmission, onAction, actionLoading }: SubmissionTableProps) {
  // Sort state management
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: null });

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

  // Handle column sort - Excel-like behavior: asc -> desc -> no sort
  const handleSort = (column: SortableColumn) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key !== column) {
        // First click on a new column: ascending
        return { key: column, direction: 'asc' };
      } else if (prevConfig.direction === 'asc') {
        // Second click on same column: descending
        return { key: column, direction: 'desc' };
      } else if (prevConfig.direction === 'desc') {
        // Third click on same column: no sort
        return { key: '', direction: null };
      } else {
        // No sort -> ascending
        return { key: column, direction: 'asc' };
      }
    });
  };

  // Sort submissions based on current sort configuration
  const sortedSubmissions = useMemo(() => {
    // Always sort by status first, with Pending at the top by default
    const defaultSortedSubmissions = [...submissions].sort((a, b) => {
      const statusPriority = {
        [SubmissionStatus.PENDING]: 1,
        [SubmissionStatus.APPROVED]: 2,
        [SubmissionStatus.SELECTED]: 3,
        [SubmissionStatus.REJECTED]: 4
      };
      const aStatusValue = statusPriority[a.status as SubmissionStatus] || 0;
      const bStatusValue = statusPriority[b.status as SubmissionStatus] || 0;
      
      // If status priority is different, sort by status (Pending first)
      if (aStatusValue !== bStatusValue) {
        return aStatusValue - bStatusValue;
      }
      
      // If same status, maintain original order (or sort by submission time)
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });

    // If no manual sort is applied, return default sorted submissions
    if (!sortConfig.key || !sortConfig.direction) {
      return defaultSortedSubmissions;
    }

    // Apply manual sorting while maintaining the base order for same values
    return [...defaultSortedSubmissions].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortConfig.key) {
        case 'status':
          // Define status priority for sorting
          const statusPriority = {
            [SubmissionStatus.PENDING]: 1,
            [SubmissionStatus.APPROVED]: 2,
            [SubmissionStatus.SELECTED]: 3,
            [SubmissionStatus.REJECTED]: 4
          };
          aValue = statusPriority[a.status as SubmissionStatus] || 0;
          bValue = statusPriority[b.status as SubmissionStatus] || 0;
          break;
        case 'votes':
          aValue = a.voteCount;
          bValue = b.voteCount;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [submissions, sortConfig]);

  // Render sort indicator icon
  const renderSortIcon = (column: SortableColumn) => {
    if (sortConfig.key !== column || !sortConfig.direction) {
      return (
        <svg className="w-4 h-4 text-gray-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    if (sortConfig.direction === 'asc') {
      return (
        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Render sortable header
  const renderSortableHeader = (title: string, column: SortableColumn) => (
    <th 
      className={`${getTableHeaderStyles()} cursor-pointer select-none hover:bg-gray-100 transition-colors`}
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center justify-between group">
        <span>{title}</span>
        <div className="flex items-center ml-1 group-hover:opacity-100 transition-opacity">
          {renderSortIcon(column)}
        </div>
      </div>
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className={getTableHeaderStyles()}>Submission</th>
            {renderSortableHeader('Status', 'status')}
            <th className={getTableHeaderStyles()}>Submitted</th>
            {renderSortableHeader('Votes', 'votes')}
            <th className={getTableHeaderStyles()}>Contributor</th>
            <th className={getTableHeaderStyles()}>Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedSubmissions.map(submission => (
            <tr key={submission.id} className={getTableRowStyles()}>
              <td className={getTableCellStyles()}>
                <div className="flex items-center">
                  {/* Thumbnail */}
                  <div 
                    className="flex-shrink-0"
                    onClick={() => onViewSubmission(submission)}
                  >
                    <Thumbnail 
                      src={submission.imageUrl || '/placeholder.svg'} 
                      alt={submission.description || 'No description'}
                      width={64}
                      height={64}
                      rounded={true}
                      objectFit="cover"
                      containerClassName="cursor-pointer"
                      showErrorMessage={true}
                      fallbackSrc="/placeholder.svg"
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