'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Thumbnail } from '@/components/ui/Thumbnail';
import { NAV_LINKS } from '@/lib/constants';
import { 
  getNavLinkStyles, 
  getMobileNavStyles
} from '@/styles';

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
        className={getMobileNavStyles('toggle')}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        <i className={`fa-solid ${isOpen ? 'fa-times' : 'fa-bars'} h-6 w-6`} aria-hidden="true"></i>
      </button>

      {/* Mobile navigation menu */}
      {isOpen && (
        <div className={getMobileNavStyles('overlay')}>
          <div className={getMobileNavStyles('container')}>
            {/* User information */}
            {user && (
              <div className={getMobileNavStyles('userInfo')}>
                <div className={getMobileNavStyles('userProfile')}>
                  <div className={getMobileNavStyles('avatar')}>
                    {user.avatarUrl ? (
                      <Thumbnail
                        src={user.avatarUrl}
                        alt={user.nickname}
                        width={40}
                        height={40}
                        rounded
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
                    className={getMobileNavStyles('navItem')}
                    onClick={() => setIsOpen(false)}
                  >
                    <i className="fa-solid fa-user mr-2"></i>
                    Profile
                  </Link>
                  <Link
                    href="/account/submissions"
                    className={getMobileNavStyles('navItem')}
                    onClick={() => setIsOpen(false)}
                  >
                    <i className="fa-solid fa-images mr-2"></i>
                    My Submissions
                  </Link>
                  <Link
                    href="/account/settings"
                    className={getMobileNavStyles('navItem')}
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
                  className={pathname === link.href 
                    ? getMobileNavStyles('navItemActive') 
                    : getMobileNavStyles('navItem')
                  }
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
              className={getMobileNavStyles('closeButton')}
            >
              <i className="fa-solid fa-times text-lg"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 