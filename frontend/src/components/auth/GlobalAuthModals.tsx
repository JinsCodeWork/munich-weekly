'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

/**
 * Global authentication modals component
 * Handles all authentication modals consistently across the app
 */
export function GlobalAuthModals() {
  const { 
    isLoginOpen, 
    isRegisterOpen, 
    openLogin, 
    openRegister, 
    closeAuthModals 
  } = useAuth();

  return (
    <>
      {/* Login modal */}
      <LoginForm 
        isOpen={isLoginOpen} 
        onClose={closeAuthModals} 
        onRegisterClick={openRegister}
      />

      {/* Register modal */}
      <RegisterForm
        isOpen={isRegisterOpen}
        onClose={closeAuthModals}
        onLoginClick={openLogin}
      />
    </>
  );
} 