/**
 * Auth related API module
 * Provides user registration, login, third-party authentication, etc.
 */
import { fetchAPI } from "../http";

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

function parseErrorJson(responseText: string): Record<string, unknown> {
  try {
    return JSON.parse(responseText) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Matches historical LoginForm.fetch error mapping (Invalid Request + message heuristics). */
function mapEmailLoginHttpError(_response: Response, responseText: string): never {
  const data = parseErrorJson(responseText);
  const message = typeof data.message === "string" ? data.message : "";
  if (data.error === "Invalid Request" && message.includes("Invalid email or password")) {
    throw new Error("Incorrect email or password");
  }
  if (data.error === "Invalid Request") {
    throw new Error(message || "Login failed. Please check your credentials.");
  }
  throw new Error(
    (typeof data.error === "string" && data.error) ||
      (typeof data.message === "string" && data.message) ||
      "Login failed"
  );
}

/** Matches historical RegisterForm.fetch error mapping. */
function mapRegisterHttpError(_response: Response, responseText: string): never {
  const data = parseErrorJson(responseText);
  const message = typeof data.message === "string" ? data.message : "";
  if (data.error === "Invalid Request" && message.includes("Email already registered")) {
    throw new Error("Email already registered. Please use a different email address.");
  }
  if (data.error === "Invalid Request") {
    throw new Error(message || "Registration failed. Please try again.");
  }
  throw new Error(
    (typeof data.error === "string" && data.error) ||
      (typeof data.message === "string" && data.message) ||
      "Registration failed"
  );
}

/**
 * User registration
 * POST /api/auth/register
 */
export const register = async (data: UserRegisterRequest): Promise<AuthResponse> => {
  return fetchAPI<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
    auth: false,
    onHttpError: mapRegisterHttpError,
  });
};

/**
 * Email login
 * POST /api/auth/login/email
 */
export const loginWithEmail = async (data: EmailLoginRequest): Promise<AuthResponse> => {
  return fetchAPI<AuthResponse>("/api/auth/login/email", {
    method: "POST",
    body: JSON.stringify({
      email: data.email,
      password: data.password,
    }),
    auth: false,
    onHttpError: mapEmailLoginHttpError,
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
  });
};

/**
 * Unbind third-party account
 * DELETE /api/auth/bind/{provider}
 */
export const unbindProvider = async (provider: string): Promise<void> => {
  return fetchAPI<void>(`/api/auth/bind/${provider}`, {
    method: "DELETE",
  });
};

/**
 * Get all linked third-party providers
 * GET /api/auth/providers
 */
export const getLinkedProviders = async (): Promise<string[]> => {
  return fetchAPI<string[]>("/api/auth/providers");
}; 