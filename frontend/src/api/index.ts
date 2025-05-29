/**
 * API module index file
 * Exports all API functionality for easy import in components
 */

// Export base HTTP utilities
export * from "./http";

// Export APIs organized by module
export * as authApi from "./auth";
export * as usersApi from "./users";
export * as issuesApi from "./issues";
export * as submissionsApi from "./submissions";
export * as votesApi from "./votes";

// Export layout API with specific types for better tree-shaking
export { layoutApi, LayoutApiError } from "./layout";
export type { 
  MasonryOrderApiResponse, 
  MasonryOrderResult, 
  OrderCacheInfo
} from "./layout";

// Export common types
export type { default as ApiError } from "./types.ts";

/**
 * Check if browser storage is available (e.g., in private browsing mode)
 */
export const isStorageAvailable = (type: 'localStorage' | 'sessionStorage'): boolean => {
  // Check browser storage availability
  const storage = window[type];
  try {
    const testKey = `__storage_test__${new Date().getTime()}`;
    storage.setItem(testKey, "test");
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};