'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface RegisterFormProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick?: () => void;
}

/**
 * Registration form component - Glassmorphism effect
 */
export function RegisterForm({ isOpen, onClose, onLoginClick }: RegisterFormProps) {
  const router = useRouter();
  const { login, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Monitor login status and close modal on successful registration
  useEffect(() => {
    if (user && success) {
      // Set a short delay to allow user to see success message
      const timer = setTimeout(() => {
        onClose();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [user, success, onClose]);

  // Reset state each time modal is opened
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setNickname('');
      setError('');
      setSuccess(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate form
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nickname }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Registration failed');
      }

      const { token } = await res.json();
      login(token); // Log in the user
      setSuccess(true); // Set success state
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form
        onSubmit={handleSubmit}
        className={cn(
          'backdrop-blur-none border-none rounded-lg',
          'p-8 w-[90vw] max-w-md',
          'flex flex-col items-center'
        )}
      >
        <h1 className="text-4xl font-bold text-white mb-10 tracking-wider animate-fadeIn opacity-0" style={{ animationDelay: '0.1s' }}>
          Register
        </h1>

        {/* Email input */}
        <div className="relative w-full mb-6 animate-fadeIn opacity-0" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center border border-white rounded-full px-6 py-4 shadow-md shadow-white/20">
            <input
              type="email"
              placeholder="Email address"
              required
              className="bg-transparent text-white text-lg w-full placeholder:text-white/80 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting || success}
            />
            <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
          </div>
        </div>

        {/* Nickname input */}
        <div className="relative w-full mb-6 animate-fadeIn opacity-0" style={{ animationDelay: '0.25s' }}>
          <div className="flex items-center border border-white rounded-full px-6 py-4 shadow-md shadow-white/20">
            <input
              type="text"
              placeholder="Nickname"
              required
              maxLength={20}
              className="bg-transparent text-white text-lg w-full placeholder:text-white/80 focus:outline-none"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={isSubmitting || success}
            />
            <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        </div>

        {/* Password input */}
        <div className="relative w-full mb-6 animate-fadeIn opacity-0" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center border border-white rounded-full px-6 py-4 shadow-md shadow-white/20">
            <input
              type="password"
              placeholder="Password"
              required
              minLength={6}
              className="bg-transparent text-white text-lg w-full placeholder:text-white/80 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting || success}
            />
            <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
        </div>

        {/* Confirm password input */}
        <div className="relative w-full mb-8 animate-fadeIn opacity-0" style={{ animationDelay: '0.35s' }}>
          <div className="flex items-center border border-white rounded-full px-6 py-4 shadow-md shadow-white/20">
            <input
              type="password"
              placeholder="Confirm password"
              required
              className="bg-transparent text-white text-lg w-full placeholder:text-white/80 focus:outline-none"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting || success}
            />
            <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-red-300 text-sm mb-4 animate-fadeIn opacity-0" style={{ animationDelay: '0.4s' }}>
            {error}
          </p>
        )}

        {/* Success message */}
        {success && (
          <div className="bg-green-500/20 text-green-200 px-4 py-3 rounded-md w-full mb-4 flex items-center justify-center animate-fadeIn opacity-0" style={{ animationDelay: '0s' }}>
            <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            Registration successful! Redirecting...
          </div>
        )}

        {/* Register button */}
        <button
          type="submit"
          disabled={isSubmitting || success}
          className={cn(
            'w-full py-4 rounded-full text-lg font-semibold tracking-wide mb-6 transition-colors',
            'animate-fadeIn opacity-0',
            success 
              ? 'bg-green-500 text-white cursor-not-allowed' 
              : isSubmitting 
                ? 'bg-white/70 text-gray-700 cursor-not-allowed' 
                : 'bg-white text-gray-900 hover:bg-gray-200'
          )}
          style={{ animationDelay: '0.45s' }}
        >
          {isSubmitting ? 'Registering...' : success ? 'Success' : 'Register'}
        </button>

        {/* Return to login link */}
        <p className="text-white text-lg mt-4 animate-fadeIn opacity-0" style={{ animationDelay: '0.5s' }}>
          Already have an account?{' '}
          <button
            type="button"
            className="font-medium hover:underline cursor-pointer"
            onClick={onLoginClick}
            disabled={isSubmitting || success}
          >
            Login
          </button>
        </p>
      </form>
    </Modal>
  );
} 