'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { createIssue } from '@/api/issues';

/**
 * Create Issue Page - Admin only
 * Allows administrators to create new issues with submission and voting periods
 */
export default function CreateIssuePage() {
  const router = useRouter();
  const { user, loading, hasRole } = useAuth();
  
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
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      await createIssue({
        title,
        description,
        submissionStart,
        submissionEnd,
        votingStart,
        votingEnd
      });
      
      setSuccess(true);
      
      // Reset form
      setTitle('');
      setDescription('');
      setSubmissionStart('');
      setSubmissionEnd('');
      setVotingStart('');
      setVotingEnd('');
      
      // Redirect after delay
      setTimeout(() => {
        router.push('/account/manage-issues');
      }, 2000);
    } catch (err) {
      console.error('Failed to create issue:', err);
      setError('Failed to create issue. Please try again.');
    } finally {
      setIsSubmitting(false);
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
      <h1 className="text-2xl font-bold mb-6">Create New Issue</h1>
      
      {/* Success message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          Issue created successfully! Redirecting...
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
            Title
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
            Description
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
        
        {/* Date fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Submission start */}
          <div>
            <label htmlFor="submissionStart" className="block text-sm font-medium text-gray-700 mb-1">
              Submission Start
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
              Submission End
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
              Voting Start
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
              Voting End
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
        
        {/* Submit button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center"
          >
            {isSubmitting ? (
              <>
                <span className="mr-2">Creating...</span>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </>
            ) : 'Create Issue'}
          </Button>
        </div>
      </form>
    </div>
  );
} 