/**
 * User-related API module
 * Provides user information retrieval, updates and other functionality
 */
import { fetchAPI, getAuthHeader } from "../http";

interface User {
  id: number;
  email: string;
  nickname: string;
  role: string;
  avatarUrl?: string;
}

interface UserUpdateRequest {
  nickname?: string;
  avatarUrl?: string;
}

interface PasswordChangeRequest {
  oldPassword: string;
  newPassword: string;
}

/**
 * Get current logged-in user information
 * GET /api/users/me
 */
export const getCurrentUser = async (): Promise<User> => {
  return fetchAPI<User>("/api/users/me", {
    headers: getAuthHeader()
  });
};

/**
 * Update current logged-in user information
 * PATCH /api/users/me
 */
export const updateCurrentUser = async (data: UserUpdateRequest): Promise<User> => {
  return fetchAPI<User>("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify(data),
    headers: getAuthHeader()
  });
};

/**
 * Change current user password
 * POST /api/users/change-password
 */
export const changePassword = async (data: PasswordChangeRequest): Promise<void> => {
  return fetchAPI<void>("/api/users/change-password", {
    method: "POST",
    body: JSON.stringify(data),
    headers: getAuthHeader()
  });
};

/**
 * Get all users list (admin only)
 * GET /api/users
 */
export const getAllUsers = async (): Promise<User[]> => {
  return fetchAPI<User[]>("/api/users", {
    headers: getAuthHeader()
  });
};

/**
 * Delete the currently authenticated user and all their data
 * DELETE /api/users/me
 */
export const deleteCurrentUser = async (): Promise<void> => {
  return fetchAPI<void>("/api/users/me", {
    method: "DELETE",
    headers: getAuthHeader()
  });
}; 