'use client';

import React from 'react';
import { AvailableIssue } from '@/api/gallery/types';
import { Button } from '@/components/ui/Button';

interface CreateIssueFormData {
  selectedIssueId: number | null;
  isPublished: boolean;
}

export interface CreateIssueConfigFormProps {
  availableIssues: AvailableIssue[];
  formData: CreateIssueFormData;
  setFormData: React.Dispatch<React.SetStateAction<CreateIssueFormData>>;
  onCreate: () => void;
  onCancel: () => void;
}

export function CreateIssueConfigForm({
  availableIssues,
  formData,
  setFormData,
  onCreate,
  onCancel,
}: CreateIssueConfigFormProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Add Issue to Gallery
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Issue
              </label>
              <select
                value={formData.selectedIssueId || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    selectedIssueId: parseInt(e.target.value) || null,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select an issue...</option>
                {availableIssues.map((issue) => (
                  <option key={issue.id} value={issue.id}>
                    {issue.title} ({issue.selectedSubmissionCount} selected submissions)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isPublished: e.target.checked }))
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isPublished" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Publish immediately
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <Button onClick={onCreate} disabled={!formData.selectedIssueId} className="flex-1">
              Create Configuration
            </Button>
            <Button variant="ghost" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
