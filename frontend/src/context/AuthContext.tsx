"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { usersApi } from "@/api"
import { useRouter } from "next/navigation"

// 用户类型
interface User {
  id: number
  email: string
  nickname: string
  role: string
  avatarUrl?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (token: string, userData?: User) => void
  logout: () => void
  hasRole: (role: string) => boolean
  isAuthenticated: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const storedToken = localStorage.getItem("jwt")
    const preserveAuth = sessionStorage.getItem("preserve_auth")
    
    if (storedToken) {
      setToken(storedToken)
      fetchUserData()
      
      // 如果有preserve_auth标志，清除它
      if (preserveAuth === "true") {
        console.log("Preserving authentication during redirect")
        sessionStorage.removeItem("preserve_auth")
      }
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUserData = async () => {
    try {
      const userData = await usersApi.getCurrentUser()
      setUser(userData)
    } catch (err) {
      console.error("Failed to fetch user data:", err)
      localStorage.removeItem("jwt")
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const login = (newToken: string, userData?: User) => {
    localStorage.setItem("jwt", newToken)
    setToken(newToken)
    
    if (userData) {
      // 如果提供了用户数据，直接设置
      setUser(userData)
      setLoading(false)
    } else {
      // 否则从API获取用户数据
      fetchUserData()
    }
  }

  const logout = () => {
    localStorage.removeItem("jwt")
    setToken(null)
    setUser(null)
    
    // 重定向到首页
    router.push("/")
  }

  // 检查用户是否有特定角色
  const hasRole = (role: string) => {
    return user?.role === role
  }

  // 检查用户是否已认证
  const isAuthenticated = () => {
    return !!token
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      logout, 
      hasRole, 
      isAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}