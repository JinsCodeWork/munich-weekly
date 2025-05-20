import React, { useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  /** 是否显示第一页和最后一页的跳转按钮 */
  showFirstLastButtons?: boolean;
  /** 是否显示页码选择器 */
  showPageSelector?: boolean;
  /** 设置页码数字按钮的显示数量 */
  maxVisiblePages?: number;
  /** 设置分页组件大小 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否在移动设备上简化显示 */
  simplifyOnMobile?: boolean;
  /** 自定义按钮样式 */
  buttonClassName?: string;
  /** 自定义激活按钮样式 */
  activeButtonClassName?: string;
  /** 自定义禁用按钮样式 */
  disabledButtonClassName?: string;
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  className,
  showFirstLastButtons = false,
  showPageSelector = false,
  maxVisiblePages = 5,
  size = 'md',
  simplifyOnMobile = true,
  buttonClassName,
  activeButtonClassName,
  disabledButtonClassName
}: PaginationProps) {
  // 计算要显示的页码范围
  const getPageNumbers = useCallback(() => {
    const pageNumbers = [];
    
    // 显示最多 maxVisiblePages 个页码
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // 调整起始页，确保我们始终显示 maxVisiblePages 个页码（如果总页数足够）
    if (endPage - startPage < maxVisiblePages - 1 && totalPages > maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  }, [currentPage, totalPages, maxVisiblePages]);

  // 根据尺寸获取按钮样式
  const getButtonSizeClass = () => {
    switch (size) {
      case 'sm': return "w-8 h-8 text-xs";
      case 'lg': return "w-12 h-12 text-base";
      case 'md':
      default: return "w-10 h-10 text-sm";
    }
  };

  // 如果只有一页，则不显示分页
  if (totalPages <= 1) return null;

  // 基础按钮样式
  const baseButtonClass = cn(
    "flex items-center justify-center rounded-md transition-colors",
    getButtonSizeClass(),
    buttonClassName
  );

  // 激活按钮样式
  const activeButtonClass = cn(
    baseButtonClass,
    "bg-blue-500 text-white",
    activeButtonClassName
  );

  // 正常按钮样式
  const normalButtonClass = cn(
    baseButtonClass,
    "text-gray-700 hover:bg-gray-100",
    buttonClassName
  );

  // 禁用按钮样式
  const disabledButtonClass = cn(
    baseButtonClass,
    "text-gray-400 cursor-not-allowed",
    disabledButtonClassName
  );

  return (
    <nav 
      className={cn("flex items-center justify-center my-8", className)}
      aria-label="Pagination"
    >
      <ul className="flex items-center space-x-1 flex-wrap justify-center">
        {/* 第一页按钮 */}
        {showFirstLastButtons && (
          <li className={cn(simplifyOnMobile && "hidden sm:block")}>
            <button
              onClick={() => currentPage > 1 && onPageChange(1)}
              disabled={currentPage === 1}
              className={currentPage === 1 ? disabledButtonClass : normalButtonClass}
              aria-label="Go to first page"
              tabIndex={currentPage === 1 ? -1 : 0}
            >
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="11 17 6 12 11 7"></polyline>
                <polyline points="18 17 13 12 18 7"></polyline>
              </svg>
            </button>
          </li>
        )}
        
        {/* 上一页按钮 */}
        <li>
          <button
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={currentPage === 1 ? disabledButtonClass : normalButtonClass}
            aria-label="Previous page"
            tabIndex={currentPage === 1 ? -1 : 0}
          >
            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        </li>
        
        {/* 第一页（如果当前页码范围不包括第一页） */}
        {!simplifyOnMobile && getPageNumbers()[0] > 1 && (
          <>
            <li className={cn(simplifyOnMobile && "hidden sm:block")}>
              <button
                onClick={() => onPageChange(1)}
                className={normalButtonClass}
                aria-label={`Go to page 1`}
              >
                1
              </button>
            </li>
            {getPageNumbers()[0] > 2 && (
              <li className={cn("flex items-center justify-center", getButtonSizeClass(), simplifyOnMobile && "hidden sm:flex")}>
                <span className="text-gray-500">...</span>
              </li>
            )}
          </>
        )}
        
        {/* 页码按钮 */}
        {getPageNumbers().map(number => (
          <li key={number} className={cn(
            simplifyOnMobile && number !== currentPage && "hidden sm:block"
          )}>
            <button
              onClick={() => onPageChange(number)}
              className={currentPage === number ? activeButtonClass : normalButtonClass}
              aria-label={`Page ${number}`}
              aria-current={currentPage === number ? "page" : undefined}
            >
              {number}
            </button>
          </li>
        ))}
        
        {/* 最后一页（如果当前页码范围不包括最后一页） */}
        {!simplifyOnMobile && getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
          <>
            {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
              <li className={cn("flex items-center justify-center", getButtonSizeClass(), simplifyOnMobile && "hidden sm:flex")}>
                <span className="text-gray-500">...</span>
              </li>
            )}
            <li className={cn(simplifyOnMobile && "hidden sm:block")}>
              <button
                onClick={() => onPageChange(totalPages)}
                className={normalButtonClass}
                aria-label={`Go to page ${totalPages}`}
              >
                {totalPages}
              </button>
            </li>
          </>
        )}
        
        {/* 下一页按钮 */}
        <li>
          <button
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={currentPage === totalPages ? disabledButtonClass : normalButtonClass}
            aria-label="Next page"
            tabIndex={currentPage === totalPages ? -1 : 0}
          >
            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </li>
        
        {/* 最后一页按钮 */}
        {showFirstLastButtons && (
          <li className={cn(simplifyOnMobile && "hidden sm:block")}>
            <button
              onClick={() => currentPage < totalPages && onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className={currentPage === totalPages ? disabledButtonClass : normalButtonClass}
              aria-label="Go to last page"
              tabIndex={currentPage === totalPages ? -1 : 0}
            >
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="13 17 18 12 13 7"></polyline>
                <polyline points="6 17 11 12 6 7"></polyline>
              </svg>
            </button>
          </li>
        )}
        
        {/* 页码选择器 */}
        {showPageSelector && totalPages > maxVisiblePages && (
          <li className="ml-4 hidden sm:block">
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-2">转到</span>
              <select
                className="border border-gray-300 rounded-md text-sm py-1 px-2"
                value={currentPage}
                onChange={(e) => onPageChange(Number(e.target.value))}
                aria-label="Select page"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <option key={page} value={page}>
                    {page}
                  </option>
                ))}
              </select>
            </div>
          </li>
        )}
      </ul>
    </nav>
  );
} 