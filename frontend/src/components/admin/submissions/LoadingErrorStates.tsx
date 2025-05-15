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

type LoadingStateProps = {
  variant?: keyof typeof loadingContainerVariants;
  className?: string;
  spinnerVariant?: keyof typeof loadingSpinnerVariants;
  spinnerClassName?: string;
};

/**
 * Loading spinner component shown while data is being fetched
 */
export function LoadingState({ 
  variant = 'default',
  className,
  spinnerVariant = 'default',
  spinnerClassName
}: LoadingStateProps) {
  return (
    <div className={getLoadingContainerStyles({ variant, className })}>
      <div className={getLoadingSpinnerStyles({ variant: spinnerVariant, className: spinnerClassName })}></div>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  onUseMockData: () => void;
  showMockDataOption: boolean;
  variant?: keyof typeof errorContainerVariants;
  className?: string;
}

/**
 * Error state component shown when data fetching fails
 * Provides retry and fallback options
 */
export function ErrorState({ 
  message, 
  onRetry, 
  onUseMockData, 
  showMockDataOption,
  variant = 'default',
  className
}: ErrorStateProps) {
  return (
    <div className={getErrorContainerStyles({ variant, className })}>
      <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
      <p className="text-red-600 mb-4">{message}</p>
      <div className="flex justify-center space-x-4">
        <button 
          onClick={onRetry} 
          className={getErrorButtonStyles({ variant: 'primary' })}
        >
          Retry
        </button>
        {showMockDataOption && (
          <button 
            onClick={onUseMockData} 
            className={getErrorButtonStyles({ variant: 'secondary' })}
          >
            Use Mock Data
          </button>
        )}
      </div>
    </div>
  );
} 