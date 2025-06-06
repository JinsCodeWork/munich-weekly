"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

interface MigrationStatus {
  inProgress: boolean;
  status: 'idle' | 'running' | 'completed' | 'error' | 'stopped' | 'stopping';
  totalCount: number;
  processedCount: number;
  successCount: number;
  errorCount: number;
  progressPercentage: number;
}

interface AnalysisResult {
  totalSubmissions: number;
  submissionsWithDimensions: number;
  submissionsNeedingMigration: number;
  migrationRequired: boolean;
  currentOptimizationPercentage: number;
}

/**
 * Admin-only page for safe production data migration
 * Allows batch processing of existing submissions to add image dimensions
 */
export default function DataMigrationPage() {
  const { user, loading, token } = useAuth();
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [batchSize, setBatchSize] = useState(5);
  const [delayMs, setDelayMs] = useState(2000);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Auto-refresh status during migration
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (migrationStatus?.inProgress) {
      intervalId = setInterval(() => {
        fetchMigrationStatus();
      }, 2000); // Refresh every 2 seconds during migration
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [migrationStatus?.inProgress]);

  const fetchMigrationStatus = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/admin/migration/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const status = await response.json();
        setMigrationStatus(status);
      }
    } catch (err) {
      console.error('Error fetching migration status:', err);
    }
  }, [token]);

  const analyzeSubmissions = useCallback(async () => {
    if (!token) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/migration/analyze', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const analysis = await response.json();
        setAnalysisResult(analysis);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to analyze submissions');
      }
    } catch (err) {
      setError('Network error while analyzing submissions');
      console.error('Error analyzing submissions:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [token]);

  const startMigration = useCallback(async () => {
    if (!token) return;
    
    setError(null);
    
    try {
      const response = await fetch('/api/admin/migration/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `batchSize=${batchSize}&delayMs=${delayMs}`,
      });
      
      if (response.ok) {
        fetchMigrationStatus();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to start migration');
      }
    } catch (err) {
      setError('Network error while starting migration');
      console.error('Error starting migration:', err);
    }
  }, [batchSize, delayMs, fetchMigrationStatus, token]);

  const stopMigration = useCallback(async () => {
    if (!token) return;
    
    setError(null);
    
    try {
      const response = await fetch('/api/admin/migration/stop', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        fetchMigrationStatus();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to stop migration');
      }
    } catch (err) {
      setError('Network error while stopping migration');
      console.error('Error stopping migration:', err);
    }
  }, [fetchMigrationStatus, token]);

  // Initialize data on component mount
  useEffect(() => {
    if (isAdmin) {
      fetchMigrationStatus();
      analyzeSubmissions();
    }
  }, [isAdmin, fetchMigrationStatus, analyzeSubmissions]);

  // Loading state
  if (loading) {
    return (
      <Container className="py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </Container>
    );
  }

  // Access control
  if (!isAdmin) {
    return (
      <Container className="py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">数据迁移管理</h1>
          <p className="text-gray-600">
            安全批量处理现有submissions，为其添加图片尺寸信息以优化布局性能
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">错误</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">数据分析</h2>
            <Button
              onClick={analyzeSubmissions}
              disabled={isAnalyzing}
              variant="secondary"
              className="flex items-center"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  分析中...
                </>
              ) : (
                '重新分析'
              )}
            </Button>
          </div>

          {analysisResult ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-600">总投稿数</p>
                <p className="text-2xl font-bold text-blue-900">{analysisResult.totalSubmissions}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm font-medium text-green-600">已优化</p>
                <p className="text-2xl font-bold text-green-900">{analysisResult.submissionsWithDimensions}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-600">需要迁移</p>
                <p className="text-2xl font-bold text-yellow-900">{analysisResult.submissionsNeedingMigration}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm font-medium text-purple-600">优化比例</p>
                <p className="text-2xl font-bold text-purple-900">
                  {analysisResult.currentOptimizationPercentage.toFixed(1)}%
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
              <p className="text-gray-600">正在分析数据...</p>
            </div>
          )}
        </div>

        {/* Migration Configuration */}
        {analysisResult && analysisResult.migrationRequired && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">迁移配置</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  批次大小 (1-20)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value) || 5)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={migrationStatus?.inProgress}
                />
                <p className="text-xs text-gray-500 mt-1">
                  每批处理的投稿数量，较小的值更安全
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  批次间隔 (1000-30000ms)
                </label>
                <input
                  type="number"
                  min="1000"
                  max="30000"
                  step="500"
                  value={delayMs}
                  onChange={(e) => setDelayMs(parseInt(e.target.value) || 2000)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={migrationStatus?.inProgress}
                />
                <p className="text-xs text-gray-500 mt-1">
                  批次之间的延迟时间，避免服务器过载
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Migration Status */}
        {migrationStatus && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">迁移状态</h2>
            
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">状态:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  migrationStatus.status === 'running' ? 'bg-blue-100 text-blue-800' :
                  migrationStatus.status === 'completed' ? 'bg-green-100 text-green-800' :
                  migrationStatus.status === 'error' ? 'bg-red-100 text-red-800' :
                  migrationStatus.status === 'stopped' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {migrationStatus.status === 'running' ? '运行中' :
                   migrationStatus.status === 'completed' ? '已完成' :
                   migrationStatus.status === 'error' ? '错误' :
                   migrationStatus.status === 'stopped' ? '已停止' :
                   migrationStatus.status === 'stopping' ? '停止中' :
                   '空闲'}
                </span>
              </div>

              {/* Progress Bar */}
              {migrationStatus.totalCount > 0 && (
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>进度: {migrationStatus.processedCount} / {migrationStatus.totalCount}</span>
                    <span>{migrationStatus.progressPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${migrationStatus.progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{migrationStatus.processedCount}</p>
                  <p className="text-sm text-gray-600">已处理</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{migrationStatus.successCount}</p>
                  <p className="text-sm text-gray-600">成功</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{migrationStatus.errorCount}</p>
                  <p className="text-sm text-gray-600">失败</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {analysisResult && (
          <div className="flex space-x-4">
            {analysisResult.migrationRequired ? (
              migrationStatus?.inProgress ? (
                <Button
                  onClick={stopMigration}
                  variant="danger"
                  className="flex items-center"
                >
                  停止迁移
                </Button>
              ) : (
                <Button
                  onClick={startMigration}
                  className="flex items-center bg-blue-600 hover:bg-blue-700"
                >
                  开始迁移
                </Button>
              )
            ) : (
              <div className="flex items-center text-green-600">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                所有投稿都已优化，无需迁移
              </div>
            )}
            
            <Button
              onClick={analyzeSubmissions}
              variant="secondary"
              disabled={isAnalyzing || migrationStatus?.inProgress}
            >
              刷新分析
            </Button>
          </div>
        )}

        {/* Safety Information */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">安全提示</h3>
              <p className="mt-1 text-sm text-yellow-700">
                此操作会修改生产数据库中的现有投稿记录。迁移过程是安全的，只会添加图片尺寸信息，
                不会删除或修改现有数据。建议在低峰期执行，可随时停止。
              </p>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
} 