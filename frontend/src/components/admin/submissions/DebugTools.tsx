import React from "react";

interface DebugInfo {
  userLoggedIn: boolean;
  userRole: string;
  tokenInContext: boolean;
  tokenInStorage: boolean;
  tokenPreview: string;
}

interface DebugToolsProps {
  showDebugInfo: boolean;
  debugInfo: DebugInfo;
  apiTestResult: string | null;
  selectedIssue: number | null;
  token: string | null;
  onCheckAuthStatus: () => void;
  onTestApiConnection: () => void;
  onToggleMockData: () => void;
  useMockData: boolean;
  onCloseDebugInfo: () => void;
  onCloseApiTestResult: () => void;
}

/**
 * Debug tools component for development and testing
 * Provides functionality for checking auth status, testing API connections,
 * and toggling between mock and real data
 */
export function DebugTools({
  showDebugInfo,
  debugInfo,
  apiTestResult,
  onCheckAuthStatus,
  onTestApiConnection,
  onToggleMockData,
  useMockData,
  onCloseDebugInfo,
  onCloseApiTestResult
}: DebugToolsProps) {
  return (
    <div>
      {/* Debug buttons */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex space-x-2">
          <button 
            onClick={onCheckAuthStatus}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Debug Auth
          </button>
          <button 
            onClick={onTestApiConnection}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Test API
          </button>
        </div>

        {/* Mock data toggle (for development) */}
        <div className="flex items-center">
          <label className="inline-flex items-center cursor-pointer">
            <span className="mr-2 text-sm text-gray-700">Use Mock Data:</span>
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={useMockData}
                onChange={onToggleMockData}
              />
              <div className={`block w-10 h-6 rounded-full ${useMockData ? 'bg-blue-400' : 'bg-gray-300'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${useMockData ? 'transform translate-x-4' : ''}`}></div>
            </div>
          </label>
        </div>
      </div>
      
      {/* Debug info */}
      {showDebugInfo && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg border border-gray-300 text-xs font-mono">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Auth Debug Info</h3>
            <button 
              onClick={onCloseDebugInfo}
              className="text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      {/* API test result */}
      {apiTestResult && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg border border-gray-300 text-xs font-mono">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">API Test Result</h3>
            <button 
              onClick={onCloseApiTestResult}
              className="text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
          <pre className="whitespace-pre-wrap">
            {apiTestResult}
          </pre>
        </div>
      )}
    </div>
  );
} 