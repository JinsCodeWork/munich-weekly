import { useState } from "react";

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
  const [useMockData, setUseMockData] = useState(true); // Default to using mock data
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
      
      // Test direct API call
      const response = await fetch("/api/issues", {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        }
      });
      
      if (!response.ok) {
        const text = await response.text();
        setApiTestResult(`API test failed: ${response.status} ${response.statusText}\n${text}`);
        return;
      }
      
      const data = await response.json();
      setApiTestResult(`API test successful! Received ${data.length} issues.`);
      
      // Test submissions API if an issue is selected
      if (selectedIssue) {
        try {
          const submissionsResponse = await fetch(`/api/submissions/all?issueId=${selectedIssue}`, {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            }
          });
          
          if (!submissionsResponse.ok) {
            setApiTestResult(prev => `${prev}\n\nSubmissions API test failed: ${submissionsResponse.status} ${submissionsResponse.statusText}`);
            return;
          }
          
          const submissionsData = await submissionsResponse.json();
          setApiTestResult(prev => `${prev}\n\nSubmissions API test successful! Received ${submissionsData.length} submissions.`);
          console.log("Raw submissions data:", submissionsData);
        } catch (err) {
          setApiTestResult(prev => `${prev}\n\nSubmissions API test error: ${err instanceof Error ? err.message : String(err)}`);
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