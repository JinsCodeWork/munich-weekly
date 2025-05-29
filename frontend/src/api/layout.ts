/**
 * Layout API client for masonry ordering calculations
 * Integrates with the backend ordering service for hybrid approach
 */

import { fetchAPI } from './http';

// Type definitions for ordering API
export interface MasonryOrderApiResponse {
  order: MasonryOrderResult;
  cacheInfo: OrderCacheInfo;
}

export interface MasonryOrderResult {
  orderedIds2col: number[];
  orderedIds4col: number[];
  wideImageCount: number;
  avgAspectRatio: number;
  totalItems: number;
}

export interface OrderCacheInfo {
  calculatedAt: string;
  issueId: number;
  isFromCache: boolean;
  dataVersionHash: string;
  calculationTimeMs: number;
}

/**
 * API endpoints for layout service
 */
export const LAYOUT_ENDPOINTS = {
  order: '/api/layout/order',            // Ordering-only endpoint
  health: '/api/layout/health',
  debug: '/api/layout/debug',
} as const;

/**
 * Layout service error types
 */
export class LayoutApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly endpoint?: string
  ) {
    super(message);
    this.name = 'LayoutApiError';
  }
}

/**
 * Layout API client with enhanced error handling
 */
export const layoutApi = {
  /**
   * Get optimal masonry ordering for hybrid approach
   * 
   * @param issueId The issue ID to get ordering for
   * @returns Promise with pre-calculated ordering for 2-col and 4-col layouts
   */
  async getMasonryOrdering(issueId: number): Promise<MasonryOrderApiResponse> {
    if (!issueId || issueId <= 0) {
      throw new LayoutApiError('Invalid issue ID provided');
    }

    const url = `${LAYOUT_ENDPOINTS.order}?issueId=${issueId}`;
    
    try {
      const startTime = performance.now();
      const data = await fetchAPI<MasonryOrderApiResponse>(url, {
        method: 'GET',
      });
      
      const duration = performance.now() - startTime;
      
      // Log performance metrics
      console.log(`🎯 Ordering API: issue=${issueId}, 2col=${data.order.orderedIds2col.length}, 4col=${data.order.orderedIds4col.length}, cached=${data.cacheInfo.isFromCache}, duration=${duration.toFixed(2)}ms`);
      
      // Validate response structure
      if (!data.order || !Array.isArray(data.order.orderedIds2col) || !Array.isArray(data.order.orderedIds4col)) {
        throw new LayoutApiError('Invalid response structure from ordering API');
      }
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to fetch masonry ordering:', {
        issueId,
        error: errorMessage,
        endpoint: url
      });
      
      throw new LayoutApiError(
        `Failed to fetch ordering: ${errorMessage}`,
        undefined,
        url
      );
    }
  }
}; 