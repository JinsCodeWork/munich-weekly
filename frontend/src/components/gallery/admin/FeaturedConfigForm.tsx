'use client';

import React from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { AdminFormState } from '@/api/gallery/types';
import { Button } from '@/components/ui/Button';

const inputClass =
  'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400';
const textareaClass =
  'flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-vertical dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:ring-blue-400';

export interface FeaturedConfigFormProps {
  formData: AdminFormState;
  setFormData: React.Dispatch<React.SetStateAction<AdminFormState>>;
  editingConfigId: number | null;
  isSaving: boolean;
  onSave: () => void;
  onReset: () => void;
}

export function FeaturedConfigForm({
  formData,
  setFormData,
  editingConfigId,
  isSaving,
  onSave,
  onReset,
}: FeaturedConfigFormProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {editingConfigId ? 'Edit Configuration' : 'Create Configuration'}
        </h2>
        {editingConfigId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-gray-500 hover:text-gray-700"
          >
            Cancel
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Submission IDs
          </label>
          <input
            type="text"
            placeholder="e.g., 123, 456, 789"
            value={formData.submissionIds}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({ ...prev, submissionIds: e.target.value }))
            }
            className={`${inputClass} ${formData.errors.submissionIds ? 'border-red-500' : ''}`}
          />
          {formData.errors.submissionIds && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {formData.errors.submissionIds}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Enter submission IDs separated by commas
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Configuration Title
          </label>
          <input
            type="text"
            value={formData.configTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({ ...prev, configTitle: e.target.value }))
            }
            className={`${inputClass} ${formData.errors.configTitle ? 'border-red-500' : ''}`}
          />
          {formData.errors.configTitle && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {formData.errors.configTitle}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={formData.configDescription}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData((prev) => ({ ...prev, configDescription: e.target.value }))
            }
            rows={3}
            placeholder="Optional description for this configuration"
            className={textareaClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Autoplay Interval (ms)
          </label>
          <input
            type="number"
            min="1000"
            max="30000"
            step="500"
            value={formData.autoplayInterval}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({
                ...prev,
                autoplayInterval: parseInt(e.target.value) || 5000,
              }))
            }
            className={`${inputClass} ${formData.errors.autoplayInterval ? 'border-red-500' : ''}`}
          />
          {formData.errors.autoplayInterval && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {formData.errors.autoplayInterval}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Time between slides (1000ms - 30000ms)
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
            }
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Set as active configuration
          </label>
        </div>

        <Button onClick={onSave} disabled={isSaving} className="w-full">
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {editingConfigId ? 'Update Configuration' : 'Save Configuration'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
