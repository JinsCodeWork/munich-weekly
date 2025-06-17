/**
 * Promotion Settings Page
 * Admin interface for managing promotion configuration and images
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { 
  PromotionConfigForm, 
  PromotionImageManager, 
  PromotionConfigSelector 
} from '@/components/promotion/admin';
import { PromotionConfig } from '@/types/promotion';
import { getPromotionConfigForAdmin } from '@/api/promotion';

export default function PromotionSettingsPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<PromotionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'images'>('config');

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      window.location.href = '/account';
    }
  }, [user]);

  // Load promotion configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading promotion config for admin...');
        const configData = await getPromotionConfigForAdmin();
        console.log('Loaded config data:', configData);
        setConfig(configData);
      } catch (err) {
        console.error('Failed to load promotion config:', err);
        setError(err instanceof Error ? err.message : 'Failed to load promotion configuration');
      } finally {
        setLoading(false);
      }
    };

    // Only load if user is authenticated and admin
    if (user && user.role === 'admin') {
      loadConfig();
    } else if (user && user.role !== 'admin') {
      setError('Access denied: Admin privileges required');
      setLoading(false);
    }
  }, [user]);

  const handleConfigUpdate = (updatedConfig: PromotionConfig) => {
    setConfig(updatedConfig);
  };

  const handleConfigSelect = (selectedConfig: PromotionConfig) => {
    setConfig(selectedConfig);
  };

  const handleNewConfig = () => {
    setConfig(null);
  };

  const handleConfigDeleted = () => {
    setConfig(null);
    // Switch to config tab to show the selector
    setActiveTab('config');
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Manually refreshing promotion config...');
      const configData = await getPromotionConfigForAdmin();
      console.log('Refreshed config data:', configData);
      setConfig(configData);
    } catch (err) {
      console.error('Failed to refresh promotion config:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh promotion configuration');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
            <p className="text-gray-600">Loading promotion settings...</p>
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-red-900">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </Container>
    );
  }

      return (
      <Container className="py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Promotion Settings
              </h1>
              <p className="text-gray-600">
                Manage promotion configuration and images for the platform
              </p>
            </div>
            <Button
              variant="outline"
              size="md"
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'config'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Configuration
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'images'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Images Management
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'config' && (
        <div className="max-w-2xl">
          {/* Configuration Selector */}
          <div className="mb-8">
            <PromotionConfigSelector
              currentConfig={config}
              onConfigSelect={handleConfigSelect}
              onNewConfig={handleNewConfig}
              onConfigDeleted={handleConfigDeleted}
            />
          </div>
          
          {/* Configuration Form */}
          <PromotionConfigForm 
            config={config} 
            onConfigUpdate={handleConfigUpdate}
          />
        </div>
      )}

      {activeTab === 'images' && config && config.id && (
        <div className="max-w-4xl">
          <PromotionImageManager configId={config.id} />
        </div>
      )}

      {activeTab === 'images' && (!config || !config.id) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-yellow-900">Configuration Required</h3>
              <p className="text-yellow-700">
                You need to create and save a promotion configuration before you can manage images.
              </p>
              <p className="text-yellow-600 text-sm mt-2">
                Please go to the &quot;Configuration&quot; tab, fill in the promotion details, and click &quot;Save Configuration&quot; first.
              </p>
            </div>
            <Button 
              variant="primary" 
              size="sm" 
              className="mt-4"
              onClick={() => setActiveTab('config')}
            >
              Go to Configuration
            </Button>
          </div>
        </div>
      )}
    </Container>
  );
} 