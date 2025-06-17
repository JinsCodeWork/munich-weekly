/**
 * Promotion Configuration Selector
 * Component for browsing and selecting promotion configurations
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { PromotionConfig } from '@/types/promotion';
import { getAllPromotionConfigsForAdmin, getPromotionConfigByIdForAdmin, deletePromotionConfig } from '@/api/promotion';

interface PromotionConfigSelectorProps {
  currentConfig: PromotionConfig | null;
  onConfigSelect: (config: PromotionConfig) => void;
  onNewConfig: () => void;
  onConfigDeleted?: () => void; // Callback when a config is deleted
}

export const PromotionConfigSelector: React.FC<PromotionConfigSelectorProps> = ({
  currentConfig,
  onConfigSelect,
  onNewConfig,
  onConfigDeleted,
}) => {
  const [configs, setConfigs] = useState<PromotionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [deletingConfigId, setDeletingConfigId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  // Load all configurations
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        setLoading(true);
        setError(null);
        const allConfigs = await getAllPromotionConfigsForAdmin();
        setConfigs(allConfigs);
      } catch (err) {
        console.error('Failed to load promotion configs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load configurations');
      } finally {
        setLoading(false);
      }
    };

    loadConfigs();
  }, []);

  const handleConfigSelect = async (configId: number) => {
    try {
      const selectedConfig = await getPromotionConfigByIdForAdmin(configId);
      onConfigSelect(selectedConfig);
      setShowDropdown(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    }
  };

  const handleDeleteConfig = async (configId: number) => {
    try {
      setDeletingConfigId(configId);
      await deletePromotionConfig(configId);
      
      // Remove from local state
      setConfigs(prev => prev.filter(c => c.id !== configId));
      
      // If we deleted the current config, notify parent
      if (currentConfig?.id === configId) {
        onConfigDeleted?.();
      }
      
      setShowDeleteConfirm(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete configuration');
    } finally {
      setDeletingConfigId(null);
    }
  };

  const formatConfigDisplayName = (config: PromotionConfig) => {
    if (config.navTitle) {
      return `${config.navTitle} (${config.pageUrl || 'no-url'})`;
    }
    return config.pageUrl || `Config #${config.id}`;
  };

  const formatConfigDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
        <span>Loading configurations...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Select Configuration
          </label>
          
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <div className="flex items-center gap-2">
                {currentConfig ? (
                  <>
                    <div className={`w-2 h-2 rounded-full ${currentConfig.isEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-gray-900">
                      {formatConfigDisplayName(currentConfig)}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500">Select a configuration...</span>
                )}
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {configs.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <p>No configurations found</p>
                    <p className="text-sm mt-1">Create your first configuration below</p>
                  </div>
                ) : (
                  configs.map((config) => (
                    <div
                      key={config.id}
                      className={`flex items-center justify-between px-3 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                        currentConfig?.id === config.id ? 'bg-purple-50' : ''
                      }`}
                    >
                      <button
                        onClick={() => handleConfigSelect(config.id)}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${config.isEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatConfigDisplayName(config)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {config.isEnabled ? 'Enabled' : 'Disabled'} • Created {formatConfigDate(config.createdAt)}
                            </div>
                          </div>
                        </div>
                      </button>
                      
                      <div className="flex items-center gap-1 ml-2">
                        {currentConfig?.id === config.id && (
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        
                        {/* Delete confirmation popup */}
                        {showDeleteConfirm === config.id ? (
                          <div className="flex items-center gap-1 bg-red-50 rounded px-2 py-1 border border-red-200">
                            <span className="text-xs text-red-700">Delete?</span>
                            <button
                              onClick={() => handleDeleteConfig(config.id)}
                              disabled={deletingConfigId === config.id}
                              className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              {deletingConfigId === config.id ? '...' : 'Yes'}
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(null)}
                              className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(config.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete configuration"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="pt-6">
          <Button
            variant="outline"
            size="md"
            onClick={() => {
              onNewConfig();
              setShowDropdown(false);
            }}
            className="whitespace-nowrap"
          >
            Create New
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Summary */}
      {configs.length > 0 && (
        <div className="text-sm text-gray-500 mb-4">
          {configs.length} configuration{configs.length !== 1 ? 's' : ''} found • 
          {configs.filter(c => c.isEnabled).length} enabled
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => setShowDropdown(false)}
        ></div>
      )}
    </div>
  );
}; 