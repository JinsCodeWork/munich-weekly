/**
 * API-related type definitions
 */

/**
 * API error type
 */
export default interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
  timestamp?: string;
  path?: string;
} 