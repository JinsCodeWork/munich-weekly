import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AuthUser {
  id: number;
  email: string;
  nickname: string;
  role: string;
}

/**
 * 认证相关的自定义hook
 * 处理用户登录状态、token管理和权限验证
 */
export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 在组件挂载时从localStorage加载token
  useEffect(() => {
    const storedToken = localStorage.getItem("jwt");
    if (storedToken) {
      setToken(storedToken);
      try {
        // 从token中解析用户信息
        // 注意：这里简化处理，实际应该从后端验证token有效性
        const payload = JSON.parse(atob(storedToken.split(".")[1]));
        setUser({
          id: payload.id,
          email: payload.sub,
          nickname: payload.nickname || "",
          role: payload.role || "user"
        });
      } catch (err) {
        console.error("Failed to parse token:", err);
        logout();
      }
    }
    setLoading(false);
  }, []);

  // 登录函数
  const login = (newToken: string, userData: AuthUser) => {
    localStorage.setItem("jwt", newToken);
    setToken(newToken);
    setUser(userData);
  };

  // 登出函数
  const logout = () => {
    localStorage.removeItem("jwt");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  // 检查用户是否有特定角色
  const hasRole = (role: string) => {
    return user?.role === role;
  };

  // 检查用户是否已认证
  const isAuthenticated = () => {
    return !!token;
  };

  return {
    token,
    user,
    loading,
    login,
    logout,
    hasRole,
    isAuthenticated
  };
} 