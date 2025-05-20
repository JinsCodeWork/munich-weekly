'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { getModalOverlayStyles, getModalContentStyles } from '@/styles/components/modal';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  overlayVariant?: 'default' | 'dark' | 'light';
  contentVariant?: 'default' | 'glassmorphism' | 'dark-glass' | 'dark';
}

/**
 * Modal component - Implements a frosted glass effect
 */
export function Modal({ 
  isOpen, 
  onClose, 
  children, 
  className,
  overlayVariant = 'default',
  contentVariant = 'dark-glass'
}: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  // Handle closing without animation
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, handleClose]);

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (backdropRef.current === e.target) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className={getModalOverlayStyles({
        variant: overlayVariant,
        isClosing: false,
      })}
      onClick={handleBackdropClick}
    >
      <div
        className={getModalContentStyles({
          variant: contentVariant,
          className
        })}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
} 