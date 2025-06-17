/**
 * Promotion Configuration Form
 * Form component for managing promotion settings
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { PromotionConfig } from '@/types/promotion';
import { updatePromotionConfig } from '@/api/promotion';

interface PromotionConfigFormProps {
  config: PromotionConfig | null;
  onConfigUpdate: (config: PromotionConfig) => void;
}

export const PromotionConfigForm: React.FC<PromotionConfigFormProps> = ({
  config,
  onConfigUpdate,
}) => {
  const [formData, setFormData] = useState({
    isEnabled: false,
    navTitle: '',
    pageUrl: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Update form data when config changes
  useEffect(() => {
    if (config) {
      setFormData({
        isEnabled: config.isEnabled,
        navTitle: config.navTitle,
        pageUrl: config.pageUrl,
        description: config.description || '',
      });
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate form data
      if (!formData.navTitle.trim()) {
        throw new Error('Navigation title is required');
      }
      if (!formData.pageUrl.trim()) {
        throw new Error('Page URL is required');
      }

      // Validate page URL format
      const urlPattern = /^[a-z0-9-]+$/;
      if (!urlPattern.test(formData.pageUrl.trim())) {
        throw new Error('Page URL can only contain lowercase letters, numbers, and hyphens');
      }

      // Additional validation: page URL cannot start or end with hyphens
      const trimmedUrl = formData.pageUrl.trim();
      if (trimmedUrl.startsWith('-') || trimmedUrl.endsWith('-')) {
        throw new Error('Page URL cannot start or end with hyphens');
      }

      const updatedConfig = await updatePromotionConfig(formData);
      onConfigUpdate(updatedConfig);
      setSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Promotion Configuration
        </h2>
        <p className="text-gray-600">
          Configure the promotion settings that will be displayed on your platform.
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-700 font-medium">Configuration updated successfully!</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <label htmlFor="isEnabled" className="text-sm font-medium text-gray-900">
              Enable Promotion
            </label>
            <p className="text-sm text-gray-600">
              When enabled, the promotion link will appear in the navigation
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="isEnabled"
              name="isEnabled"
              checked={formData.isEnabled}
              onChange={handleInputChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        {/* Navigation Title */}
        <div>
          <label htmlFor="navTitle" className="block text-sm font-medium text-gray-900 mb-2">
            Navigation Title *
          </label>
          <input
            type="text"
            id="navTitle"
            name="navTitle"
            value={formData.navTitle}
            onChange={handleInputChange}
            placeholder="e.g., Christmas 2024, Summer Sale, Special Event"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            This will be displayed in the navigation bar
          </p>
        </div>

        {/* Page URL */}
        <div>
          <label htmlFor="pageUrl" className="block text-sm font-medium text-gray-900 mb-2">
            Page URL *
          </label>
          <div className="flex items-center">
            <span className="text-gray-500 text-sm mr-2">/</span>
            <input
              type="text"
              id="pageUrl"
              name="pageUrl"
              value={formData.pageUrl}
              onChange={handleInputChange}
              placeholder="e.g., christmas-2024, summer-sale"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              pattern="[a-z0-9-]+"
              required
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            URL slug (lowercase letters, numbers, and hyphens only)
          </p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">
            Promotion Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter a description for this promotion that will be displayed below the title..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-vertical"
            maxLength={1000}
          />
          <p className="text-sm text-gray-500 mt-1">
            This description will appear below the title on the promotion page (optional, max 1000 characters)
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </div>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>

      {/* Current Status */}
      {config && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Current Status</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${config.isEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                {config.isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Last Updated:</span>
              <span className="text-gray-900">
                {new Date(config.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            {config.isEnabled && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Live URL:</span>
                <a 
                  href={`/${config.pageUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-800 underline"
                >
                  /{config.pageUrl}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 