'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Container } from '../ui/Container';
import { Logo } from '../ui/Logo';
import MobileNav from './MobileNav';
import { NAV_LINKS } from '@/lib/constants';
import { LoginForm } from '../auth/LoginForm';
import { RegisterForm } from '../auth/RegisterForm';
import { Thumbnail } from '../ui/Thumbnail';

/**
 * Main navigation component - Responsive design with Tailwind CSS
 */
export default function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
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

  const handleOpenLogin = () => {
    setIsRegisterOpen(false); // Ensure register modal is closed
    setIsLoginOpen(true);
  };

  const handleCloseLogin = () => {
    setIsLoginOpen(false);
  };

  const handleOpenRegister = () => {
    setIsLoginOpen(false); // Ensure login modal is closed
    setIsRegisterOpen(true);
  };

  const handleCloseRegister = () => {
    setIsRegisterOpen(false);
  };

  const handleLoginClick = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  const handleRegisterClick = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    router.push('/');
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
        <Container as="nav" className="flex items-center justify-between h-[70px]">
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
                  className={cn(
                    'text-base text-gray-600 hover:text-black whitespace-nowrap font-medium',
                    pathname === link.href && 'text-black font-semibold'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Right area: Login/user info and mobile navigation */}
          <div className="flex items-center">
            {/* Login button/user menu */}
            <div className="text-base text-gray-600 hover:text-black cursor-pointer flex-shrink-0 whitespace-nowrap font-medium">
              {loading ? (
                <span className="opacity-70">Loading...</span>
              ) : user ? (
                <div className="relative" ref={menuRef}>
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)} 
                    className="flex items-center gap-2"
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
                        <i className="fa-solid fa-user text-gray-500"></i>
                      )}
                    </div>
                    <span>{user.nickname}</span>
                    <i className={`fa-solid fa-chevron-down text-xs transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}></i>
                  </button>
                  
                  {/* User dropdown menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                      <Link
                        href="/account"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <i className="fa-solid fa-user mr-2"></i>
                        Profile
                      </Link>
                      <Link
                        href="/account/submissions"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <i className="fa-solid fa-images mr-2"></i>
                        My Submissions
                      </Link>
                      <Link
                        href="/account/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <i className="fa-solid fa-gear mr-2"></i>
                        Settings
                      </Link>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="block px-4 py-2 text-sm text-red-500 hover:bg-gray-100 w-full text-left"
                      >
                        <i className="fa-solid fa-sign-out-alt mr-2"></i>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <button onClick={handleOpenLogin} className="hover:text-black">
                    Login
                  </button>
                  <span className="text-gray-300">|</span>
                  <button 
                    onClick={handleOpenRegister} 
                    className="hover:text-black"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
            
            {/* Mobile navigation */}
            <div className="ml-4 md:hidden">
              <MobileNav 
                onLoginClick={handleOpenLogin} 
                onRegisterClick={handleOpenRegister} 
              />
            </div>
          </div>
        </Container>
      </header>

      {/* Login modal */}
      <LoginForm 
        isOpen={isLoginOpen} 
        onClose={handleCloseLogin} 
        onRegisterClick={handleRegisterClick}
      />

      {/* Register modal */}
      <RegisterForm
        isOpen={isRegisterOpen}
        onClose={handleCloseRegister}
        onLoginClick={handleLoginClick}
      />
    </>
  );
} 