"use client"

import React, { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { usersApi } from "@/api"
import { useRouter } from "next/navigation"
import { Modal } from '@/components/ui/Modal'

// 定义一个类型但不作为catch子句的类型注解
interface ApiErrorShape {
  response?: {
    status?: number;
    data?: {
      error?: string;
    };
  };
  message?: string;
}

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Password strength validation
  const validatePasswordStrength = (password: string) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    
    // Check if contains a number
    if (!/\d/.test(password)) {
      return "Password must contain at least one number";
    }
    
    // Check if contains a letter
    if (!/[a-zA-Z]/.test(password)) {
      return "Password must contain at least one letter";
    }
    
    return null; // Password meets requirements
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form default submit behavior
    
    // Form validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "Please fill all fields" });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords don't match" });
      return;
    }
    
    // Password strength validation
    const strengthError = validatePasswordStrength(newPassword);
    if (strengthError) {
      setMessage({ type: "error", text: strengthError });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      await usersApi.changePassword({
        oldPassword,
        newPassword
      });
      setMessage({ type: "success", text: "Password updated successfully!" });
      
      // Clear input fields
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      // 使用类型断言
      const apiError = error as ApiErrorShape;
      
      // Handle specific error types
      if (apiError.response?.status === 401 || 
          apiError.response?.data?.error?.toLowerCase().includes("incorrect") || 
          apiError.response?.data?.error?.toLowerCase().includes("wrong")) {
        setMessage({ type: "error", text: "Current password is incorrect. Please try again." });
      } else {
        const errorMessage = apiError.response?.data?.error || apiError.message || "Failed to update password";
        setMessage({ type: "error", text: errorMessage });
      }
      console.error("Password change error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      console.log("Attempting to delete account...");
      await usersApi.deleteCurrentUser();
      console.log("Account deletion successful, logging out...");
      
      // Only logout AFTER successful API call
      setTimeout(() => {
        logout();
        router.push('/');
      }, 100);
    } catch (err: unknown) {
      console.error("Account deletion failed:", err);
      
      // 更详细地记录错误
      if (err instanceof Error) {
        setDeleteError(`Failed to delete account: ${err.message}`);
        console.error("Error details:", err);
        
        // 如果是401错误，提示用户可能需要重新登录
        if (err.message.includes("401") || err.message.toLowerCase().includes("unauthorized")) {
          setDeleteError("Authorization error. Please try logging out and back in before deleting your account.");
        }
      } else {
        setDeleteError('Failed to delete account. Please try again.');
      }
      
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <div className="border-b border-gray-200 pb-5 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 font-heading">Account Settings</h1>
        <p className="mt-2 text-sm text-gray-500">
          Manage your account and security settings
        </p>
      </div>

      {/* Password change section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
        <h2 className="text-xl font-medium mb-4 font-heading">Change Password</h2>
        
        {message && (
          <div className={`p-3 rounded mb-4 ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {message.text}
          </div>
        )}
        
        <form className="space-y-4" onSubmit={handlePasswordChange}>
          <div>
            <label htmlFor="old-password" className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              id="old-password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
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
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters and include both letters and numbers</p>
          </div>
          
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`${loading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"} text-white px-4 py-2 rounded-md`}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* Account security section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-medium mb-4 font-heading">Account Security</h2>
        
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Email Address</span>
            </div>
            <p className="text-gray-500 text-sm">{user?.email}</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Delete Account</span>
            </div>
            <p className="text-gray-500 text-sm mb-3">Deleting your account will permanently remove all your data</p>
            <button 
              type="button" 
              className="text-red-500 border border-red-300 px-4 py-2 rounded-md hover:bg-red-50"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete My Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} contentVariant="dark-glass">
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4 text-white font-heading">Delete Account</h2>
            <p className="mb-4 text-white">Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently removed.</p>
            {deleteError && <div className="text-red-300 mb-2">{deleteError}</div>}
            <div className="flex justify-center gap-4 mt-6">
              <button
                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
              <button
                className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
} 