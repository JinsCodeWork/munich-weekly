/**
 * Issue-related API module
 * Provides issue retrieval, creation, update and other functionality
 */
import { fetchAPI, getAuthHeader } from "../http";
import { Issue } from "@/types/submission";

interface IssueCreateRequest {
  title: string;
  description: string;
  submissionStart: string;
  submissionEnd: string;
  votingStart: string;
  votingEnd: string;
}

interface IssueUpdateRequest {
  title: string;
  description: string;
  submissionStart: string;
  submissionEnd: string;
  votingStart: string;
  votingEnd: string;
}

/**
 * Get all issues
 * GET /api/issues
 */
export const getAllIssues = async (): Promise<Issue[]> => {
  return fetchAPI<Issue[]>("/api/issues");
};

/**
 * Get single issue details
 * GET /api/issues/{id}
 */
export const getIssueById = async (id: number): Promise<Issue> => {
  return fetchAPI<Issue>(`/api/issues/${id}`);
};

/**
 * Create new issue (admin only)
 * POST /api/issues
 */
export const createIssue = async (data: IssueCreateRequest): Promise<Issue> => {
  return fetchAPI<Issue>("/api/issues", {
    method: "POST",
    body: JSON.stringify(data),
    headers: getAuthHeader()
  });
};

/**
 * Update existing issue (admin only)
 * PUT /api/issues/{id}
 */
export const updateIssue = async (id: number, data: IssueUpdateRequest): Promise<Issue> => {
  return fetchAPI<Issue>(`/api/issues/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: getAuthHeader()
  });
}; 