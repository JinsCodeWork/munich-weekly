"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { usersApi } from "@/api"
import { useRouter } from "next/navigation"

// User type
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
  refreshUserData: () => Promise<User | null>
  isLoginOpen: boolean
  isRegisterOpen: boolean
  openLogin: () => void
  openRegister: () => void
  closeAuthModals: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Token validity check
const isTokenExpired = (token: string): boolean => {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return true

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))

    const { exp } = JSON.parse(jsonPayload)
    if (!exp) return true

    // Check if expired (consider as expired 30 seconds before actual expiry to avoid edge cases)
    return Date.now() >= (exp * 1000 - 30000)
  } catch {
    return true // Treat parsing failures as expired
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const router = useRouter()

  // Clear all authentication storage
  const clearAuthStorage = useCallback(() => {
    try {
      localStorage.removeItem("jwt")
      localStorage.removeItem("user_data")
      sessionStorage.removeItem("jwt")
      sessionStorage.removeItem("user_data")
    } catch {
      // Failed to clear auth storage
    }

    setToken(null)
    setUser(null)
  }, [])

  // Try to recover token and user data from both localStorage and sessionStorage
  useEffect(() => {
    const initAuth = async () => {
      let storedToken = null
      let storedUser = null

      try {
        // First try to get long-term token from localStorage
        storedToken = localStorage.getItem("jwt")
        storedUser = localStorage.getItem("user_data")

        // If not in localStorage, try sessionStorage as backup
        if (!storedToken) {
          storedToken = sessionStorage.getItem("jwt")
          storedUser = sessionStorage.getItem("user_data")
        }
      } catch {
        // Storage access error (possible private browsing mode)
      }

      const preserveAuth = sessionStorage.getItem("preserve_auth")

      if (storedToken) {
        // Check if token is expired
        if (isTokenExpired(storedToken)) {
          clearAuthStorage()
          setLoading(false)
          return
        }

        setToken(storedToken)

        // If we have cached user data, use it first to improve perceived performance
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            setUser(userData)
          } catch {
            // User data parsing failed
          }
        }

        // Always fetch the latest user data regardless
        try {
          const userData = await usersApi.getCurrentUser()
          setUser(userData)

          // Update cached user data
          try {
            localStorage.setItem("user_data", JSON.stringify(userData))
            sessionStorage.setItem("user_data", JSON.stringify(userData))
          } catch {
            // Unable to update cached user data
          }
        } catch {
          clearAuthStorage()
        }

        // If we have preserve_auth flag, clear it
        if (preserveAuth === "true") {
          sessionStorage.removeItem("preserve_auth")
        }
      }

      setLoading(false)
    }

    initAuth()
  }, [clearAuthStorage])

  const fetchUserData = async (): Promise<User | null> => {
    try {
      const userData = await usersApi.getCurrentUser()
      setUser(userData)

      // Update cached user data
      try {
        localStorage.setItem("user_data", JSON.stringify(userData))
        sessionStorage.setItem("user_data", JSON.stringify(userData))
      } catch {
        // Unable to cache user data
      }

      return userData
    } catch {
      clearAuthStorage()
      return null
    } finally {
      setLoading(false)
    }
  }

  const login = (newToken: string, userData?: User) => {
    try {
      // Store token in both localStorage and sessionStorage for reliability
      localStorage.setItem("jwt", newToken)
      sessionStorage.setItem("jwt", newToken)

      setToken(newToken)

      if (userData) {
        // If user data is provided, set and cache it directly
        setUser(userData)
        setLoading(false)

        try {
          localStorage.setItem("user_data", JSON.stringify(userData))
          sessionStorage.setItem("user_data", JSON.stringify(userData))
        } catch {
          // Unable to cache user data
        }
      } else {
        // Otherwise fetch user data from API
        fetchUserData()
      }
    } catch {
      // Try to use memory state only
      setToken(newToken)
      if (userData) {
        setUser(userData)
      } else {
        fetchUserData()
      }
    }
  }

  const logout = () => {
    clearAuthStorage()

    // Redirect to homepage
    router.push("/")
  }

  // Refresh user data
  const refreshUserData = async (): Promise<User | null> => {
    if (!token) return null
    return await fetchUserData()
  }

  // Check if user has a specific role
  const hasRole = (role: string) => {
    return user?.role === role
  }

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!token && !!user
  }

  // Modal management functions
  const openLogin = useCallback(() => {
    setIsRegisterOpen(false)
    setIsLoginOpen(true)
  }, [])

  const openRegister = useCallback(() => {
    setIsLoginOpen(false)
    setIsRegisterOpen(true)
  }, [])

  const closeAuthModals = useCallback(() => {
    setIsLoginOpen(false)
    setIsRegisterOpen(false)
  }, [])

  // Close modals when user successfully logs in
  useEffect(() => {
    if (!user) return

    const timeoutId = window.setTimeout(() => {
      closeAuthModals()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [user, closeAuthModals])

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    hasRole,
    isAuthenticated,
    refreshUserData,
    isLoginOpen,
    isRegisterOpen,
    openLogin,
    openRegister,
    closeAuthModals,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
