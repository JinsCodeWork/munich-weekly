import {
  FeaturedSubmission,
  GalleryStats,
  ConfigResponse,
  ConfigsResponse,
  SaveConfigRequest,
  SaveConfigResponse,
  SubmissionPreviewResponse,
  FeaturedStatusResponse,
  DeleteConfigResponse,
  GalleryIssueConfig,
  GallerySubmission,
  GalleryIssueStats,
  CreateGalleryConfigRequest,
  UpdateGalleryConfigRequest,
  SubmissionOrderUpdate,
  AvailableIssue
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

// ========== NEW: Issue Gallery API Functions ==========

/**
 * Get published gallery issues for public display
 * GET /api/gallery/issues
 */
export async function getPublishedIssues(): Promise<GalleryIssueConfig[]> {
  try {
    const response = await fetch(`${API_BASE}/issues`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await handleApiResponse<{ issues: GalleryIssueConfig[] }>(response);
    console.log('✅ Published gallery issues loaded:', data.issues.length, 'issues');
    return data.issues;
  } catch (error) {
    console.error('❌ Failed to load published issues:', error);
    return [];
  }
}

/**
 * Get gallery issue detail by ID
 * GET /api/gallery/issues/{id}
 */
export async function getIssueDetail(issueId: number): Promise<GalleryIssueConfig> {
  try {
    const response = await fetch(`${API_BASE}/issues/${issueId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await handleApiResponse<{ issue: GalleryIssueConfig; success: boolean }>(response);
    console.log('✅ Gallery issue detail loaded:', data.issue);
    return data.issue;
  } catch (error) {
    console.error('❌ Failed to load issue detail:', error);
    throw error;
  }
}

/**
 * Get submissions for a gallery issue
 * GET /api/gallery/issues/{id}/submissions
 */
export async function getIssueSubmissions(issueId: number): Promise<GallerySubmission[]> {
  try {
    const response = await fetch(`${API_BASE}/issues/${issueId}/submissions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    interface SubmissionOrderResponse {
      id: number;
      displayOrder: number;
      submission: {
        id: number;
        imageUrl: string;
        description: string;
        status: string;
        submittedAt: string;
        imageWidth?: number;
        imageHeight?: number;
        aspectRatio?: number;
        authorNickname: string;
        authorId: number;
      };
    }

    const data = await handleApiResponse<{ submissions: SubmissionOrderResponse[]; total: number; success: boolean }>(response);
    
    // Transform the nested structure to the expected GallerySubmission format
    const submissions: GallerySubmission[] = data.submissions.map((item) => ({
      id: item.submission.id,
      imageUrl: item.submission.imageUrl,
      thumbnailUrl: item.submission.imageUrl, // Use same image for thumbnail for now
      title: item.submission.description || 'Untitled', // Use description as title if no title available
      description: item.submission.description || '',
      authorName: item.submission.authorNickname,
      authorId: item.submission.authorId,
      imageWidth: item.submission.imageWidth,
      imageHeight: item.submission.imageHeight,
      aspectRatio: item.submission.aspectRatio,
      status: item.submission.status as 'selected' | 'cover',
      submittedAt: item.submission.submittedAt,
      displayOrder: item.displayOrder
    }));

    console.log('✅ Issue submissions loaded:', submissions.length, 'submissions');
    return submissions;
  } catch (error) {
    console.error('❌ Failed to load issue submissions:', error);
    throw error;
  }
}

/**
 * Get gallery statistics (updated for issues)
 * GET /api/gallery/issues/stats
 */
export async function getGalleryIssueStats(): Promise<GalleryIssueStats> {
  try {
    const response = await fetch(`${API_BASE}/issues/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await handleApiResponse<GalleryIssueStats>(response);
    console.log('✅ Gallery issue stats loaded:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to load gallery issue stats:', error);
    throw error;
  }
}

// ========== Admin API Functions for Issues ==========

/**
 * Get all gallery configurations (admin only)
 * GET /api/gallery/admin/configs
 */
export async function getGalleryConfigs(): Promise<GalleryIssueConfig[]> {
  try {
    const authHeaders = getAuthHeader();
    const response = await fetch(`${API_BASE}/admin/configs`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      credentials: 'include',
    });

    const data = await handleApiResponse<{ configs: GalleryIssueConfig[] }>(response);
    console.log('✅ Gallery configs loaded:', data.configs.length, 'configs');
    return data.configs;
  } catch (error) {
    console.error('❌ Failed to load gallery configs:', error);
    throw error;
  }
}

/**
 * Create new gallery configuration (admin only)
 * POST /api/gallery/admin/configs
 */
export async function createGalleryConfig(config: CreateGalleryConfigRequest): Promise<GalleryIssueConfig> {
  try {
    console.log('📤 Creating gallery config:', config);

    const authHeaders = getAuthHeader();
    const response = await fetch(`${API_BASE}/admin/configs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      credentials: 'include',
      body: JSON.stringify(config),
    });

    const data = await handleApiResponse<GalleryIssueConfig>(response);
    console.log('✅ Gallery config created successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to create gallery config:', error);
    throw error;
  }
}

/**
 * Update gallery configuration by Issue ID (admin only)
 * PUT /api/gallery/admin/issues/{issueId}
 */
export async function updateGalleryConfigByIssueId(issueId: number, config: UpdateGalleryConfigRequest): Promise<GalleryIssueConfig> {
  try {
    console.log('📤 Updating gallery config for issue ID:', issueId, config);

    const authHeaders = getAuthHeader();
    const response = await fetch(`${API_BASE}/admin/issues/${issueId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      credentials: 'include',
      body: JSON.stringify(config),
    });

    const data = await handleApiResponse<{ config: GalleryIssueConfig }>(response);
    console.log('✅ Gallery config updated successfully:', data.config);
    return data.config;
  } catch (error) {
    console.error('❌ Failed to update gallery config:', error);
    throw error;
  }
}

/**
 * Get gallery configuration by Issue ID (admin only)
 * GET /api/gallery/admin/issues/{issueId}
 */
export async function getGalleryConfigByIssueId(issueId: number): Promise<GalleryIssueConfig> {
  try {
    console.log('📤 Getting gallery config by issue ID:', issueId);

    const authHeaders = getAuthHeader();
    const response = await fetch(`${API_BASE}/admin/issues/${issueId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      credentials: 'include',
    });

    const data = await handleApiResponse<{ config: GalleryIssueConfig }>(response);
    console.log('✅ Gallery config loaded successfully:', data.config);
    return data.config;
  } catch (error) {
    console.error('❌ Failed to load gallery config:', error);
    throw error;
  }
}

/**
 * Delete gallery configuration by Issue ID (admin only)
 * DELETE /api/gallery/admin/issues/{issueId}
 */
export async function deleteGalleryConfigByIssueId(issueId: number): Promise<void> {
  try {
    console.log('🗑️ Deleting gallery config for issue ID:', issueId);

    const authHeaders = getAuthHeader();
    const response = await fetch(`${API_BASE}/admin/issues/${issueId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      credentials: 'include',
    });

    await handleApiResponse<{ message: string }>(response);
    console.log('✅ Gallery config deleted successfully');
  } catch (error) {
    console.error('❌ Failed to delete gallery config:', error);
    throw error;
  }
}

/**
 * Update display order of submissions within a gallery issue config by Issue ID (admin only)
 * PUT /api/gallery/admin/issues/{issueId}/order
 */
export async function updateSubmissionOrderByIssueId(issueId: number, orders: SubmissionOrderUpdate[]): Promise<void> {
  try {
    console.log(`📤 Updating submission order for issue ${issueId}:`, orders);

    const authHeaders = getAuthHeader();
    const response = await fetch(`${API_BASE}/admin/issues/${issueId}/order`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      credentials: 'include',
      body: JSON.stringify(orders),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to save order' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    console.log('✅ Submission order updated successfully for issue:', issueId);
  } catch (error) {
    console.error('❌ Failed to update submission order:', error);
    throw error;
  }
}

/**
 * Get selected submissions for an issue (admin only)
 * GET /api/gallery/admin/issues/{issueId}/selected
 */
export async function getSelectedSubmissions(issueId: number): Promise<GallerySubmission[]> {
  try {
    const authHeaders = getAuthHeader();
    const response = await fetch(`${API_BASE}/admin/issues/${issueId}/selected`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      credentials: 'include',
    });

    const data = await handleApiResponse<{ submissions: GallerySubmission[] }>(response);
    console.log('✅ Selected submissions loaded:', data.submissions.length, 'submissions');
    return data.submissions;
  } catch (error) {
    console.error('❌ Failed to load selected submissions:', error);
    return [];
  }
}

/**
 * Get available issues for gallery configuration (admin only)
 * GET /api/gallery/admin/issues/available
 */
export async function getAvailableIssues(): Promise<AvailableIssue[]> {
  try {
    const authHeaders = getAuthHeader();
    const response = await fetch(`${API_BASE}/admin/issues/available`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      credentials: 'include',
    });

    const data = await handleApiResponse<{ issues: AvailableIssue[] }>(response);
    console.log('✅ Available issues loaded:', data.issues.length, 'issues');
    return data.issues;
  } catch (error) {
    console.error('❌ Failed to load available issues:', error);
    return [];
  }
}

/**
 * Upload cover image for gallery configuration by Issue ID (admin only)
 * POST /api/gallery/admin/issues/{issueId}/cover
 */
export async function uploadCoverImageByIssueId(issueId: number, file: File): Promise<{ imageUrl: string }> {
  try {
    console.log('📤 Uploading cover image for issue:', issueId);

    const authHeaders = getAuthHeader();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/admin/issues/${issueId}/cover`, {
      method: 'POST',
      headers: {
        ...authHeaders,
      },
      credentials: 'include',
      body: formData,
    });

    const data = await handleApiResponse<{ imageUrl: string }>(response);
    console.log('✅ Cover image uploaded successfully:', data.imageUrl);
    return data;
  } catch (error) {
    console.error('❌ Failed to upload cover image:', error);
    throw error;
  }
}

/**
 * DEPRECATED: Use uploadCoverImageByIssueId instead
 * Upload cover image for gallery configuration (admin only)
 * POST /api/gallery/admin/configs/{id}/cover
 */
export async function uploadCoverImage(configId: number, file: File): Promise<{ imageUrl: string }> {
  try {
    console.log('📤 Uploading cover image for config:', configId);

    const authHeaders = getAuthHeader();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/admin/configs/${configId}/cover`, {
      method: 'POST',
      headers: {
        ...authHeaders,
      },
      credentials: 'include',
      body: formData,
    });

    const data = await handleApiResponse<{ imageUrl: string }>(response);
    console.log('✅ Cover image uploaded successfully:', data.imageUrl);
    return data;
  } catch (error) {
    console.error('❌ Failed to upload cover image:', error);
    throw error;
  }
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

  // Issue Gallery APIs
  getPublishedIssues,
  getIssueDetail,
  getIssueSubmissions,
  getGalleryIssueStats,

  // Admin APIs for Issues  
  getGalleryConfigs,
  createGalleryConfig,
  updateGalleryConfigByIssueId,
  getGalleryConfigByIssueId,
  deleteGalleryConfigByIssueId,
  updateSubmissionOrderByIssueId,
  getSelectedSubmissions,
  getAvailableIssues,
  uploadCoverImage,
  uploadCoverImageByIssueId,
};

export default galleryApi; 