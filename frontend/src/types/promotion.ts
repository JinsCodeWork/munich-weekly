/**
 * Promotion feature type definitions
 * Defines the data structures for promotion configuration and images
 */

export interface PromotionConfig {
  id: number;
  isEnabled: boolean;
  navTitle: string;
  pageUrl: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionImage {
  id: number;
  imageUrl: string;
  imageTitle?: string;
  imageDescription?: string;
  displayOrder: number;
  imageWidth?: number;
  imageHeight?: number;
  aspectRatio?: number;
  createdAt: string;
}

export interface PromotionPageData {
  config: PromotionConfig;
  images: PromotionImage[];
} 