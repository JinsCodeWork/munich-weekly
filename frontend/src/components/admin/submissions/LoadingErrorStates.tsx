import React from "react";

type LoadingStateProps = Record<never, never>;

/**
 * Loading spinner component shown while data is being fetched
 */
export function LoadingState({}: LoadingStateProps) {
  return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  onUseMockData: () => void;
  showMockDataOption: boolean;
}

/**
 * Error state component shown when data fetching fails
 * Provides retry and fallback options
 */
export function ErrorState({ message, onRetry, onUseMockData, showMockDataOption }: ErrorStateProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center mb-6">
      <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
      <p className="text-red-600 mb-4">{message}</p>
      <div className="flex justify-center space-x-4">
        <button 
          onClick={onRetry} 
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
        >
          Retry
        </button>
        {showMockDataOption && (
          <button 
            onClick={onUseMockData} 
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Use Mock Data
          </button>
        )}
      </div>
    </div>
  );
} 