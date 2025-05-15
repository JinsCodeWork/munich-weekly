/**
 * API相关类型定义
 */

/**
 * API错误类型
 */
export default interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
  timestamp?: string;
  path?: string;
} 