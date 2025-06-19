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

// ========== NEW: Gallery Issue Types ==========

/**
 * Gallery issue configuration for magazine-style display
 */
export interface GalleryIssueConfig {
  id: number;
  issueId: number;
  issue: {
    id: number;
    title: string;
    description: string;
    submissionStart: string;  
    submissionEnd: string;
    votingStart: string;
    votingEnd: string;
    createdAt: string;
  };
  coverImageUrl?: string;
  isPublished: boolean;
  displayOrder: number;
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Gallery submission with display order for issue detail
 */
export interface GallerySubmission {
  id: number;
  imageUrl: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  authorName: string;
  authorId: number;
  imageWidth?: number;
  imageHeight?: number;
  aspectRatio?: number;
  status: 'selected' | 'cover';
  submittedAt: string;
  displayOrder: number;
}

/**
 * Gallery issue statistics
 */
export interface GalleryIssueStats {
  totalPublishedIssues: number;
  totalSubmissions: number;
  hasActiveConfig: boolean;
}

/**
 * Request for creating new gallery configuration
 */
export interface CreateGalleryConfigRequest {
  issueId: number;
  isPublished?: boolean;
}

/**
 * Request for updating gallery configuration
 */
export interface UpdateGalleryConfigRequest {
  issueId?: number;
  isPublished?: boolean;
  displayOrder?: number;
  coverImageUrl?: string;
}

/**
 * Submission order update item
 */
export interface SubmissionOrderUpdate {
  submissionId: number;
  displayOrder: number;
}

/**
 * Available issue for gallery configuration
 */
export interface AvailableIssue {
  id: number;
  title: string;
  description: string;
  submissionStart: string;
  submissionEnd: string;
  votingStart: string;
  votingEnd: string;
  selectedSubmissionCount: number;
}

/**
 * Gallery issue card props for display
 */
export interface GalleryIssueCardProps {
  issue: GalleryIssueConfig;
  className?: string;
  onClick?: () => void;
}

/**
 * Gallery submission card props for issue detail
 */
export interface GallerySubmissionCardProps {
  submission: GallerySubmission;
  isHero?: boolean;
  className?: string;
} 