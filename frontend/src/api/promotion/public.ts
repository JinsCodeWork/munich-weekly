/**
 * Public Promotion API service
 * Provides functions to interact with public promotion-related endpoints
 */

import { fetchAPI } from '../http';
import { PromotionConfig, PromotionPageData } from '@/types/promotion';

/**
 * Get enabled promotion configuration for navigation
 * Public endpoint - no authentication required
 */
export const getEnabledPromotionConfig = async (): Promise<PromotionConfig | null> => {
  try {
    const config = await fetchAPI<PromotionConfig>('/api/promotion/config');
    return config;
  } catch (error) {
    // If there's no enabled promotion or error, return null
    console.warn('No enabled promotion configuration found:', error);
    return null;
  }
};

/**
 * Get promotion page data by page URL
 * Public endpoint - no authentication required
 */
export const getPromotionPageByUrl = async (pageUrl: string): Promise<PromotionPageData | null> => {
  try {
    const pageData = await fetchAPI<PromotionPageData>(`/api/promotion/page/${pageUrl}`);
    return pageData;
  } catch (error) {
    console.error(`Failed to fetch promotion page for URL: ${pageUrl}`, error);
    return null;
  }
}; 