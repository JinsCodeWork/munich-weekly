/**
 * 认证相关API模块
 * 提供用户注册、登录、第三方认证等功能
 */
import { fetchAPI, getAuthHeader } from "../http";

interface UserRegisterRequest {
  email: string;
  password: string;
  nickname: string;
}

interface EmailLoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface UserProviderLoginRequest {
  provider: string;
  token: string;
}

interface BindRequest {
  provider: string;
  token: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    nickname: string;
    role: string;
    avatarUrl?: string;
  };
}

/**
 * 用户注册
 * POST /api/auth/register
 */
export const register = async (data: UserRegisterRequest): Promise<AuthResponse> => {
  return fetchAPI<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data)
  });
};

/**
 * 邮箱登录
 * POST /api/auth/login/email
 */
export const loginWithEmail = async (data: EmailLoginRequest): Promise<AuthResponse> => {
  return fetchAPI<AuthResponse>("/api/auth/login/email", {
    method: "POST",
    body: JSON.stringify(data)
  });
};

/**
 * 第三方登录
 * POST /api/auth/login/provider
 */
export const loginWithProvider = async (data: UserProviderLoginRequest): Promise<AuthResponse> => {
  return fetchAPI<AuthResponse>("/api/auth/login/provider", {
    method: "POST",
    body: JSON.stringify(data)
  });
};

/**
 * 绑定第三方账号
 * POST /api/auth/bind
 */
export const bindProvider = async (data: BindRequest): Promise<void> => {
  return fetchAPI<void>("/api/auth/bind", {
    method: "POST",
    body: JSON.stringify(data),
    headers: getAuthHeader()
  });
};

/**
 * 解绑第三方账号
 * DELETE /api/auth/bind/{provider}
 */
export const unbindProvider = async (provider: string): Promise<void> => {
  return fetchAPI<void>(`/api/auth/bind/${provider}`, {
    method: "DELETE",
    headers: getAuthHeader()
  });
};

/**
 * 获取用户绑定的所有第三方提供商
 * GET /api/auth/providers
 */
export const getLinkedProviders = async (): Promise<string[]> => {
  return fetchAPI<string[]>("/api/auth/providers", {
    headers: getAuthHeader()
  });
}; 