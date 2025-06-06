import React from 'react';
import { Issue } from '@/types/submission';
import { formatDate } from '@/lib/utils';

interface IssueSelectorProps {
  issues: Issue[];
  selectedIssue: Issue | null;
  onSelectIssue: (issue: Issue | null) => void;
  className?: string;
  label?: string;
  placeholder?: string;
  showDetails?: boolean;
}

/**
 * Issue Selector Component
 * Displays available issues and allows user to select one
 */
export function IssueSelector({ 
  issues, 
  selectedIssue, 
  onSelectIssue,
  className,
  label = "Select an Issue",
  placeholder = "-- Select an issue --",
  showDetails = true
}: IssueSelectorProps) {
  
  // Sort issues by ID in descending order (newest first)
  const sortedIssues = [...issues].sort((a, b) => b.id - a.id);
  
  // Handle selection change
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const issueId = parseInt(e.target.value);
    const selected = sortedIssues.find(issue => issue.id === issueId) || null;
    onSelectIssue(selected);
  };
  
  return (
    <div className={`space-y-4 ${className || ''}`}>
      <div>
        <label htmlFor="issue-select" className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <select
          id="issue-select"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
          value={selectedIssue?.id || ''}
          onChange={handleSelectChange}
        >
          <option value="">{placeholder}</option>
          {sortedIssues.map(issue => (
            <option key={issue.id} value={issue.id}>
              {issue.title}
            </option>
          ))}
        </select>
      </div>
      
      {/* Display selected issue details */}
      {showDetails && selectedIssue && (
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-medium text-gray-900 mb-2">{selectedIssue.title}</h3>
          <p className="text-sm text-gray-600 mb-3">{selectedIssue.description}</p>
          
          <div className="text-xs text-gray-500">
            <div className="flex items-center mb-1">
              <i className="fa-regular fa-calendar-alt mr-2"></i>
              <span>
                Submission period: {formatDate(selectedIssue.submissionStart)} - {formatDate(selectedIssue.submissionEnd)} (CET)
              </span>
            </div>
            
            <div className="flex items-center">
              <i className="fa-regular fa-clock mr-2"></i>
              <span>
                Voting period: {formatDate(selectedIssue.votingStart)} - {formatDate(selectedIssue.votingEnd)} (CET)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 