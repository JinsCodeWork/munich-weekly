'use client';

import React from 'react';
import { Issue } from '@/types/submission';
import { formatDate } from '@/lib/utils';

interface IssueSelectorProps {
  issues: Issue[];
  selectedIssue: Issue | null;
  onSelectIssue: (issue: Issue | null) => void;
}

/**
 * Issue Selector Component
 * Displays available issues and allows user to select one
 */
export default function IssueSelector({ 
  issues, 
  selectedIssue, 
  onSelectIssue 
}: IssueSelectorProps) {
  
  // Handle selection change
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const issueId = parseInt(e.target.value);
    const selected = issues.find(issue => issue.id === issueId) || null;
    onSelectIssue(selected);
  };
  
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="issue-select" className="block text-sm font-medium text-gray-700 mb-1">
          Select an Issue
        </label>
        <select
          id="issue-select"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={selectedIssue?.id || ''}
          onChange={handleSelectChange}
        >
          <option value="">-- Select an issue --</option>
          {issues.map(issue => (
            <option key={issue.id} value={issue.id}>
              {issue.title}
            </option>
          ))}
        </select>
      </div>
      
      {/* Display selected issue details */}
      {selectedIssue && (
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-medium text-gray-900 mb-2">{selectedIssue.title}</h3>
          <p className="text-sm text-gray-600 mb-3">{selectedIssue.description}</p>
          
          <div className="text-xs text-gray-500">
            <div className="flex items-center mb-1">
              <i className="fa-regular fa-calendar-alt mr-2"></i>
              <span>
                Submission period: {formatDate(selectedIssue.submissionStart)} - {formatDate(selectedIssue.submissionEnd)}
              </span>
            </div>
            
            <div className="flex items-center">
              <i className="fa-regular fa-clock mr-2"></i>
              <span>
                Voting period: {formatDate(selectedIssue.votingStart)} - {formatDate(selectedIssue.votingEnd)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 