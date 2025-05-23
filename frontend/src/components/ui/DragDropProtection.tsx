'use client';

import React, { useEffect } from 'react';

interface DragDropProtectionProps {
  children: React.ReactNode;
}

/**
 * DragDropProtection Component
 * 
 * 全局防护组件，阻止在非指定区域拖拽文件时浏览器的默认行为
 * 防止在页面其他区域拖拽图片时浏览器直接打开图片
 */
export function DragDropProtection({ children }: DragDropProtectionProps) {
  useEffect(() => {
    // 防止页面级别的默认拖拽行为
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
    };

    // 防止拖拽文件进入页面时的默认行为
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
    };

    // 添加全局事件监听器
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);

    // 清理函数
    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
    };
  }, []);

  return <>{children}</>;
} 