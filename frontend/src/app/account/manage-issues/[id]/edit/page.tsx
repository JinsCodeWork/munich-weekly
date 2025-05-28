'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { getIssueById, updateIssue } from '@/api/issues';
import { Issue } from '@/types/submission';

/**
 * Edit Issue Page - Admin only
 * Allows administrators to edit existing issues including title, description, and time periods
 */
export default function EditIssuePage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading, hasRole } = useAuth();
  
  // Extract issue ID from URL params
  const issueId = typeof params.id === 'string' ? parseInt(params.id, 10) : null;
  
  // Data state
  const [issue, setIssue] = useState<Issue | null>(null);
  const [isLoadingIssue, setIsLoadingIssue] = useState(true);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submissionStart, setSubmissionStart] = useState('');
  const [submissionEnd, setSubmissionEnd] = useState('');
  const [votingStart, setVotingStart] = useState('');
  const [votingEnd, setVotingEnd] = useState('');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Redirect non-admin users
  useEffect(() => {
    if (!loading && (!user || !hasRole('admin'))) {
      router.push('/');
    }
  }, [user, loading, hasRole, router]);

  // Load issue data
  useEffect(() => {
    const fetchIssue = async () => {
      if (!issueId || !user || !hasRole('admin')) return;
      
      try {
        setIsLoadingIssue(true);
        const issueData = await getIssueById(issueId);
        setIssue(issueData);
        
        // Populate form fields
        setTitle(issueData.title);
        setDescription(issueData.description);
        
        // Format datetime-local values (remove timezone info)
        const formatDateTime = (dateStr: string) => {
          const date = new Date(dateStr);
          // Format to YYYY-MM-DDTHH:mm format required by datetime-local input
          return date.getFullYear() + '-' +
                 String(date.getMonth() + 1).padStart(2, '0') + '-' +
                 String(date.getDate()).padStart(2, '0') + 'T' +
                 String(date.getHours()).padStart(2, '0') + ':' +
                 String(date.getMinutes()).padStart(2, '0');
        };
        
        setSubmissionStart(formatDateTime(issueData.submissionStart));
        setSubmissionEnd(formatDateTime(issueData.submissionEnd));
        setVotingStart(formatDateTime(issueData.votingStart));
        setVotingEnd(formatDateTime(issueData.votingEnd));
        
      } catch (err) {
        console.error('Failed to fetch issue:', err);
        setError('Failed to load issue. It may not exist or you may not have permission.');
      } finally {
        setIsLoadingIssue(false);
      }
    };

    if (user && hasRole('admin') && issueId) {
      fetchIssue();
    }
  }, [user, hasRole, issueId]);

  // Form validation
  const validateForm = () => {
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }
    
    if (!description.trim()) {
      setError('Description is required');
      return false;
    }
    
    if (!submissionStart || !submissionEnd || !votingStart || !votingEnd) {
      setError('All date fields are required');
      return false;
    }
    
    // Check that dates are in correct order
    const subStart = new Date(submissionStart);
    const subEnd = new Date(submissionEnd);
    const voteStart = new Date(votingStart);
    const voteEnd = new Date(votingEnd);
    
    if (subStart >= subEnd) {
      setError('Submission start must be before submission end');
      return false;
    }
    
    if (voteStart >= voteEnd) {
      setError('Voting start must be before voting end');
      return false;
    }
    
    if (voteStart < subStart) {
      setError('Voting cannot start before submission period begins');
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!issueId) {
      setError('Invalid issue ID');
      return;
    }
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      await updateIssue(issueId, {
        title,
        description,
        submissionStart,
        submissionEnd,
        votingStart,
        votingEnd
      });
      
      setSuccess(true);
      
      // Redirect after delay
      setTimeout(() => {
        router.push('/account/manage-issues');
      }, 2000);
    } catch (err) {
      console.error('Failed to update issue:', err);
      setError('Failed to update issue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking permissions
  if (loading || isLoadingIssue) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Handle invalid issue ID
  if (!issueId) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">Invalid issue ID</div>
      </div>
    );
  }

  // Only render for admin users
  if (!user || !hasRole('admin')) {
    return null; // Will redirect in useEffect
  }

  // Handle issue not found
  if (!issue && !isLoadingIssue) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">Issue not found</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700 mr-4"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">Edit Issue: {issue?.title}</h1>
      </div>
      
      {/* Success message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          Issue updated successfully! Redirecting...
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title field */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Weekly Issue Title"
            disabled={isSubmitting}
          />
        </div>
        
        {/* Description field */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe this issue's theme or guidelines"
            disabled={isSubmitting}
          />
        </div>
        
        {/* Time period fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Submission start */}
          <div>
            <label htmlFor="submissionStart" className="block text-sm font-medium text-gray-700 mb-1">
              Submission Start *
            </label>
            <input
              type="datetime-local"
              id="submissionStart"
              value={submissionStart}
              onChange={(e) => setSubmissionStart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            />
          </div>
          
          {/* Submission end */}
          <div>
            <label htmlFor="submissionEnd" className="block text-sm font-medium text-gray-700 mb-1">
              Submission End *
            </label>
            <input
              type="datetime-local"
              id="submissionEnd"
              value={submissionEnd}
              onChange={(e) => setSubmissionEnd(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            />
          </div>
          
          {/* Voting start */}
          <div>
            <label htmlFor="votingStart" className="block text-sm font-medium text-gray-700 mb-1">
              Voting Start *
            </label>
            <input
              type="datetime-local"
              id="votingStart"
              value={votingStart}
              onChange={(e) => setVotingStart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            />
          </div>
          
          {/* Voting end */}
          <div>
            <label htmlFor="votingEnd" className="block text-sm font-medium text-gray-700 mb-1">
              Voting End *
            </label>
            <input
              type="datetime-local"
              id="votingEnd"
              value={votingEnd}
              onChange={(e) => setVotingEnd(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            />
          </div>
        </div>
        
        {/* Form actions */}
        <div className="flex justify-end space-x-3 pt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2"
          >
            {isSubmitting ? 'Updating...' : 'Update Issue'}
          </Button>
        </div>
      </form>
    </div>
  );
} 