'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * 模态框组件 - 实现磨砂玻璃效果
 */
export function Modal({ isOpen, onClose, children, className }: ModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  // 处理ESC键关闭
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // 防止背景滚动
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // 处理关闭动画
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  // 处理背景点击关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (backdropRef.current === e.target) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm transition-opacity',
        isClosing ? 'opacity-0' : 'opacity-100',
      )}
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          'transition-transform duration-300',
          isClosing ? 'translate-y-8 opacity-0' : 'translate-y-0 opacity-100',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
} 