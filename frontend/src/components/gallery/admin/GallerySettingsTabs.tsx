'use client';

import Link from 'next/link';
import { BookOpen, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GallerySettingsTabsProps {
  activeTab: 'featured' | 'issues';
}

const tabBaseClass = 'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors';

export function GallerySettingsTabs({ activeTab }: GallerySettingsTabsProps) {
  const getTabClass = (tab: GallerySettingsTabsProps['activeTab']) => cn(
    tabBaseClass,
    activeTab === tab
      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
  );

  return (
    <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
      <nav className="-mb-px flex space-x-8">
        <Link
          href="/account/gallery-settings/featured"
          className={getTabClass('featured')}
        >
          <Layers className="w-4 h-4 inline mr-2" />
          Featured Carousel
        </Link>
        <Link
          href="/account/gallery-settings/issues"
          className={getTabClass('issues')}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          Issue Management
        </Link>
      </nav>
    </div>
  );
}
