"use client"

import React, { useState, useEffect } from "react"
import { Modal } from "@/components/ui/Modal"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import Link from "next/link"

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
        // 处理特定错误类型，提供更友好的错误信息
        if (data.error === "Invalid Request" && data.message && data.message.includes("Invalid email or password")) {
          throw new Error("Incorrect email or password")
        } else if (data.error === "Invalid Request") {
          throw new Error(data.message || "Login failed. Please check your credentials.")
        } else {
          throw new Error(data?.error || data?.message || "Login failed")
        }
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
          "backdrop-blur-none border-none rounded-lg",
          "p-8 w-[90vw] max-w-md",
          "flex flex-col items-center"
        )}
      >
        <h1 className="font-heading text-4xl font-bold text-white mb-12 tracking-wider animate-fadeIn opacity-0" style={{ animationDelay: "0.1s" }}>
          Welcome
        </h1>

        <div className="relative w-full mb-8 animate-fadeIn opacity-0" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center border border-white rounded-full px-6 py-4 shadow-md shadow-white/20">
            <input
              type="email"
              placeholder="Your email"
              required
              className="font-sans bg-transparent text-white text-lg w-full placeholder:text-white/80 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting || success}
            />
            <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        </div>

        <div className="relative w-full mb-10 animate-fadeIn opacity-0" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center border border-white rounded-full px-6 py-4 shadow-md shadow-white/20">
            <input
              type="password"
              placeholder="Your password"
              required
              className="font-sans bg-transparent text-white text-lg w-full placeholder:text-white/80 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting || success}
            />
            <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
        </div>

        <div className="flex justify-between w-full mb-10 animate-fadeIn opacity-0" style={{ animationDelay: "0.4s" }}>
          <label className="font-sans flex items-center text-white text-lg cursor-pointer">
            <input
              type="checkbox"
              className="mr-2 w-4 h-4"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isSubmitting || success}
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="font-sans text-white text-lg cursor-pointer hover:underline"
            onClick={() => onClose()}
          >
            Forgot password?
          </Link>
        </div>

        {/* Error message */}
        {error && (
          <p className="font-sans text-red-300 text-sm mb-4 animate-fadeIn opacity-0" style={{ animationDelay: "0.45s" }}>
            {error}
          </p>
        )}

        {/* Success message */}
        {success && (
          <div className="bg-green-500/20 text-green-200 px-4 py-3 rounded-md w-full mb-4 flex items-center justify-center animate-fadeIn opacity-0" style={{ animationDelay: "0s" }}>
            <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span className="font-sans">Login successful! Redirecting...</span>
          </div>
        )}

        <button
          type="submit"
          className={cn(
            "font-sans w-full py-4 rounded-full text-lg font-semibold tracking-wide mb-6 transition-colors",
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

        <p className="font-sans text-white text-lg mt-8 animate-fadeIn opacity-0" style={{ animationDelay: "0.6s" }}>
          Don&apos;t have an account?{" "}
          <button
            type="button"
            className="font-sans font-medium hover:underline cursor-pointer"
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