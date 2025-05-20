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

// 自定义请求头类型，使用索引签名允许任何字符串键
interface RequestHeaders {
  "Content-Type": string;
  Authorization?: string;
  [key: string]: string | undefined;
}

// 基础API请求函数
export const fetchAPI = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  // 自动获取并添加认证头
  const authHeader = getAuthHeader();
  
  // 确保请求头正确合并
  const headers: RequestHeaders = {
    "Content-Type": "application/json",
    ...authHeader, // 添加认证头
    ...(options.headers as Record<string, string> || {})
  };

  // 对DELETE请求特殊处理，确保认证头被正确添加
  if (options.method === "DELETE") {
    console.log("Making DELETE request to:", url);
    console.log("Authorization header present:", !!headers.Authorization);
  }

  try {
    console.log(`API Request: ${options.method || 'GET'} ${url}`, { 
      headers: { ...headers, Authorization: headers.Authorization ? '(set)' : '(none)' }
    });
    
    const response = await fetch(url, {
      ...options,
      headers: headers as Record<string, string>,
      credentials: 'include' // 包含cookies，重要！
    });

    if (!response.ok) {
      const responseText = await response.text();
      let errorData: Record<string, unknown> | { rawText: string } = { rawText: responseText };
      
      try {
        errorData = JSON.parse(responseText);
      } catch {
        console.warn("API Error response was not valid JSON. Raw text:", responseText);
      }
      
      // 特别记录401错误和DELETE请求的详细信息
      if (response.status === 401) {
        console.error("Authentication Error (401):", {
          method: options.method || 'GET',
          url,
          errorData,
          authHeader: headers.Authorization ? 'Present' : 'Missing',
          requestHeaders: { ...headers, Authorization: headers.Authorization ? '(set)' : '(none)' }
        });
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
    console.error(`API Request Failed for ${url}:`, error);
    throw error;
  }
}; 