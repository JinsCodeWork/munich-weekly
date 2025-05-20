/**
 * 用户相关API模块
 * 提供用户信息获取、更新等功能
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
 * 获取当前登录用户信息
 * GET /api/users/me
 */
export const getCurrentUser = async (): Promise<User> => {
  return fetchAPI<User>("/api/users/me", {
    headers: getAuthHeader()
  });
};

/**
 * 更新当前登录用户信息
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
 * 更改当前用户密码
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
 * 获取所有用户列表（仅限管理员）
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