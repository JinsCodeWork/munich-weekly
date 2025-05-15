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
      headers
    });

    if (!response.ok) {
      // 尝试获取响应文本以提供更好的错误诊断
      const responseText = await response.text();
      let errorData = {};
      
      try {
        // 尝试解析为JSON（如果可能）
        errorData = JSON.parse(responseText);
      } catch {
        // 如果不是JSON，则原样使用文本
        errorData = { text: responseText };
      }
      
      console.error("API Error:", {
        status: response.status,
        statusText: response.statusText,
        url,
        headers: Object.fromEntries(response.headers.entries()),
        errorData,
        requestHeaders: headers
      });
      
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Request Failed for ${url}:`, error);
    throw error;
  }
}; 