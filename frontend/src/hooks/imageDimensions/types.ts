/**
 * Image dimension data with loading state
 */
export interface ImageDimension {
  width: number;
  height: number;
  aspectRatio: number;
  isLoaded: boolean;
  error?: string;
  fromStored?: boolean; // **NEW: Indicates if dimensions came from stored backend data**
}

/**
 * Result of batch image dimension loading
 */
export interface ImageDimensionsResult {
  dimensions: Map<string, ImageDimension>;
  loadingProgress: number; // 0-100
  isAllLoaded: boolean;
  errors: string[];
  totalImages: number;
  loadedImages: number;
  retryFailedImages: () => void;
  // Progressive loading support
  isProgressiveReady: boolean; // True when progressive threshold is reached
  progressiveLoadedCount: number; // Number of images loaded for progressive display
  // **NEW: Optimization metrics**
  storedDimensionsCount: number; // Number of dimensions loaded from stored data
  dynamicFetchCount: number; // Number of dimensions fetched dynamically
}

/**
 * Configuration for image dimension loading
 */
export interface ImageDimensionConfig {
  timeout: number; // Timeout for each image load in milliseconds
  retryAttempts: number; // Number of retry attempts for failed images
  batchSize: number; // Number of images to load concurrently
  cacheDuration: number; // Cache duration in milliseconds
  // Progressive loading configuration
  progressiveThreshold?: number; // Number of images to load before enabling progressive display
  enableProgressiveLoading?: boolean; // Enable progressive loading feature
  // **NEW: Optimization configuration**
  preferStoredDimensions?: boolean; // Prefer stored dimensions from backend over dynamic fetching
}

/**
 * Default configuration optimized for mobile performance
 */
export const DEFAULT_CONFIG: ImageDimensionConfig = {
  timeout: 6000, // Reduced from 10s to 6s for faster mobile experience
  retryAttempts: 2,
  batchSize: 4, // Reduced from 6 to 4 for mobile optimization
  cacheDuration: 24 * 60 * 60 * 1000, // 24 hours
  progressiveThreshold: 6, // Start progressive display after 6 images
  enableProgressiveLoading: true,
  preferStoredDimensions: true, // **NEW: Default to preferring stored dimensions**
};
