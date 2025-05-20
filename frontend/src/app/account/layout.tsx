"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Container } from "@/components/ui/Container"
import { useAuth } from "@/context/AuthContext"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

// Sidebar items configuration
const SIDEBAR_ITEMS = [
  { 
    label: "Profile", 
    href: "/account", 
    icon: (
      <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    )
  },
  { 
    label: "My Submissions", 
    href: "/account/submissions", 
    icon: (
      <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
      </svg>
    ) 
  },
  { 
    label: "Settings", 
    href: "/account/settings", 
    icon: (
      <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    ) 
  }
]

// Admin-only sidebar items
const ADMIN_SIDEBAR_ITEMS = [
  {
    label: "Manage Submissions",
    href: "/account/manage-submissions"
  },
  {
    label: "Manage Issues",
    href: "/account/manage-issues"
  },
  {
    label: "Home Settings",
    href: "/account/home-settings"
  },
  {
    label: "Users Management",
    href: "/account/users"
  }
]

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Update when path changes to close mobile menu
  useEffect(() => {
    if (pathname) {
      // Close mobile menu when navigating
      setMobileMenuOpen(false)
    }
  }, [pathname])

  // Handle logout
  const handleLogout = () => {
    logout()
    router.push("/")
  }

  // Redirect to homepage if user is not logged in
  React.useEffect(() => {
    const preserveAuth = sessionStorage.getItem("preserve_auth")
    
    // 仅在以下情况重定向到主页：
    // 1. 用户明确未登录（非加载状态且user为null）
    // 2. 没有保存认证状态的标志
    if (!user && !loading && !preserveAuth && typeof window !== "undefined") {
      console.log("User not authenticated, redirecting to homepage")
      router.push("/")
    }
  }, [user, router, loading])

  if (!user) {
    return null // Prevent flash, wait for redirect
  }

  const isAdmin = user.role === "admin"

  return (
    <>
      {/* Mobile menu styles */}
      <style jsx global>{`
        .mobile-menu {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          width: 80%;
          max-width: 300px;
          z-index: 50;
          background-color: white;
          box-shadow: 4px 0 10px rgba(0, 0, 0, 0.1);
          transform: translateX(-100%);
          transition: transform 0.3s ease-in-out;
          overflow-y: auto;
        }
        
        .mobile-menu.open {
          transform: translateX(0);
        }
        
        .mobile-menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 40;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease-in-out;
        }
        
        .mobile-menu-overlay.open {
          opacity: 1;
          pointer-events: auto;
        }
        
        /* Mobile styles */
        @media (max-width: 768px) {
          .desktop-sidebar {
            display: none;
          }
          
          /* Remove unneeded mobile title class */
          .mobile-title {
            display: none !important;
          }
          
          /* Fix padding for mobile devices */
          .mobile-padding-fix {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
        }
      `}</style>
      
      <Container className="min-h-screen mt-8 mb-16">
        {/* Desktop sidebar */}
        <div className="flex w-full">
          <aside className="w-64 border-r border-gray-200 pr-6 flex-shrink-0 desktop-sidebar">
            <div className="mb-8 text-center">
              <div className="text-xl font-bold text-gray-900">{user.nickname}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
              {isAdmin && (
                <div className="mt-1 inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                  Admin
                </div>
              )}
            </div>

            {/* Navigation menu */}
            <nav className="flex flex-col items-center space-y-3">
              {SIDEBAR_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-center py-2 px-4 text-sm font-medium rounded-md w-full",
                    pathname === item.href
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    "transition-colors duration-200"
                  )}
                >
                  <span className="flex items-center justify-center">
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                  </span>
                </Link>
              ))}

              {/* Admin-only navigation items */}
              {isAdmin && (
                <>
                  <div className="pt-4 mt-4 border-t border-gray-200 w-full text-center">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Admin Tools
                    </h3>
                  </div>
                  
                  {ADMIN_SIDEBAR_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-center py-2 px-4 text-sm font-medium rounded-md w-full",
                        pathname === item.href
                          ? "bg-purple-100 text-purple-900"
                          : "text-gray-600 hover:bg-purple-50 hover:text-purple-900",
                        "transition-colors duration-200"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </>
              )}
            </nav>

            {/* Bottom logout button */}
            <div className="mt-8 pt-4 border-t border-gray-200 flex justify-center">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center py-2 px-4 text-sm font-medium text-red-500 hover:text-red-700 rounded-md hover:bg-red-50"
              >
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-3 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Logout
                </span>
              </button>
            </div>
          </aside>

          {/* Main content area */}
          <main className="flex-1 pl-8 md:pl-8 mobile-padding-fix">
            {/* Remove mobile view header with hamburger menu */}
            {children}
          </main>
        </div>
        
        {/* Mobile menu overlay */}
        <div 
          className={cn("mobile-menu-overlay", mobileMenuOpen ? "open" : "")}
          onClick={() => setMobileMenuOpen(false)}
        />
        
        {/* Mobile menu sidebar */}
        <div className={cn("mobile-menu", mobileMenuOpen ? "open" : "")}>
          <div className="p-4">
            <div className="mb-4 pb-4 border-b border-gray-200 text-center">
              <div className="text-xl font-bold text-gray-900">{user.nickname}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
              {isAdmin && (
                <div className="mt-1 inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                  Admin
                </div>
              )}
            </div>

            {/* Mobile Navigation */}
            <nav className="flex flex-col items-center space-y-3 mb-6">
              {SIDEBAR_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-center py-2 px-4 text-sm font-medium rounded-md w-full",
                    pathname === item.href
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    "transition-colors duration-200"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="flex items-center justify-center">
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                  </span>
                </Link>
              ))}

              {/* Admin-only navigation items (mobile) */}
              {isAdmin && (
                <>
                  <div className="pt-4 mt-4 border-t border-gray-200 w-full text-center">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Admin Tools
                    </h3>
                  </div>
                  
                  {ADMIN_SIDEBAR_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-center py-2 px-4 text-sm font-medium rounded-md w-full",
                        pathname === item.href
                          ? "bg-purple-100 text-purple-900"
                          : "text-gray-600 hover:bg-purple-50 hover:text-purple-900",
                        "transition-colors duration-200"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </>
              )}
            </nav>

            {/* Mobile logout button */}
            <div className="pt-4 border-t border-gray-200 flex justify-center">
              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="flex items-center justify-center py-2 px-4 text-sm font-medium text-red-500 hover:text-red-700 rounded-md hover:bg-red-50"
              >
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-3 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Logout
                </span>
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
              aria-label="Close menu"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </Container>
    </>
  )
} 