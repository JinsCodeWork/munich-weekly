"use client"

import React from "react"
import { useAuth } from "@/context/AuthContext"

export default function SettingsPage() {
  const { user } = useAuth()

  return (
    <div>
      <div className="border-b border-gray-200 pb-5 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="mt-2 text-sm text-gray-500">
          Manage your account and security settings
        </p>
      </div>

      {/* Password change section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
        <h2 className="text-xl font-medium mb-4">Change Password</h2>
        
        <form className="space-y-4">
          <div>
            <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              id="current-password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              id="new-password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirm-password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* Account security section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-medium mb-4">Account Security</h2>
        
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Email Address</span>
              <span className="text-green-500 text-sm bg-green-50 px-2 py-1 rounded">
                Verified
              </span>
            </div>
            <p className="text-gray-500 text-sm">{user?.email}</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Delete Account</span>
            </div>
            <p className="text-gray-500 text-sm mb-3">Deleting your account will permanently remove all your data</p>
            <button className="text-red-500 border border-red-300 px-4 py-2 rounded-md hover:bg-red-50">
              Delete My Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 