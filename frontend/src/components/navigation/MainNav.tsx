'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { Container } from '../ui/Container';
import { Logo } from '../ui/Logo';
import MobileNav from './MobileNav';
import { NAV_LINKS } from '@/lib/constants';
import { Thumbnail } from '../ui/Thumbnail';
import { usePromotionConfig } from '@/hooks/usePromotionConfig';
import { 
  getNavContainerStyles,
  getNavLinkStyles, 
  getUserMenuStyles,
  navLinkHoverStyles
} from '@/styles';

/**
 * Main navigation component - Responsive design with Tailwind CSS
 */
export default function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout, openLogin, openRegister } = useAuth();
  const { promotionConfig } = usePromotionConfig();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle outside click to close dropdown menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle logout
  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    router.push('/');
  };

  // Handle double click on user avatar to go to profile page
  const handleDoubleClick = () => {
    router.push('/account');
  };

  return (
    <>
      {/* Add hover animation styles */}
      <style jsx global>{navLinkHoverStyles}</style>
      
      <header className={getNavContainerStyles()}>
        <Container as="nav" className="flex items-center justify-between h-[70px]" spacing="standard">
          {/* Left area: Logo and navigation links */}
          <div className="flex items-center">
            {/* Logo area */}
            <Logo className="mr-8" size="lg" />
            
            {/* Desktop navigation menu */}
            <div className="hidden md:flex space-x-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-heading ${getNavLinkStyles({
                    isActive: pathname === link.href
                  })} ${pathname === link.href ? 'nav-link-active' : ''}`}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Dynamic promotion link */}
              {promotionConfig && (
                <Link
                  href={`/${promotionConfig.pageUrl}`}
                  className={`font-heading ${getNavLinkStyles({
                    isActive: pathname === `/${promotionConfig.pageUrl}`
                  })} ${pathname === `/${promotionConfig.pageUrl}` ? 'nav-link-active' : ''}`}
                >
                  {promotionConfig.navTitle}
                </Link>
              )}
            </div>
          </div>
          
          {/* Right area: Login/user info and mobile navigation */}
          <div className="flex items-center">
            {/* Login button/user menu - Now hidden on small screens, flex on medium+ */}
            <div className="hidden md:flex items-center text-base cursor-pointer flex-shrink-0 whitespace-nowrap">
              {loading ? (
                <span className="font-heading opacity-70">Loading...</span>
              ) : user ? (
                <div className={getUserMenuStyles('container')} ref={menuRef}>
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)} 
                    onDoubleClick={handleDoubleClick}
                    className={`font-heading ${getUserMenuStyles('trigger')}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {user.avatarUrl ? (
                        <Thumbnail 
                          src={user.avatarUrl} 
                          alt={user.nickname}
                          width={32}
                          height={32}
                          rounded
                        />
                      ) : (
                        <svg className="w-5 h-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      )}
                    </div>
                    <span>{user.nickname}</span>
                    <svg className={`w-4 h-4 ml-1 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  
                  {/* User dropdown menu */}
                  {isMenuOpen && (
                    <div className={getUserMenuStyles('dropdown')}>
                      <Link
                        href="/account"
                        className={`font-heading ${getUserMenuStyles('item')}`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <svg className="w-4 h-4 mr-2 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        Profile
                      </Link>
                      <Link
                        href="/account/submissions"
                        className={`font-heading ${getUserMenuStyles('item')}`}
                        onClick={() => setIsMenuOpen(false)}
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
                        className={`font-heading ${getUserMenuStyles('item')}`}
                        onClick={() => setIsMenuOpen(false)}
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
                          <div className={getUserMenuStyles('separator')}></div>
                          <Link
                            href="/account/manage-submissions"
                            className={`font-heading ${getUserMenuStyles('item')} text-purple-600 hover:bg-purple-50`}
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <svg className="w-4 h-4 mr-2 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Manage Submission
                          </Link>
                        </>
                      )}
                      
                      <div className={getUserMenuStyles('separator')}></div>
                      <button
                        onClick={handleLogout}
                        className={`font-heading ${getUserMenuStyles('logout')}`}
                      >
                        <svg className="w-4 h-4 mr-2 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                          <polyline points="16 17 21 12 16 7"></polyline>
                          <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <button onClick={openLogin} className="font-heading text-gray-600 hover:text-black nav-link-hover">
                    Login
                  </button>
                  <button 
                    onClick={openRegister} 
                    className="font-heading px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
            
            {/* Mobile navigation */}
            <div className="md:hidden">
              <MobileNav 
                onLoginClick={openLogin} 
                onRegisterClick={openRegister} 
              />
            </div>
          </div>
        </Container>
      </header>
    </>
  );
} 