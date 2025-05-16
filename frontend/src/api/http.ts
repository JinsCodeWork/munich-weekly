/**
 * HTTP请求工具模块
 * 提供基础的API请求函数和认证相关辅助函数
 */

// 获取认证请求头
export const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem("jwt");
  if (token) {
    console.log("Using auth token:", token.substring(0, 10) + "...");
    return {
      Authorization: `Bearer ${token}`
    };
  }
  console.warn("No JWT token found in localStorage");
  return {};
};

// 基础API请求函数
export const fetchAPI = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  // 确保请求头正确合并
  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  try {
    console.log(`API Request: ${options.method || 'GET'} ${url}`, { headers });
    
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      const responseText = await response.text();
      let errorData: Record<string, unknown> | { rawText: string } = { rawText: responseText };
      
      try {
        errorData = JSON.parse(responseText);
      } catch {
        console.warn("API Error response was not valid JSON. Raw text:", responseText);
      }
      
      console.error("API Error:", {
        status: response.status,
        statusText: response.statusText,
        url,
        errorData,
        requestHeaders: headers
      });
      
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
    console.error(`API Request Failed for ${url}:`, error);
    throw error;
  }
}; 