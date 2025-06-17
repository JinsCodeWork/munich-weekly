// Gallery Feature TypeScript Type Definitions

/**
 * Configuration for gallery featured carousel
 */
export interface GalleryFeaturedConfig {
  id: number;
  submissionIds: number[];
  displayOrder: number[];
  autoplayInterval: number;
  isActive: boolean;
  configTitle: string;
  configDescription?: string;
  createdAt: string;
  updatedAt: string;
  createdByUserId?: number;
  featuredCount: number;
}

/**
 * Featured submission for carousel display
 */
export interface FeaturedSubmission {
  id: number;
  imageUrl: string;
  thumbnailUrl: string;
  description: string;
  title?: string;
  authorName: string;
  authorId: number;
  issueTitle: string;
  issueId: number;
  imageWidth?: number;
  imageHeight?: number;
  aspectRatio?: number;
  status: string;
  isCover: boolean;
  submittedAt: string;
  reviewedAt?: string;
  displayOrder?: number;
}

/**
 * Gallery statistics response
 */
export interface GalleryStats {
  totalFeaturedSubmissions: number;
  hasActiveConfig: boolean;
  totalConfigs: number;
}

/**
 * Configuration response wrapper
 */
export interface ConfigResponse {
  config: GalleryFeaturedConfig | null;
  hasConfig: boolean;
  message?: string;
}

/**
 * Configs list response wrapper
 */
export interface ConfigsResponse {
  configs: GalleryFeaturedConfig[];
  total: number;
}

/**
 * Save config response wrapper
 */
export interface SaveConfigResponse {
  config: GalleryFeaturedConfig;
  message: string;
  success: boolean;
}

/**
 * Submission preview response wrapper
 */
export interface SubmissionPreviewResponse {
  submission: FeaturedSubmission | null;
  found: boolean;
  message?: string;
}

/**
 * Featured status response wrapper
 */
export interface FeaturedStatusResponse {
  submissionId: number;
  isFeatured: boolean;
  message: string;
}

/**
 * Delete config response wrapper
 */
export interface DeleteConfigResponse {
  message: string;
  success: boolean;
  deletedId: number;
}

/**
 * Request DTO for saving gallery configuration
 */
export interface SaveConfigRequest {
  id?: number;
  submissionIds: number[];
  displayOrder: number[];
  autoplayInterval: number;
  isActive: boolean;
  configTitle: string;
  configDescription?: string;
}

/**
 * Error response wrapper
 */
export interface ErrorResponse {
  error: string;
  success?: false;
}

/**
 * Carousel display settings
 */
export interface CarouselSettings {
  autoplayInterval: number;
  showControls: boolean;
  showIndicators: boolean;
  enableTouch: boolean;
}

/**
 * Carousel state management
 */
export interface CarouselState {
  currentSlide: number;
  isPlaying: boolean;
  isHovered: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Touch/swipe gesture data
 */
export interface SwipeData {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  startTime: number;
  endTime: number;
}

/**
 * Admin form validation state
 */
export interface AdminFormState {
  submissionIds: string;
  configTitle: string;
  configDescription: string;
  autoplayInterval: number;
  isActive: boolean;
  errors: {
    submissionIds?: string;
    configTitle?: string;
    autoplayInterval?: string;
  };
} 