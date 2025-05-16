import React from "react";
import { 
  getLoadingSpinnerStyles, 
  getLoadingContainerStyles, 
  getErrorContainerStyles,
  getErrorButtonStyles,
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
        <i className="fa-solid fa-circle-exclamation text-4xl"></i>
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
  icon?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Empty state component shown when no data is available
 */
export function EmptyState({
  message,
  icon = "fa-solid fa-inbox",
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 text-center ${className || ''}`}>
      <div className="text-gray-400 mb-4">
        <i className={`${icon} text-4xl`}></i>
      </div>
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
  emptyStateIcon?: string;
  emptyStateAction?: React.ReactNode;
  className?: string;
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
  className
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
      />
    );
  }
  
  return null;
} 