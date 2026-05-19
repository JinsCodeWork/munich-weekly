'use client';

import { Trash2, Eye, RefreshCw, ImageIcon } from 'lucide-react';
import { GalleryFeaturedConfig } from '@/api/gallery/types';
import { formatSubmissionIds } from '@/api/gallery/galleryApi';
import { Button } from '@/components/ui/Button';

export interface FeaturedConfigListProps {
  configs: GalleryFeaturedConfig[];
  isLoading: boolean;
  onRefresh: () => void;
  onEdit: (config: GalleryFeaturedConfig) => void;
  onDelete: (configId: number) => void;
}

export function FeaturedConfigList({
  configs,
  isLoading,
  onRefresh,
  onEdit,
  onDelete,
}: FeaturedConfigListProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Existing Configurations
        </h2>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg animate-pulse"
            >
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : configs.length === 0 ? (
        <div className="text-center py-8">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No configurations found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {configs.map((config) => (
            <div
              key={config.id}
              className={`p-4 border rounded-lg transition-colors ${
                config.isActive
                  ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {config.configTitle}
                    </h3>
                    {config.isActive && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {config.featuredCount} submissions • {config.autoplayInterval}ms interval
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    IDs: {formatSubmissionIds(config.submissionIds)}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(config)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(config.id)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
