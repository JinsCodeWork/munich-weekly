'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { getAllIssues } from '@/api/issues';
import { Issue } from '@/types/submission';
import { formatDate } from '@/lib/utils';

/**
 * Admin Issues Management Page
 * Lists all issues and provides management options
 */
export default function ManageIssuesPage() {
  const router = useRouter();
  const { user, loading, hasRole } = useAuth();
  
  // Data state
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setIssues(data);
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
      <div className="flex justify-between items-center mb-6">
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
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submission Period
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Voting Period
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {issues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{issue.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(issue.submissionStart, { month: 'short', day: 'numeric' })} - {formatDate(issue.submissionEnd, { month: 'short', day: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(issue.votingStart, { month: 'short', day: 'numeric' })} - {formatDate(issue.votingEnd, { month: 'short', day: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(issue.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/account/manage-submissions?issueId=${issue.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          View Submissions
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
} 