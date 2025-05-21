"use client"

import React, { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data?.error || "Failed to send reset email, please try again later")
      }

      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsSubmitting(false)
    }
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
            <h2 className="text-black text-2xl font-bold mb-4">Reset Link Sent</h2>
            <p className="text-black mb-6">
              If your email exists in our system, you will receive an email with password reset link shortly. Please check your inbox.
            </p>
            <Link 
              href="/" 
              className="inline-block bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        ) : (
          <form 
            onSubmit={handleSubmit} 
            className="bg-white p-8 rounded-xl border border-gray-200 shadow-md animate-fadeIn"
          >
            <h1 className="text-black text-3xl font-bold mb-8 text-center">Forgot Password</h1>
            
            <p className="text-black mb-6">
              Please enter your registered email, and we will send you a password reset link.
            </p>
            
            <div className="mb-6">
              <label htmlFor="email" className="block text-black mb-2">Email Address</label>
              <input
                id="email"
                type="email"
                className={cn(
                  "w-full p-3 rounded-lg bg-white border border-gray-300 text-black placeholder:text-gray-500",
                  "focus:ring-2 focus:ring-gray-300 focus:outline-none focus:border-gray-400"
                )}
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md mb-6 border border-red-200">
                {error}
              </div>
            )}
            
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
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </button>
            
            <div className="mt-6 text-center">
              <Link href="/" className="text-black hover:underline">
                Return to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  )
} 