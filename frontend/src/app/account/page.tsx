"use client"

import React, { useState } from "react"
import { useAuth } from "@/context/AuthContext"

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
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-medium">Basic Information</h2>
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-500 hover:text-blue-700"
              >
                <i className="fa-solid fa-edit mr-1"></i> 
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
    </div>
  )
} 