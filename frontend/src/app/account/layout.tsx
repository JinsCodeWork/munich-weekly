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
    icon: "fa-solid fa-user" 
  },
  { 
    label: "My Submissions", 
    href: "/account/submissions", 
    icon: "fa-solid fa-images" 
  },
  { 
    label: "Settings", 
    href: "/account/settings", 
    icon: "fa-solid fa-gear" 
  }
]

// Admin-only sidebar items
const ADMIN_SIDEBAR_ITEMS = [
  {
    label: "Manage Submissions",
    href: "/account/manage-submissions",
    icon: "fa-solid fa-tasks"
  },
  {
    label: "Manage Issues",
    href: "/account/manage-issues",
    icon: "fa-solid fa-calendar-week"
  }
]

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout } = useAuth()
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
    if (!user && typeof window !== "undefined") {
      router.push("/")
    }
  }, [user, router])

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
            <div className="mb-8">
              <div className="text-xl font-bold text-gray-900">{user.nickname}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
              {isAdmin && (
                <div className="mt-1 inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                  Admin
                </div>
              )}
            </div>

            {/* Navigation menu */}
            <nav className="space-y-1">
              {SIDEBAR_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center py-2 px-3 text-sm font-medium rounded-md group",
                    pathname === item.href
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <i className={cn(item.icon, "mr-3 text-gray-500")}></i>
                  {item.label}
                </Link>
              ))}

              {/* Admin-only navigation items */}
              {isAdmin && (
                <>
                  <div className="pt-4 mt-4 border-t border-gray-200">
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Admin Tools
                    </h3>
                  </div>
                  
                  {ADMIN_SIDEBAR_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center py-2 px-3 text-sm font-medium rounded-md group",
                        pathname === item.href
                          ? "bg-purple-100 text-purple-900"
                          : "text-gray-600 hover:bg-purple-50 hover:text-purple-900"
                      )}
                    >
                      <i className={cn(item.icon, "mr-3 text-purple-500")}></i>
                      {item.label}
                    </Link>
                  ))}
                </>
              )}
            </nav>

            {/* Bottom logout button */}
            <div className="mt-8 pt-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="flex items-center py-2 px-3 text-sm font-medium text-red-500 hover:text-red-700 rounded-md hover:bg-red-50 w-full"
              >
                <i className="fa-solid fa-sign-out-alt mr-3"></i>
                Logout
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
            <div className="mb-4 pb-4 border-b border-gray-200">
              <div className="text-xl font-bold text-gray-900">{user.nickname}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
              {isAdmin && (
                <div className="mt-1 inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                  Admin
                </div>
              )}
            </div>
            
            {/* Mobile navigation */}
            <nav className="space-y-1">
              {SIDEBAR_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center py-3 px-3 text-sm font-medium rounded-md",
                    pathname === item.href
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <i className={cn(item.icon, "mr-3 text-gray-500")}></i>
                  {item.label}
                </Link>
              ))}

              {/* Admin-only navigation items for mobile */}
              {isAdmin && (
                <>
                  <div className="pt-4 mt-4 border-t border-gray-200">
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Admin Tools
                    </h3>
                  </div>
                  
                  {ADMIN_SIDEBAR_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center py-3 px-3 text-sm font-medium rounded-md",
                        pathname === item.href
                          ? "bg-purple-100 text-purple-900"
                          : "text-gray-600 hover:bg-purple-50 hover:text-purple-900"
                      )}
                    >
                      <i className={cn(item.icon, "mr-3 text-purple-500")}></i>
                      {item.label}
                    </Link>
                  ))}
                </>
              )}
            </nav>
            
            {/* Mobile logout button */}
            <div className="mt-8 pt-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="flex items-center py-3 px-3 text-sm font-medium text-red-500 hover:text-red-700 rounded-md hover:bg-red-50 w-full"
              >
                <i className="fa-solid fa-sign-out-alt mr-3"></i>
                Logout
              </button>
            </div>
          </div>
        </div>
      </Container>
    </>
  )
} 