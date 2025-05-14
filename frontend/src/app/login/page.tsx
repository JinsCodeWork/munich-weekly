'use client';

import { useState } from 'react';
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const router = useRouter();

  const handleCloseLogin = () => {
    setIsLoginOpen(false);
    if (!isRegisterOpen) {
      router.push('/');
    }
  };

  const handleCloseRegister = () => {
    setIsRegisterOpen(false);
    if (!isLoginOpen) {
      router.push('/');
    }
  };

  const handleRegisterClick = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  const handleLoginClick = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <LoginForm 
        isOpen={isLoginOpen} 
        onClose={handleCloseLogin} 
        onRegisterClick={handleRegisterClick}
      />
      <RegisterForm 
        isOpen={isRegisterOpen} 
        onClose={handleCloseRegister}
        onLoginClick={handleLoginClick}
      />
    </div>
  );
}