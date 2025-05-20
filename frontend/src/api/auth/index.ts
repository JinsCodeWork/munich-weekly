/**
 * Auth related API module
 * Provides user registration, login, third-party authentication, etc.
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
 * User registration
 * POST /api/auth/register
 */
export const register = async (data: UserRegisterRequest): Promise<AuthResponse> => {
  return fetchAPI<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data)
  });
};

/**
 * Email login
 * POST /api/auth/login/email
 */
export const loginWithEmail = async (data: EmailLoginRequest): Promise<AuthResponse> => {
  return fetchAPI<AuthResponse>("/api/auth/login/email", {
    method: "POST",
    body: JSON.stringify(data)
  });
};

/**
 * Third-party login
 * POST /api/auth/login/provider
 */
export const loginWithProvider = async (data: UserProviderLoginRequest): Promise<AuthResponse> => {
  return fetchAPI<AuthResponse>("/api/auth/login/provider", {
    method: "POST",
    body: JSON.stringify(data)
  });
};

/**
 * Bind third-party account
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
 * Unbind third-party account
 * DELETE /api/auth/bind/{provider}
 */
export const unbindProvider = async (provider: string): Promise<void> => {
  return fetchAPI<void>(`/api/auth/bind/${provider}`, {
    method: "DELETE",
    headers: getAuthHeader()
  });
};

/**
 * Get all linked third-party providers
 * GET /api/auth/providers
 */
export const getLinkedProviders = async (): Promise<string[]> => {
  return fetchAPI<string[]>("/api/auth/providers", {
    headers: getAuthHeader()
  });
}; 