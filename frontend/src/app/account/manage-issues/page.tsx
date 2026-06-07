'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { deleteIssue, getAllIssues } from '@/api/issues';
import { Issue } from '@/types/submission';
import { formatDate } from '@/lib/utils';

/**
 * Admin Issues Management Page
 * Lists all issues and provides management options including create and edit
 */
export default function ManageIssuesPage() {
  const router = useRouter();
  const { user, loading, hasRole } = useAuth();
  
  // Data state
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [issuePendingDelete, setIssuePendingDelete] = useState<Issue | null>(null);
  const [deletingIssueId, setDeletingIssueId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Redirect non-admin users
  useEffect(() => {
    if (!loading && (!user || !hasRole('admin'))) {
      router.push('/');
    }
  }, [user, loading, hasRole, router]);

  // Load issues data
  useEffect(() => {
    const fetchIssues = async () => {
      if (!user || !hasRole('admin')) return;
      
      try {
        const data = await getAllIssues();
        // Sort issues by ID in descending order (newest first)
        const sortedIssues = (data || []).sort((a, b) => b.id - a.id);
        setIssues(sortedIssues);
      } catch (err) {
        console.error('Failed to fetch issues:', err);
        setError('Failed to load issues. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (user && hasRole('admin')) {
      fetchIssues();
    }
  }, [user, hasRole]);

  const handleRequestDelete = (issue: Issue) => {
    setError(null);
    setSuccessMessage(null);
    setDeleteError(null);
    setIssuePendingDelete(issue);
  };

  const handleCancelDelete = () => {
    if (deletingIssueId !== null) return;
    setDeleteError(null);
    setIssuePendingDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!issuePendingDelete) return;

    setError(null);
    setSuccessMessage(null);
    setDeleteError(null);
    setDeletingIssueId(issuePendingDelete.id);

    try {
      await deleteIssue(issuePendingDelete.id);
      setIssues((currentIssues) =>
        currentIssues.filter((issue) => issue.id !== issuePendingDelete.id)
      );
      setSuccessMessage(`Issue "${issuePendingDelete.title}" deleted successfully.`);
      setIssuePendingDelete(null);
    } catch (err) {
      console.error('Failed to delete issue:', err);
      const message = err instanceof Error ? err.message : 'Failed to delete issue. Please try again.';
      setDeleteError(message);
      setError(message);
    } finally {
      setDeletingIssueId(null);
    }
  };

  // Show loading state while checking permissions
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Only render for admin users
  if (!user || !hasRole('admin')) {
    return null; // Will redirect in useEffect
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Manage Issues</h1>
        <Link href="/account/manage-issues/create">
          <Button>Create New Issue</Button>
        </Link>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {successMessage}
        </div>
      )}
      
      {/* Loading state */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading issues...</div>
        </div>
      ) : (
        <>
          {issues.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium text-gray-700 mb-2">No issues found</h3>
              <p className="text-gray-500 mb-4">Create your first issue to get started</p>
              <Link href="/account/manage-issues/create">
                <Button>Create New Issue</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg bg-white shadow">
              <table className="w-full min-w-[1260px] table-fixed divide-y divide-gray-200">
                <colgroup>
                  <col className="w-[23%]" />
                  <col className="w-[19%]" />
                  <col className="w-[19%]" />
                  <col className="w-[11%]" />
                  <col className="w-[28%]" />
                </colgroup>
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Title
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Submission Period
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Voting Period
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Created
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {issues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="truncate text-sm font-medium text-gray-900" title={issue.title}>
                          {issue.title}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="truncate text-sm text-gray-500">
                          {formatDate(issue.submissionStart, { month: 'short', day: 'numeric' })} - {formatDate(issue.submissionEnd, { month: 'short', day: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="truncate text-sm text-gray-500">
                          {formatDate(issue.votingStart, { month: 'short', day: 'numeric' })} - {formatDate(issue.votingEnd, { month: 'short', day: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="truncate text-sm text-gray-500">
                          {formatDate(issue.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                          <Link
                            href={`/account/manage-issues/${issue.id}/edit`}
                            className="inline-flex items-center justify-center rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-900"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/account/manage-submissions?issueId=${issue.id}`}
                            className="inline-flex items-center justify-center rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-600 transition-colors hover:bg-green-100 hover:text-green-900"
                          >
                            View Submissions
                          </Link>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            disabled={deletingIssueId === issue.id}
                            onClick={() => handleRequestDelete(issue)}
                            className="min-w-[92px] px-3 py-2"
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            {deletingIssueId === issue.id ? 'Deleting...' : 'Delete'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={issuePendingDelete !== null}
        onClose={handleCancelDelete}
        contentVariant="dark-glass"
      >
        <div className="max-w-lg p-6 text-center">
          <h2 className="mb-4 text-2xl font-bold text-white font-heading">Delete Issue</h2>
          <p className="mb-4 text-white">
            Are you sure you want to delete &ldquo;{issuePendingDelete?.title}&rdquo;?
            This action cannot be undone.
          </p>
          <p className="text-sm text-white/80">
            Issues with registered submissions or gallery configuration cannot be deleted.
            Selected anonymous submissions are protected. Anonymous-only issues will also remove
            their anonymous submissions and images.
          </p>
          {deleteError && (
            <div className="mt-4 rounded border border-red-300/40 bg-red-900/40 px-4 py-3 text-sm text-red-100">
              {deleteError}
            </div>
          )}
          <div className="mt-6 flex justify-center gap-4">
            <Button
              type="button"
              variant="danger"
              disabled={deletingIssueId !== null}
              onClick={handleConfirmDelete}
              className="px-6 py-2"
            >
              {deletingIssueId !== null ? 'Deleting...' : 'Yes, Delete Issue'}
            </Button>
            <button
              type="button"
              disabled={deletingIssueId !== null}
              onClick={handleCancelDelete}
              className="rounded bg-gray-600 px-6 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
