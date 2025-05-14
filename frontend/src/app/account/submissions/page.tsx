"use client"

import React from "react"
import { useAuth } from "@/context/AuthContext"

export default function SubmissionsPage() {
  return (
    <div>
      <div className="border-b border-gray-200 pb-5 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Submissions</h1>
        <p className="mt-2 text-sm text-gray-500">
          View and manage all your submitted photos
        </p>
      </div>

      {/* Placeholder content, will be replaced with actual submissions list */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <div className="text-gray-400 mb-4">
          <i className="fa-solid fa-image text-4xl"></i>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          You don't have any submissions yet
        </h3>
        <p className="text-gray-500 mb-4">
          Upload your photos to participate in Munich Weekly
        </p>
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
          Upload Photo
        </button>
      </div>
    </div>
  )
} 