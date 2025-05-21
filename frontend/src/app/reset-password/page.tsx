"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  
  // Get token from URL
  useEffect(() => {
    const urlToken = searchParams?.get("token")
    if (urlToken) {
      setToken(urlToken)
    } else {
      setError("Invalid reset link. Please request a new password reset.")
    }
  }, [searchParams])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Validate password match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    
    // Validate password length
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword }),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data?.error || "Password reset failed. The link may have expired.")
      }
      
      setSuccess(true)
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push("/")
      }, 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (!token && !error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-400"></div>
      </div>
    )
  }
  
  return (
    <main className="relative min-h-screen w-full flex justify-center items-center py-12 px-4 bg-white">
      <div className="w-full max-w-md">
        {success ? (
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-md text-center animate-fadeIn">
            <svg className="w-16 h-16 text-green-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h2 className="text-black text-2xl font-bold mb-4">Password Reset Successful</h2>
            <p className="text-black mb-6">
              Your password has been successfully reset. You will be automatically redirected to the login page.
            </p>
            <Link 
              href="/" 
              className="inline-block bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
            >
              Login Now
            </Link>
          </div>
        ) : (
          <form 
            onSubmit={handleSubmit} 
            className="bg-white p-8 rounded-xl border border-gray-200 shadow-md animate-fadeIn"
          >
            <h1 className="text-black text-3xl font-bold mb-8 text-center">Reset Password</h1>
            
            {error ? (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md mb-6 border border-red-200">
                {error}
                {!token && (
                  <div className="mt-4">
                    <Link href="/forgot-password" className="text-black underline">
                      Return to Forgot Password Page
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label htmlFor="newPassword" className="block text-black mb-2">New Password</label>
                  <input
                    id="newPassword"
                    type="password"
                    className={cn(
                      "w-full p-3 rounded-lg bg-white border border-gray-300 text-black placeholder:text-gray-500",
                      "focus:ring-2 focus:ring-gray-300 focus:outline-none focus:border-gray-400"
                    )}
                    placeholder="Set new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    minLength={6}
                  />
                </div>
                
                <div className="mb-8">
                  <label htmlFor="confirmPassword" className="block text-black mb-2">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className={cn(
                      "w-full p-3 rounded-lg bg-white border border-gray-300 text-black placeholder:text-gray-500",
                      "focus:ring-2 focus:ring-gray-300 focus:outline-none focus:border-gray-400"
                    )}
                    placeholder="Enter password again"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                
                <button
                  type="submit"
                  className={cn(
                    "w-full py-3 rounded-lg font-medium transition-colors",
                    isSubmitting
                      ? "bg-gray-500 text-white cursor-not-allowed"
                      : "bg-black text-white hover:bg-gray-800"
                  )}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Reset Password"}
                </button>
              </>
            )}
            
            {!error && (
              <div className="mt-6 text-center">
                <Link href="/" className="text-black hover:underline">
                  Return to Login
                </Link>
              </div>
            )}
          </form>
        )}
      </div>
    </main>
  )
}