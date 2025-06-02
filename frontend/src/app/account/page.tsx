"use client"

import React, { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import Link from "next/link"

export default function ProfilePage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [nickname, setNickname] = useState(user?.nickname || "")

  // Form submission handler
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("jwt")}`
        },
        body: JSON.stringify({ nickname })
      })
      
      if (!response.ok) {
        throw new Error("Update failed")
      }
      
      // Exit edit mode after successful update
      setIsEditing(false)
      // Refresh user info
      window.location.reload()
    } catch (error) {
      console.error("Failed to update profile:", error)
    }
  }

  return (
    <div>
      <div className="border-b border-gray-200 pb-5 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 font-heading">Profile</h1>
        <p className="mt-2 text-sm text-gray-500">
          Manage your personal profile information
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        {isEditing ? (
          <form onSubmit={handleUpdateProfile}>
            <div className="mb-4">
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                Nickname
              </label>
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                required
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-medium font-heading">Basic Information</h2>
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-700 hover:text-gray-900"
              >
                <svg className="w-4 h-4 mr-1 inline" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex">
                <span className="text-gray-500 w-24">Nickname:</span>
                <span className="font-medium">{user?.nickname}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-24">Email:</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              {user?.role === "admin" && (
                <div className="flex">
                  <span className="text-gray-500 w-24">Role:</span>
                  <span className="font-medium capitalize">
                    Administrator
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Link
          href="/account/submissions"
          className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900"
        >
          View My Submissions
        </Link>
      </div>

      <div className="mt-6">
        <Link
          href="/account/settings"
          className="text-gray-700 hover:text-gray-900"
        >
          Account Settings
        </Link>
      </div>
    </div>
  )
} 