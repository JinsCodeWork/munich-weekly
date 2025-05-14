'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_LINKS } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface MobileNavProps {
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
}

/**
 * Mobile navigation menu for small screens
 */
export default function MobileNav({ onLoginClick, onRegisterClick }: MobileNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const router = useRouter();

  // Handle outside click to close menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle logout
  const handleLogout = () => {
    logout();
    setIsOpen(false);
    router.push('/');
  };

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'visible';
    }

    return () => {
      document.body.style.overflow = 'visible';
    };
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={toggleMenu}
        className="p-2 text-gray-600 focus:outline-none"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        <i className={`fa-solid ${isOpen ? 'fa-times' : 'fa-bars'} h-6 w-6`} aria-hidden="true"></i>
      </button>

      {/* Mobile navigation menu */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-xl p-5 overflow-y-auto">
            {/* User information */}
            {user && (
              <div className="pb-4 mb-4 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.nickname}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <i className="fa-solid fa-user text-gray-500"></i>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{user.nickname}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Link
                    href="/account"
                    className="block py-2 text-gray-600 hover:text-black"
                    onClick={() => setIsOpen(false)}
                  >
                    <i className="fa-solid fa-user mr-2"></i>
                    Profile
                  </Link>
                  <Link
                    href="/account/submissions"
                    className="block py-2 text-gray-600 hover:text-black"
                    onClick={() => setIsOpen(false)}
                  >
                    <i className="fa-solid fa-images mr-2"></i>
                    My Submissions
                  </Link>
                  <Link
                    href="/account/settings"
                    className="block py-2 text-gray-600 hover:text-black"
                    onClick={() => setIsOpen(false)}
                  >
                    <i className="fa-solid fa-gear mr-2"></i>
                    Settings
                  </Link>
                </div>
              </div>
            )}

            {/* Navigation links */}
            <div className="space-y-3 mb-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'block px-3 py-2 rounded-md text-base font-medium',
                    pathname === link.href
                      ? 'bg-gray-100 text-black'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                  )}
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Authentication buttons */}
            {user ? (
              <button
                onClick={handleLogout}
                className="block w-full text-left py-2 text-red-500 hover:text-red-700"
              >
                <i className="fa-solid fa-sign-out-alt mr-2"></i>
                Logout
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    if (onLoginClick) onLoginClick();
                    setIsOpen(false);
                  }}
                  className="block w-full py-2 text-blue-500 font-medium"
                >
                  <i className="fa-solid fa-sign-in-alt mr-2"></i>
                  Login
                </button>
                <button
                  onClick={() => {
                    if (onRegisterClick) onRegisterClick();
                    setIsOpen(false);
                  }}
                  className="block w-full py-2 text-blue-500 font-medium"
                >
                  <i className="fa-solid fa-user-plus mr-2"></i>
                  Register
                </button>
              </div>
            )}

            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black"
            >
              <i className="fa-solid fa-times text-lg"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 