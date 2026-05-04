/**
 * HTTP request utility module
 * Provides basic API request functions and authentication-related helper functions
 */

// Get authentication headers
export const getAuthHeader = (): Record<string, string> => {
  try {
    const token = localStorage.getItem("jwt");
    if (token) {
      return {
        Authorization: `Bearer ${token}`
      };
    }
  } catch {
    // Possible private browsing mode or disabled cookies environment
  }
  return {};
};

export type FetchAPIOptions = RequestInit & {
  /** When false, Authorization header is omitted. Default true. */
  auth?: boolean;
  /** Request timeout in ms. Default 15000. */
  timeoutMs?: number;
  /**
   * When false, success responses are not parsed as JSON (use for empty 204 / void endpoints).
   * Default true.
   */
  parseResponseJson?: boolean;
};

const DEFAULT_TIMEOUT_MS = 15000;

const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

function flattenHeaders(init?: HeadersInit): Record<string, string> {
  const out: Record<string, string> = {};
  if (!init) return out;
  if (init instanceof Headers) {
    init.forEach((v, k) => {
      out[k] = v;
    });
  } else if (Array.isArray(init)) {
    for (const [k, v] of init) {
      out[k] = v;
    }
  } else {
    Object.assign(out, init);
  }
  return out;
}

/**
 * Extract a human-readable error message from JSON or plain-text API error bodies.
 */
export function parseApiErrorMessage(responseText: string, response: Response): string {
  let errorData: Record<string, unknown> | { rawText: string } = { rawText: responseText };

  try {
    errorData = JSON.parse(responseText) as Record<string, unknown>;
  } catch {
    // Response was not valid JSON — keep rawText wrapper
  }

  const obj = errorData as Record<string, unknown>;
  const fromJson =
    (typeof obj.error === "string" && obj.error) ||
    (typeof obj.message === "string" && obj.message) ||
    (typeof obj.detail === "string" && obj.detail);

  if (fromJson) {
    return fromJson;
  }

  const raw = (errorData as { rawText?: string }).rawText;
  if (raw?.trim()) {
    return raw.trim();
  }

  return `API request failed: ${response.status} ${response.statusText}`;
}

function buildHeaders(
  isFormData: boolean,
  auth: boolean,
  userHeaders?: HeadersInit
): Record<string, string> {
  const merged = flattenHeaders(userHeaders);
  const headers: Record<string, string> = {};

  const hasContentType =
    merged["Content-Type"] !== undefined || merged["content-type"] !== undefined;

  if (!isFormData && !hasContentType) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    Object.assign(headers, getAuthHeader());
  }

  for (const [k, v] of Object.entries(merged)) {
    if (isFormData && k.toLowerCase() === "content-type") {
      continue;
    }
    headers[k] = v;
  }

  return headers;
}

export const fetchAPI = async <T>(
  url: string,
  options: FetchAPIOptions = {}
): Promise<T> => {
  const {
    auth = true,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    parseResponseJson = true,
    ...requestInit
  } = options;

  const body = requestInit.body;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const headers = buildHeaders(isFormData, auth, requestInit.headers);

  const credentials =
    requestInit.credentials !== undefined ? requestInit.credentials : "include";

  try {
    const response = await fetchWithTimeout(
      url,
      {
        ...requestInit,
        headers: headers as Record<string, string>,
        credentials,
      },
      timeoutMs
    );

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(parseApiErrorMessage(responseText, response));
    }

    if (!parseResponseJson) {
      return undefined as T;
    }

    if (!responseText) {
      return null as T;
    }

    return JSON.parse(responseText) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Request timeout: ${url}`);
    }
    throw error;
  }
};
