/**
 * HTTP request utility module
 * Provides basic API request functions and authentication-related helper functions
 */

// Get authentication headers
export const getAuthHeader = (): Record<string, string> => {
  try {
    const token = localStorage.getItem("jwt");
    if (token) {
      console.log("Using auth token:", token.substring(0, 10) + "...");
      return {
        Authorization: `Bearer ${token}`
      };
    }
    console.warn("No JWT token found in localStorage");
  } catch (error) {
    console.error("Unable to access localStorage:", error);
    // Possible private browsing mode or disabled cookies environment
  }
  return {};
};

// Custom request headers type, using index signature to allow any string key
interface RequestHeaders {
  "Content-Type": string;
  Authorization?: string;
  [key: string]: string | undefined;
}

// API request timeout setting (15 seconds)
const API_TIMEOUT = 15000;

// Create fetch request with timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const controller = new AbortController();
  const { signal } = controller;
  
  // Set timeout
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
  
  try {
    const response = await fetch(url, { ...options, signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Base API request function
export const fetchAPI = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  // Automatically get and add auth headers
  const authHeader = getAuthHeader();
  
  // Ensure request headers are correctly merged
  const headers: RequestHeaders = {
    "Content-Type": "application/json",
    ...authHeader, // Add auth headers
    ...(options.headers as Record<string, string> || {})
  };

  // Special handling for DELETE requests, ensure auth headers are correctly added
  if (options.method === "DELETE") {
    console.log("Making DELETE request to:", url);
    console.log("Authorization header present:", !!headers.Authorization);
  }

  try {
    console.log(`API Request: ${options.method || 'GET'} ${url}`, { 
      headers: { ...headers, Authorization: headers.Authorization ? '(set)' : '(none)' }
    });
    
    const response = await fetchWithTimeout(url, {
      ...options,
      headers: headers as Record<string, string>,
      credentials: 'include' // Include cookies, for anonymous voting mechanism
    });

    if (!response.ok) {
      const responseText = await response.text();
      let errorData: Record<string, unknown> | { rawText: string } = { rawText: responseText };
      
      try {
        errorData = JSON.parse(responseText);
      } catch {
        console.warn("API Error response was not valid JSON. Raw text:", responseText);
      }
      
      // Specifically log 401 errors and DELETE request details
      if (response.status === 401) {
        console.error("Authentication Error (401):", {
          method: options.method || 'GET',
          url,
          errorData,
          authHeader: headers.Authorization ? 'Present' : 'Missing',
          requestHeaders: { ...headers, Authorization: headers.Authorization ? '(set)' : '(none)' }
        });
        
        // Check if token is expired, clear invalid token
        if (url !== "/api/auth/login/email" && url !== "/api/auth/register") {
          try {
            localStorage.removeItem("jwt");
            console.warn("Cleared potentially expired JWT token");
          } catch (err) {
            console.error("Unable to remove token from localStorage:", err);
          }
        }
      } else {
        console.error("API Error:", {
          status: response.status,
          statusText: response.statusText,
          method: options.method || 'GET',
          url,
          errorData,
          requestHeaders: { ...headers, Authorization: headers.Authorization ? '(set)' : '(none)' }
        });
      }
      
      const errorMessage = 
        (errorData as Record<string, unknown>).message as string || 
        (errorData as Record<string, unknown>).detail as string || 
        (errorData as { rawText: string }).rawText || 
        `API request failed: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    if (!responseText) {
      return null as T;
    }
    
    const data = JSON.parse(responseText);
    return data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error(`API Request Timeout for ${url} after ${API_TIMEOUT}ms`);
      throw new Error(`Request timeout: ${url}`);
    }
    console.error(`API Request Failed for ${url}:`, error);
    throw error;
  }
}; 