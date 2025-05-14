"use client"

import React, { useState, useEffect } from "react"
import { Modal } from "@/components/ui/Modal"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"

interface LoginFormProps {
  isOpen: boolean
  onClose: () => void
  onRegisterClick?: () => void
}

/**
 * Login form component - Glassmorphism effect
 */
export function LoginForm({ isOpen, onClose, onRegisterClick }: LoginFormProps) {
  const { login, user } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Monitor login status and close modal on successful login
  useEffect(() => {
    if (user && success) {
      // Set a short delay to allow user to see success message
      const timer = setTimeout(() => {
        onClose()
      }, 1500)
      
      return () => clearTimeout(timer)
    }
  }, [user, success, onClose])

  // Reset state each time modal is opened
  useEffect(() => {
    if (isOpen) {
      setEmail("")
      setPassword("")
      setError("")
      setSuccess(false)
      setIsSubmitting(false)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/auth/login/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.error || "Login failed")
      }

      const { token } = await res.json()
      login(token)
      
      // Set success state
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle register button click
  const handleRegisterClick = () => {
    if (onRegisterClick) {
      onRegisterClick()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form
        onSubmit={handleSubmit}
        className={cn(
          "bg-white/10 backdrop-blur-md border border-white/30 rounded-lg",
          "p-8 shadow-xl w-[90vw] max-w-md",
          "flex flex-col items-center",
          "animate-in fade-in duration-500"
        )}
      >
        <h1 className="text-4xl font-bold text-white mb-12 tracking-wider animate-fadeIn opacity-0" style={{ animationDelay: "0.1s" }}>
          Welcome
        </h1>

        <div className="relative w-full mb-8 animate-fadeIn opacity-0" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center border border-white rounded-full px-6 py-4 shadow-md shadow-white/20">
            <input
              type="email"
              placeholder="Your email"
              required
              className="bg-transparent text-white text-lg w-full placeholder:text-white/80 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting || success}
            />
            <i className="fa-solid fa-user text-white text-lg"></i>
          </div>
        </div>

        <div className="relative w-full mb-10 animate-fadeIn opacity-0" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center border border-white rounded-full px-6 py-4 shadow-md shadow-white/20">
            <input
              type="password"
              placeholder="Your password"
              required
              className="bg-transparent text-white text-lg w-full placeholder:text-white/80 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting || success}
            />
            <i className="fa-solid fa-lock text-white text-lg"></i>
          </div>
        </div>

        <div className="flex justify-between w-full mb-10 animate-fadeIn opacity-0" style={{ animationDelay: "0.4s" }}>
          <label className="flex items-center text-white text-lg cursor-pointer">
            <input
              type="checkbox"
              className="mr-2 w-4 h-4"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isSubmitting || success}
            />
            Remember me
          </label>
          <button
            type="button"
            className="text-white text-lg cursor-pointer hover:underline"
            disabled={isSubmitting || success}
          >
            Forgot password?
          </button>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-red-400 text-sm mb-4 animate-fadeIn opacity-0" style={{ animationDelay: "0.45s" }}>
            {error}
          </p>
        )}

        {/* Success message */}
        {success && (
          <div className="bg-green-500/20 text-green-200 px-4 py-3 rounded-md w-full mb-4 flex items-center justify-center animate-fadeIn opacity-0" style={{ animationDelay: "0s" }}>
            <i className="fa-solid fa-check-circle mr-2"></i>
            Login successful! Redirecting...
          </div>
        )}

        <button
          type="submit"
          className={cn(
            "w-full py-4 rounded-full text-lg font-semibold tracking-wide mb-6 transition-colors",
            "animate-fadeIn opacity-0",
            success 
              ? "bg-green-500 text-white cursor-not-allowed" 
              : isSubmitting 
                ? "bg-white/70 text-gray-700 cursor-not-allowed" 
                : "bg-white text-gray-900 hover:bg-gray-200"
          )}
          style={{ animationDelay: "0.5s" }}
          disabled={isSubmitting || success}
        >
          {isSubmitting ? "Logging in..." : success ? "Success" : "Login"}
        </button>

        <p className="text-white text-lg mt-8 animate-fadeIn opacity-0" style={{ animationDelay: "0.6s" }}>
          Don&apos;t have an account?{" "}
          <button
            type="button"
            className="font-medium hover:underline cursor-pointer"
            onClick={handleRegisterClick}
            disabled={isSubmitting || success}
          >
            Register
          </button>
        </p>
      </form>
    </Modal>
  )
}