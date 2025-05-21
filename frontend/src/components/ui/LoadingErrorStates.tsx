import React from "react";
import { 
  getLoadingSpinnerStyles, 
  getLoadingContainerStyles, 
  getErrorContainerStyles,
  loadingSpinnerVariants,
  loadingContainerVariants,
  errorContainerVariants
} from "@/styles/components/loadingError";
import { Button } from "./Button";

type LoadingStateProps = {
  variant?: keyof typeof loadingContainerVariants;
  className?: string;
  spinnerVariant?: keyof typeof loadingSpinnerVariants;
  spinnerClassName?: string;
  message?: string;
};

/**
 * Loading spinner component shown while data is being fetched
 */
export function LoadingState({ 
  variant = 'default',
  className,
  spinnerVariant = 'default',
  spinnerClassName,
  message = "Loading..."
}: LoadingStateProps) {
  return (
    <div className={getLoadingContainerStyles({ variant, className })}>
      <div className={getLoadingSpinnerStyles({ variant: spinnerVariant, className: spinnerClassName })}></div>
      {message && <p className="mt-4 text-gray-500">{message}</p>}
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  variant?: keyof typeof errorContainerVariants;
  className?: string;
  buttonText?: string;
}

/**
 * Error state component shown when data fetching fails
 */
export function ErrorState({ 
  message, 
  onRetry, 
  variant = 'default',
  className,
  buttonText = "Retry"
}: ErrorStateProps) {
  return (
    <div className={getErrorContainerStyles({ variant, className })}>
      <div className="text-red-500 mb-4">
        <svg className="w-12 h-12 mx-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
      <p className="text-red-600 mb-4">{message}</p>
      {onRetry && (
        <Button 
          onClick={onRetry} 
          variant="danger"
        >
          {buttonText}
        </Button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  hideIcon?: boolean;
}

/**
 * Empty state component shown when no data is available
 */
export function EmptyState({
  message,
  icon,
  action,
  className,
  hideIcon
}: EmptyStateProps) {
  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 text-center ${className || ''}`}>
      {!hideIcon && (
        <div className="text-gray-400 mb-4">
          {icon || (
            <svg className="w-12 h-12 mx-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <path d="M3 9h18"></path>
              <path d="M9 21V9"></path>
            </svg>
          )}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {message}
      </h3>
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}

interface LoadingErrorStatesProps {
  isLoading: boolean;
  loadingMessage?: string;
  error: string | null;
  onRetry?: () => void;
  emptyState?: boolean;
  emptyStateMessage?: string;
  emptyStateIcon?: React.ReactNode;
  emptyStateAction?: React.ReactNode;
  className?: string;
  hideEmptyStateIcon?: boolean;
}

/**
 * Combined component for handling loading, error, and empty states
 */
export function LoadingErrorStates({
  isLoading,
  loadingMessage,
  error,
  onRetry,
  emptyState,
  emptyStateMessage = "No data available",
  emptyStateIcon,
  emptyStateAction,
  className,
  hideEmptyStateIcon
}: LoadingErrorStatesProps) {
  if (isLoading) {
    return <LoadingState message={loadingMessage} className={className} />;
  }
  
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} className={className} />;
  }
  
  if (emptyState) {
    return (
      <EmptyState 
        message={emptyStateMessage} 
        icon={emptyStateIcon} 
        action={emptyStateAction}
        className={className}
        hideIcon={hideEmptyStateIcon}
      />
    );
  }
  
  return null;
} 