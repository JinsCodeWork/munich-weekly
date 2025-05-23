'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Thumbnail } from '@/components/ui/Thumbnail';
import { NAV_LINKS } from '@/lib/constants';
import { 
  getMobileNavStyles,
  navLinkHoverStyles
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
  const { user, logout } = useAuth();
  const router = useRouter();

  // Handle logout
  const handleLogout = () => {
    logout();
    setIsOpen(false);
    router.push('/');
  };

  // Prevent scrolling when menu is open
  React.useEffect(() => {
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
    <div className="relative">
      {/* 添加CSS动画定义 */}
      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
      
      {/* 导航链接悬停样式 */}
      <style jsx global>{navLinkHoverStyles}</style>
      
      {/* Button container */}
      <button 
        onClick={toggleMenu}
        className={getMobileNavStyles('toggle')}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        style={{ 
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* SVG Hamburger Icon instead of Font Awesome */}
        {isOpen ? (
          // X (Close) Icon
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
        ) : (
          // Hamburger Menu Icon
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
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        )}
      </button>

      {/* Mobile navigation menu with slide animation */}
      {isOpen && (
        <div className={getMobileNavStyles('overlay')} style={{ animation: 'fadeIn 0.3s ease-out forwards' }}>
          <div className={getMobileNavStyles('container')} style={{ 
            animation: 'slideIn 0.3s ease-out forwards',
            transform: 'translateX(100%)'
          }}>
            {/* User information */}
            {user && (
              <div className={getMobileNavStyles('userInfo')}>
                <div className={getMobileNavStyles('userProfile')}>
                  <div className={getMobileNavStyles('avatar')}>
                    {user.avatarUrl ? (
                      <Thumbnail
                        src={user.avatarUrl}
                        alt={user.nickname || 'User'}
                        width={40}
                        height={40}
                        rounded
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {/* User SVG icon */}
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="20" 
                          height="20" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="#666" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-heading font-medium">{user.nickname || 'User'}</p>
                    <p className="font-sans text-xs text-gray-500">{user.email || ''}</p>
                  </div>
                </div>

                <div className="flex flex-col items-center space-y-2 text-center">
                  <Link
                    href="/account"
                    className={`font-heading ${getMobileNavStyles('navItem')} relative nav-link-hover flex items-center justify-center`}
                    onClick={() => setIsOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-2 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Profile
                  </Link>
                  <Link
                    href="/account/submissions"
                    className={`font-heading ${getMobileNavStyles('navItem')} relative nav-link-hover flex items-center justify-center`}
                    onClick={() => setIsOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-2 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    My Submissions
                  </Link>
                  <Link
                    href="/account/settings"
                    className={`font-heading ${getMobileNavStyles('navItem')} relative nav-link-hover flex items-center justify-center`}
                    onClick={() => setIsOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-2 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    Settings
                  </Link>
                  
                  {/* Admin-only option for Manage Submission */}
                  {user && user.role === 'admin' && (
                    <>
                      <div className="w-full border-t border-gray-200 my-2"></div>
                      <Link
                        href="/account/manage-submissions"
                        className={`font-heading ${getMobileNavStyles('navItem')} relative nav-link-hover flex items-center justify-center text-purple-600`}
                        onClick={() => setIsOpen(false)}
                      >
                        <svg className="w-4 h-4 mr-2 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Manage Submission
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Navigation links */}
            <div className="flex flex-col items-center space-y-3 mb-6 text-center">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-heading ${pathname === link.href 
                    ? getMobileNavStyles('navItemActive') 
                    : getMobileNavStyles('navItem')
                  } relative nav-link-hover ${pathname === link.href ? 'nav-link-active' : ''}`}
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Authentication buttons */}
            {user ? (
              <div className="flex justify-center w-full">
                <button
                  onClick={handleLogout}
                  className="font-heading text-center py-2 text-red-500 flex items-center justify-center"
                >
                  <svg className="inline-block w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-2 w-full flex flex-col items-center">
                <button
                  onClick={() => {
                    if (onLoginClick) onLoginClick();
                    setIsOpen(false);
                  }}
                  className="font-heading w-full py-2 text-gray-800"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    if (onRegisterClick) onRegisterClick();
                    setIsOpen(false);
                  }}
                  className="font-heading w-full bg-black text-white py-2 px-4 rounded-md"
                >
                  Register
                </button>
              </div>
            )}

            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className={getMobileNavStyles('closeButton')}
              style={{ position: 'absolute', right: '16px', top: '16px' }}
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
      )}
    </div>
  );
} 