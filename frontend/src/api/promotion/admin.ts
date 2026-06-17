/**
 * Promotion Admin API service
 * Provides functions for admin promotion management
 */

import { fetchAPI } from '../http';
import { PromotionConfig, PromotionImage } from '@/types/promotion';

type PromotionUploadResponse = {
  success?: boolean;
  imageUrl?: string;
  error?: string;
};

/**
 * Get all promotion configurations for admin
 * Admin endpoint - requires admin authentication
 */
export const getAllPromotionConfigsForAdmin = async (): Promise<PromotionConfig[]> => {
  return await fetchAPI<PromotionConfig[]>('/api/promotion/admin/configs');
};

/**
 * Get specific promotion configuration by ID for admin
 * Admin endpoint - requires admin authentication
 */
export const getPromotionConfigByIdForAdmin = async (id: number): Promise<PromotionConfig> => {
  return await fetchAPI<PromotionConfig>(`/api/promotion/admin/config/${id}`);
};

/**
 * Get promotion configuration for admin
 * Admin endpoint - requires admin authentication
 */
export const getPromotionConfigForAdmin = async (): Promise<PromotionConfig> => {
  return await fetchAPI<PromotionConfig>('/api/promotion/admin/config');
};

/**
 * Update promotion configuration
 * Admin endpoint - requires admin authentication
 */
export const updatePromotionConfig = async (config: {
  isEnabled: boolean;
  navTitle: string;
  pageUrl: string;
  description?: string;
}): Promise<PromotionConfig> => {
  return await fetchAPI<PromotionConfig>('/api/promotion/admin/config', {
    method: 'PUT',
    body: JSON.stringify(config),
  });
};

/**
 * Get promotion images for admin
 * Admin endpoint - requires admin authentication
 */
export const getPromotionImages = async (configId: number): Promise<PromotionImage[]> => {
  return await fetchAPI<PromotionImage[]>(`/api/promotion/admin/images?configId=${configId}`);
};

/**
 * Add promotion image
 * Admin endpoint - requires admin authentication
 */
export const addPromotionImage = async (imageData: {
  promotionConfigId: number;
  imageTitle?: string;
  imageDescription?: string;
  displayOrder?: number;
}): Promise<PromotionImage> => {
  return await fetchAPI<PromotionImage>('/api/promotion/admin/images', {
    method: 'POST',
    body: JSON.stringify(imageData),
  });
};

/**
 * Upload promotion image file
 * Admin endpoint - requires admin authentication
 */
export const uploadPromotionImageFile = async (imageId: number, file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  // For FormData uploads, we need to handle this differently from fetchAPI
  const jwt = localStorage.getItem("jwt");
  const headers: HeadersInit = {};
  
  if (jwt) {
    headers.Authorization = `Bearer ${jwt}`;
  }
  
  const response = await fetch(`/api/promotion/admin/images/${imageId}/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload: PromotionUploadResponse = contentType.includes('application/json')
    ? await response.json()
    : { imageUrl: await response.text() };

  if (!response.ok) {
    throw new Error(payload.error || `Upload failed: ${response.status}`);
  }

  if (!payload.imageUrl) {
    throw new Error('Upload response did not include an image URL');
  }

  return payload.imageUrl;
};

/**
 * Delete promotion image
 * Admin endpoint - requires admin authentication
 */
export const deletePromotionImage = async (imageId: number): Promise<void> => {
  return await fetchAPI<void>(`/api/promotion/admin/images/${imageId}`, {
    method: 'DELETE',
  });
};

/**
 * Delete promotion configuration completely
 * Admin endpoint - requires admin authentication
 * This will delete the configuration and all associated images from both database and R2 storage
 */
export const deletePromotionConfig = async (configId: number): Promise<void> => {
  return await fetchAPI<void>(`/api/promotion/admin/config/${configId}`, {
    method: 'DELETE',
  });
};
