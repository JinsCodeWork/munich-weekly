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

  try {
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
        // Response was not valid JSON
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
      throw new Error(`Request timeout: ${url}`);
    }
    throw error;
  }
};
