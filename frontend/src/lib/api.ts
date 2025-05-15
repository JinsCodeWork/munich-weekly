import { Issue, SubmissionListResponse, MySubmissionResponse, AdminSubmissionResponse } from "@/types/submission";

// Get authentication header
const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem("jwt");
  if (token) {
    console.log("Using auth token:", token.substring(0, 10) + "...");
    return {
      Authorization: `Bearer ${token}`
    };
  }
  console.warn("No JWT token found in localStorage");
  return {};
};

// Base API request function
const fetchAPI = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  // Ensure headers are properly merged
  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  try {
    console.log(`API Request: ${options.method || 'GET'} ${url}`, { headers });
    
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      // Try to get response text for better error diagnostics
      const responseText = await response.text();
      let errorData = {};
      
      try {
        // Try to parse as JSON if possible
        errorData = JSON.parse(responseText);
      } catch {
        // If not JSON, use the text as is
        errorData = { text: responseText };
      }
      
      console.error("API Error:", {
        status: response.status,
        statusText: response.statusText,
        url,
        headers: Object.fromEntries(response.headers.entries()),
        errorData,
        requestHeaders: headers
      });
      
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Request Failed for ${url}:`, error);
    throw error;
  }
};

// Get user's own submissions
export const getUserSubmissions = async (
  issueId?: number
): Promise<MySubmissionResponse[]> => {
  let url = `/api/submissions/mine`;
  if (issueId) {
    url += `?issueId=${issueId}`;
  }

  return fetchAPI<MySubmissionResponse[]>(url, {
    headers: getAuthHeader()
  });
};

// Get all issues
export const getIssues = async (): Promise<Issue[]> => {
  return fetchAPI<Issue[]>("/api/issues");
};

// Get single issue details
export const getIssue = async (id: number): Promise<Issue> => {
  return fetchAPI<Issue>(`/api/issues/${id}`);
};

// Get submissions for a specific issue
export const getSubmissionsByIssue = async (
  issueId: number,
  page: number = 0,
  size: number = 10
): Promise<SubmissionListResponse> => {
  return fetchAPI<SubmissionListResponse>(
    `/api/submissions?issueId=${issueId}&page=${page}&size=${size}`
  );
};

// Get all submissions for a specific issue (admin only)
export const getAllSubmissionsByIssue = async (
  issueId: number
): Promise<AdminSubmissionResponse[]> => {
  return fetchAPI<AdminSubmissionResponse[]>(`/api/submissions/all?issueId=${issueId}`, {
    headers: getAuthHeader()
  });
};

// Approve a submission (admin only)
export const approveSubmission = async (submissionId: number): Promise<void> => {
  return fetchAPI<void>(`/api/submissions/${submissionId}/approve`, {
    method: "PATCH",
    headers: getAuthHeader()
  });
};

// Reject a submission (admin only)
export const rejectSubmission = async (submissionId: number): Promise<void> => {
  return fetchAPI<void>(`/api/submissions/${submissionId}/reject`, {
    method: "PATCH",
    headers: getAuthHeader()
  });
};

// Select a submission as featured (admin only)
export const selectSubmission = async (submissionId: number): Promise<void> => {
  return fetchAPI<void>(`/api/submissions/${submissionId}/select`, {
    method: "PATCH",
    headers: getAuthHeader()
  });
};