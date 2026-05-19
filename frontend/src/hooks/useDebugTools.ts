import { useState } from "react";
import { getAllIssues } from "@/api/issues";
import { getAllSubmissionsByIssue } from "@/api/submissions";

interface DebugInfo {
  userLoggedIn: boolean;
  userRole: string;
  tokenInContext: boolean;
  tokenInStorage: boolean;
  tokenPreview: string;
}

/**
 * Custom hook for managing debug tools functionality
 * Handles debug info, API testing, and mock data toggling
 */
export function useDebugTools(token: string | null, selectedIssue: number | null) {
  // Debug states
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false); // Default to using real data
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    userLoggedIn: false,
    userRole: 'none',
    tokenInContext: false,
    tokenInStorage: false,
    tokenPreview: 'none'
  });

  /**
   * Check authentication status for debugging
   */
  const checkAuthStatus = () => {
    const storedToken = localStorage.getItem("jwt");
    const authInfo: DebugInfo = {
      userLoggedIn: !!token,
      userRole: 'admin', // Assuming admin role for this page
      tokenInContext: !!token,
      tokenInStorage: !!storedToken,
      tokenPreview: storedToken ? `${storedToken.substring(0, 15)}...` : 'none'
    };
    setDebugInfo(authInfo);
    setShowDebugInfo(true);
  };

  /**
   * Test API connection for debugging
   */
  const testApiConnection = async () => {
    try {
      setApiTestResult("Testing API connection...");

      const issues = await getAllIssues();
      setApiTestResult(`API test successful! Received ${issues.length} issues.`);

      if (selectedIssue) {
        try {
          const submissions = await getAllSubmissionsByIssue(selectedIssue);
          setApiTestResult(
            (prev) =>
              `${prev}\n\nSubmissions API test successful! Received ${submissions.length} submissions.`,
          );
          console.log("Raw submissions data:", submissions);
        } catch (err) {
          setApiTestResult(
            (prev) =>
              `${prev}\n\nSubmissions API test error: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    } catch (err) {
      setApiTestResult(`API test error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  /**
   * Toggle between mock and real data
   */
  const toggleMockData = () => {
    setUseMockData(prev => !prev);
  };

  return {
    showDebugInfo,
    setShowDebugInfo,
    apiTestResult,
    setApiTestResult,
    useMockData,
    debugInfo,
    checkAuthStatus,
    testApiConnection,
    toggleMockData
  };
} 