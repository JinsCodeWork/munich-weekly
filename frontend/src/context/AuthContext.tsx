"use client"

import { createContext, useContext, useEffect, useState } from "react"

interface User {
  id: number
  email: string
  nickname: string
  role: "user" | "admin"
  avatarUrl?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem("jwt")
    if (storedToken) {
      setToken(storedToken)
      fetchUserData(storedToken)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUserData = async (authToken: string) => {
    try {
      const res = await fetch("/api/users/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      
      if (!res.ok) {
        throw new Error("Unauthorized")
      }
      
      const userData = await res.json()
      setUser(userData)
    } catch (err) {
      console.error("Failed to fetch user data:", err)
      localStorage.removeItem("jwt")
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const login = (newToken: string) => {
    localStorage.setItem("jwt", newToken)
    setToken(newToken)
    fetchUserData(newToken)
  }

  const logout = () => {
    localStorage.removeItem("jwt")
    setToken(null)
    setUser(null)
    
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}