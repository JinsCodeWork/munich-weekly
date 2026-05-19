'use client';

import Image from 'next/image';
import {
  Trash2,
  Upload,
  RefreshCw,
  BookOpen,
  CheckCircle,
  Eye,
  ArrowUpDown,
  Circle,
} from 'lucide-react';
import { GalleryIssueConfig } from '@/api/gallery/types';

export interface IssueConfigTableProps {
  galleryConfigs: GalleryIssueConfig[];
  isLoading: boolean;
  uploadingCoverId: number | null;
  onCoverUpload: (config: GalleryIssueConfig, file: File) => void;
  onManageSubmissions: (config: GalleryIssueConfig) => void;
  onTogglePublished: (config: GalleryIssueConfig) => void;
  onDelete: (config: GalleryIssueConfig) => void;
}

export function IssueConfigTable({
  galleryConfigs,
  isLoading,
  uploadingCoverId,
  onCoverUpload,
  onManageSubmissions,
  onTogglePublished,
  onDelete,
}: IssueConfigTableProps) {
  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Gallery Issues ({galleryConfigs.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-700 rounded-lg mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        ) : galleryConfigs.length === 0 ? (
          <div className="p-6 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No gallery issues configured</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Add issues to display them in the public gallery
            </p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {[...galleryConfigs]
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((config) => (
                  <div key={config.id} className="group relative">
                    <div className="aspect-[3/4] relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700 mb-3">
                      {config.coverImageUrl ? (
                        <Image
                          src={config.coverImageUrl}
                          alt={config.issue.title}
                          fill
                          className="object-cover transition-all duration-300"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <Upload className="w-8 h-8 mb-2" />
                          <span className="text-sm">No Cover</span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity duration-300" />

                      <div className="absolute top-2 right-2">
                        {config.isPublished ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 shadow-sm">
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 shadow-sm">
                            Draft
                          </span>
                        )}
                      </div>

                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    onCoverUpload(config, file);
                                  }
                                }}
                              />
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center hover:bg-opacity-30 transition-colors">
                                {uploadingCoverId === config.id ? (
                                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-spin" />
                                ) : (
                                  <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                )}
                              </div>
                            </label>

                            <button
                              onClick={() => onManageSubmissions(config)}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center hover:bg-opacity-30 transition-colors"
                              title="Manage submissions"
                            >
                              <ArrowUpDown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </button>

                            <button
                              onClick={() => window.open(`/gallery/${config.issueId}`, '_blank')}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center hover:bg-opacity-30 transition-colors"
                              title="View in gallery"
                            >
                              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3">
                            <button
                              onClick={() => onTogglePublished(config)}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center hover:bg-opacity-30 transition-colors"
                              title={config.isPublished ? 'Unpublish' : 'Publish'}
                            >
                              {config.isPublished ? (
                                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                              ) : (
                                <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                              )}
                            </button>

                            <button
                              onClick={() => onDelete(config)}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-500 bg-opacity-70 backdrop-blur-sm flex items-center justify-center hover:bg-opacity-90 transition-colors"
                              title="Delete configuration"
                            >
                              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="group-hover:cursor-pointer text-center">
                      <h3 className="text-base font-medium text-gray-900 dark:text-white relative transition-colors group-hover:text-gray-700 dark:group-hover:text-gray-300 gallery-issue-title inline-block">
                        {config.issue.title}
                      </h3>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .gallery-issue-title::after {
          content: '';
          position: absolute;
          height: 1px;
          bottom: -2px;
          left: 0;
          right: 0;
          background-color: currentColor;
          transform-origin: center;
          transition: transform 0.3s ease, opacity 0.3s ease;
          transform: scaleX(0);
          opacity: 0;
        }

        .group:hover .gallery-issue-title::after {
          transform: scaleX(1);
          opacity: 1;
        }
      `}</style>
    </>
  );
}
