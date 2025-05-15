import React from 'react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  className 
}: PaginationProps) {
  // Calculate the range of page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    // Display at most 5 page numbers
    let startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    // Adjust the start page to ensure we always display 5 page numbers (if total pages is enough)
    if (endPage - startPage < 4 && totalPages > 5) {
      startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  if (totalPages <= 1) return null;

  return (
    <nav className={cn("flex items-center justify-center my-8", className)}>
      <ul className="flex items-center space-x-1">
        {/* Previous page button */}
        <li>
          <button
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-md",
              currentPage === 1 
                ? "text-gray-400 cursor-not-allowed" 
                : "text-gray-700 hover:bg-gray-100"
            )}
            aria-label="Previous page"
          >
            <i className="fa-solid fa-chevron-left text-sm"></i>
          </button>
        </li>
        
        {/* First page (if current page range doesn't include the first page) */}
        {getPageNumbers()[0] > 1 && (
          <>
            <li>
              <button
                onClick={() => onPageChange(1)}
                className="flex items-center justify-center w-10 h-10 rounded-md text-gray-700 hover:bg-gray-100"
              >
                1
              </button>
            </li>
            {getPageNumbers()[0] > 2 && (
              <li className="flex items-center justify-center w-10 h-10">
                <span className="text-gray-500">...</span>
              </li>
            )}
          </>
        )}
        
        {/* Page numbers */}
        {getPageNumbers().map(number => (
          <li key={number}>
            <button
              onClick={() => onPageChange(number)}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-md",
                currentPage === number
                  ? "bg-blue-500 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              {number}
            </button>
          </li>
        ))}
        
        {/* Last page (if current page range doesn't include the last page) */}
        {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
          <>
            {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
              <li className="flex items-center justify-center w-10 h-10">
                <span className="text-gray-500">...</span>
              </li>
            )}
            <li>
              <button
                onClick={() => onPageChange(totalPages)}
                className="flex items-center justify-center w-10 h-10 rounded-md text-gray-700 hover:bg-gray-100"
              >
                {totalPages}
              </button>
            </li>
          </>
        )}
        
        {/* Next page button */}
        <li>
          <button
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-md",
              currentPage === totalPages 
                ? "text-gray-400 cursor-not-allowed" 
                : "text-gray-700 hover:bg-gray-100"
            )}
            aria-label="Next page"
          >
            <i className="fa-solid fa-chevron-right text-sm"></i>
          </button>
        </li>
      </ul>
    </nav>
  );
} 