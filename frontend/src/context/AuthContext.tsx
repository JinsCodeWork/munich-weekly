"use client"

import { createContext, useContext, useEffect, useState } from "react"
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
  } catch (e) {
    console.error("Token parsing failed:", e)
    return true // Treat parsing failures as expired
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

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
      } catch (error) {
        console.error("Storage access error:", error)
      }
      
      const preserveAuth = sessionStorage.getItem("preserve_auth")
    
      if (storedToken) {
        // Check if token is expired
        if (isTokenExpired(storedToken)) {
          console.warn("Stored token is expired, clearing auth state")
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
          } catch (e) {
            console.error("User data parsing failed:", e)
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
          } catch (e) {
            console.warn("Unable to update cached user data:", e)
          }
        } catch (err) {
          console.error("Failed to fetch user data:", err)
          clearAuthStorage()
        }
        
        // If we have preserve_auth flag, clear it
        if (preserveAuth === "true") {
          console.log("Preserving authentication during redirect")
          sessionStorage.removeItem("preserve_auth")
        }
      }
      
      setLoading(false)
    }
    
    initAuth()
  }, [])

  // Clear all authentication storage
  const clearAuthStorage = () => {
    try {
      localStorage.removeItem("jwt")
      localStorage.removeItem("user_data")
      sessionStorage.removeItem("jwt")
      sessionStorage.removeItem("user_data")
    } catch (error) {
      console.error("Failed to clear auth storage:", error)
    }
    
    setToken(null)
    setUser(null)
  }

  const fetchUserData = async (): Promise<User | null> => {
    try {
      const userData = await usersApi.getCurrentUser()
      setUser(userData)
      
      // Update cached user data
      try {
        localStorage.setItem("user_data", JSON.stringify(userData))
        sessionStorage.setItem("user_data", JSON.stringify(userData))
      } catch (e) {
        console.warn("Unable to cache user data:", e)
      }
      
      return userData
    } catch (err) {
      console.error("Failed to fetch user data:", err)
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
        } catch (e) {
          console.warn("Unable to cache user data:", e)
        }
      } else {
        // Otherwise fetch user data from API
        fetchUserData()
      }
    } catch (error) {
      console.error("Failed to save authentication info:", error)
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

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      logout, 
      hasRole, 
      isAuthenticated,
      refreshUserData
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