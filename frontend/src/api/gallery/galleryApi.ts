import {
  FeaturedSubmission,
  GalleryStats,
  ConfigResponse,
  ConfigsResponse,
  SaveConfigRequest,
  SaveConfigResponse,
  SubmissionPreviewResponse,
  FeaturedStatusResponse,
  DeleteConfigResponse
} from './types';
import { getAuthHeader } from '../http';

// Base API URL - using relative paths for same-domain deployment
const API_BASE = '/api/gallery';

/**
 * Handle API response with proper error handling
 */
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

// ========== Public API Functions ==========

/**
 * Get featured submissions for carousel display (public)
 * GET /api/gallery/featured
 */
export async function getFeaturedSubmissions(): Promise<FeaturedSubmission[]> {
  try {
    const response = await fetch(`${API_BASE}/featured`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await handleApiResponse<FeaturedSubmission[]>(response);
    console.log('✅ Featured submissions loaded:', data.length, 'items');
    return data;
  } catch (error) {
    console.error('❌ Failed to load featured submissions:', error);
    throw error;
  }
}

/**
 * Get gallery statistics (public)
 * GET /api/gallery/stats
 */
export async function getGalleryStats(): Promise<GalleryStats> {
  try {
    const response = await fetch(`${API_BASE}/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await handleApiResponse<GalleryStats>(response);
    console.log('✅ Gallery stats loaded:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to load gallery stats:', error);
    throw error;
  }
}

// ========== Admin API Functions ==========

/**
 * Get current active gallery configuration (admin only)
 * GET /api/gallery/featured/config
 */
export async function getActiveConfig(): Promise<ConfigResponse> {
  try {
    const authHeaders = getAuthHeader();
    const response = await fetch(`${API_BASE}/featured/config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      credentials: 'include', // Include cookies for authentication
    });

    const data = await handleApiResponse<ConfigResponse>(response);
    console.log('✅ Active config loaded:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to load active config:', error);
    throw error;
  }
}

/**
 * Get all gallery configurations (admin only)
 * GET /api/gallery/featured/configs
 */
export async function getAllConfigs(): Promise<ConfigsResponse> {
  try {
    const authHeaders = getAuthHeader();
    const response = await fetch(`${API_BASE}/featured/configs`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      credentials: 'include',
    });

    const data = await handleApiResponse<ConfigsResponse>(response);
    console.log('✅ All configs loaded:', data.total, 'configs');
    return data;
  } catch (error) {
    console.error('❌ Failed to load all configs:', error);
    throw error;
  }
}

/**
 * Save gallery configuration (admin only)
 * POST /api/gallery/featured/config
 */
export async function saveConfig(config: SaveConfigRequest): Promise<SaveConfigResponse> {
  try {
    console.log('📤 Saving gallery config:', config);

    const authHeaders = getAuthHeader();
    const response = await fetch(`${API_BASE}/featured/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      credentials: 'include',
      body: JSON.stringify(config),
    });

    const data = await handleApiResponse<SaveConfigResponse>(response);
    console.log('✅ Config saved successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to save config:', error);
    throw error;
  }
}

/**
 * Delete gallery configuration (admin only)
 * DELETE /api/gallery/featured/config/{id}
 */
export async function deleteConfig(configId: number): Promise<DeleteConfigResponse> {
  try {
    console.log('🗑️ Deleting config ID:', configId);

    const authHeaders = getAuthHeader();
    const response = await fetch(`${API_BASE}/featured/config/${configId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      credentials: 'include',
    });

    const data = await handleApiResponse<DeleteConfigResponse>(response);
    console.log('✅ Config deleted successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to delete config:', error);
    throw error;
  }
}

/**
 * Preview submission by ID (admin only)
 * GET /api/gallery/submissions/{id}/preview
 */
export async function previewSubmission(submissionId: number): Promise<SubmissionPreviewResponse> {
  try {
    const authHeaders = getAuthHeader();
    const response = await fetch(`${API_BASE}/submissions/${submissionId}/preview`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      credentials: 'include',
    });

    const data = await handleApiResponse<SubmissionPreviewResponse>(response);
    console.log('✅ Submission preview loaded:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to preview submission:', error);
    throw error;
  }
}

/**
 * Check if submission is featured (admin only)
 * GET /api/gallery/submissions/{id}/featured-status
 */
export async function checkFeaturedStatus(submissionId: number): Promise<FeaturedStatusResponse> {
  try {
    const authHeaders = getAuthHeader();
    const response = await fetch(`${API_BASE}/submissions/${submissionId}/featured-status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      credentials: 'include',
    });

    const data = await handleApiResponse<FeaturedStatusResponse>(response);
    console.log('✅ Featured status checked:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to check featured status:', error);
    throw error;
  }
}

// ========== Utility Functions ==========

/**
 * Validate submission IDs format
 */
export function validateSubmissionIds(idsString: string): { isValid: boolean; ids: number[]; errors: string[] } {
  const errors: string[] = [];
  const ids: number[] = [];

  if (!idsString.trim()) {
    return { isValid: true, ids: [], errors: [] }; // Empty is valid
  }

  const parts = idsString.split(',').map(s => s.trim()).filter(s => s);

  for (const part of parts) {
    const num = parseInt(part, 10);
    if (isNaN(num) || num <= 0) {
      errors.push(`Invalid ID: "${part}"`);
    } else {
      ids.push(num);
    }
  }

  // Check for duplicates
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length !== ids.length) {
    errors.push('Duplicate IDs found');
  }

  return {
    isValid: errors.length === 0,
    ids: uniqueIds,
    errors
  };
}

/**
 * Generate display order array from submission IDs
 */
export function generateDisplayOrder(submissionIds: number[]): number[] {
  return submissionIds.map((_, index) => index + 1);
}

/**
 * Format submission IDs for display
 */
export function formatSubmissionIds(ids: number[]): string {
  return ids.join(', ');
}

/**
 * Check if aspect ratio indicates a wide image (suitable for spanning)
 */
export function isWideImage(aspectRatio?: number): boolean {
  return aspectRatio ? aspectRatio >= 1.6 : false;
}

const galleryApi = {
  // Public APIs
  getFeaturedSubmissions,
  getGalleryStats,

  // Admin APIs
  getActiveConfig,
  getAllConfigs,
  saveConfig,
  deleteConfig,
  previewSubmission,
  checkFeaturedStatus,

  // Utilities
  validateSubmissionIds,
  generateDisplayOrder,
  formatSubmissionIds,
  isWideImage,
};

export default galleryApi; 