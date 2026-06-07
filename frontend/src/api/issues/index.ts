/**
 * Issue-related API module
 * Provides issue retrieval, creation, update and delete functionality
 */
import { fetchAPI, parseApiErrorMessage } from "../http";
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

function parseIssueDeleteError(responseText: string, response: Response): string {
  try {
    const errorData = JSON.parse(responseText) as Record<string, unknown>;
    if (typeof errorData.message === "string" && errorData.message) {
      return errorData.message;
    }
  } catch {
    // Fall back to the shared parser for non-JSON responses.
  }

  return parseApiErrorMessage(responseText, response);
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
  });
};

/**
 * Delete existing issue (admin only)
 * DELETE /api/issues/{id}
 */
export const deleteIssue = async (id: number): Promise<void> => {
  await fetchAPI<void>(`/api/issues/${id}`, {
    method: "DELETE",
    parseResponseJson: false,
    onHttpError: (response, responseText) => {
      throw new Error(parseIssueDeleteError(responseText, response));
    },
  });
};
