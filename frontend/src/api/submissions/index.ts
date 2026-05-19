/**
 * Submission-related API module
 * Provides CRUD and review functionality for submissions
 */
import { fetchAPI, getAuthHeader } from "../http";
import { 
  SubmissionRequest, 
  AnonymousSubmissionRequest,
  AnonymousSubmissionResponse,
  MySubmissionResponse, 
  AdminSubmissionResponse,
  Submission,
  PaginatedResponse
} from "@/types/submission";

/**
 * Get user's own submissions
 * GET /api/submissions/mine
 * @param issueId Optional issue ID filter
 * @param page Page number (starting from 0)
 * @param size Items per page
 * @returns Paginated list of user submissions
 */
export const getUserSubmissions = async (
  issueId?: number,
  page: number = 0,
  size: number = 8  // Match frontend pageSize setting
): Promise<MySubmissionResponse[] | PaginatedResponse<MySubmissionResponse>> => {
  // Build query parameters
  const params = new URLSearchParams();
  if (issueId) {
    params.append('issueId', issueId.toString());
  }
  params.append('page', page.toString());
  params.append('size', size.toString());
  
  const url = `/api/submissions/mine?${params.toString()}`;

  const response = await fetchAPI<MySubmissionResponse[] | PaginatedResponse<MySubmissionResponse>>(url);
  
  // Backend may already support pagination, or may not yet support it
  // If an array is returned, we manually convert it to paginated format
  if (Array.isArray(response)) {
    // Manual pagination
    const startIndex = page * size;
    const endIndex = startIndex + size;
    const paginatedItems = response.slice(startIndex, endIndex);
    
    return {
      content: paginatedItems,
      pageable: {
        pageNumber: page,
        pageSize: size
      },
      totalElements: response.length,
      totalPages: Math.ceil(response.length / size)
    };
  }
  
  // Otherwise directly return backend's paginated response
  return response;
};

/**
 * 获取某期刊的所有已批准投稿
 * GET /api/submissions?issueId={issueId}
 * Backend returns a direct list, not a paginated object for this endpoint.
 */
export const getSubmissionsByIssue = async (
  issueId: number
): Promise<Submission[]> => {
  return fetchAPI<Submission[]>(
    `/api/submissions?issueId=${issueId}`
  );
};

/**
 * Get all submissions for an issue (admin only)
 * GET /api/submissions/all?issueId={issueId}
 */
export const getAllSubmissionsByIssue = async (
  issueId: number
): Promise<AdminSubmissionResponse[]> => {
  return fetchAPI<AdminSubmissionResponse[]>(`/api/submissions/all?issueId=${issueId}`);
};

/**
 * Create new submission
 * POST /api/submissions
 */
export const createSubmission = async (data: SubmissionRequest): Promise<{ submissionId: number, uploadUrl: string }> => {
  return fetchAPI<{ submissionId: number, uploadUrl: string }>("/api/submissions", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

/**
 * Create anonymous submission
 * POST /api/submissions/anonymous
 */
export const createAnonymousSubmission = async (
  data: AnonymousSubmissionRequest
): Promise<AnonymousSubmissionResponse> => {
  return fetchAPI<AnonymousSubmissionResponse>("/api/submissions/anonymous", {
    method: "POST",
    body: JSON.stringify(data)
  });
};

function pickAnonymousUploadErrorField(parsed: unknown): string | null {
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  for (const key of ["error", "message", "detail"] as const) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function buildAnonymousUploadHttpErrorMessage(
  status: number,
  statusText: string,
  responseText: string
): string {
  const base = `Upload failed: ${status} ${statusText}`;
  const t = responseText.trim();
  let fromJson: string | null = null;
  if (t) {
    try {
      fromJson = pickAnonymousUploadErrorField(JSON.parse(t) as unknown);
    } catch {
      /* not JSON */
    }
  }
  if (fromJson) return `${base} — ${fromJson}`;
  if (t) {
    const snippet = t.length > 300 ? `${t.slice(0, 300)}…` : t;
    return `${base} — ${snippet}`;
  }
  return base;
}

/**
 * Upload anonymous submission image with short-lived upload token.
 * POST /api/submissions/{id}/anonymous-upload
 */
export const uploadAnonymousSubmissionFile = async (
  uploadUrl: string,
  uploadToken: string,
  file: File
): Promise<{ success: true; imageUrl: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
    headers: {
      "X-Anonymous-Upload-Token": uploadToken
    },
    credentials: "include"
  });

  let responseText = "";
  try {
    responseText = await response.text();
  } catch {
    /* ignore */
  }

  if (!response.ok) {
    throw new Error(
      buildAnonymousUploadHttpErrorMessage(response.status, response.statusText, responseText)
    );
  }

  if (!responseText.trim()) {
    throw new Error(
      "Upload failed: server returned an empty response and success could not be confirmed"
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText) as unknown;
  } catch {
    throw new Error(
      "Upload failed: server returned a non-JSON response so success could not be confirmed"
    );
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Upload failed: invalid JSON response from server");
  }

  const body = parsed as Record<string, unknown>;
  if (body.success !== true) {
    throw new Error(
      pickAnonymousUploadErrorField(parsed) ||
        (typeof body.error === "string" && body.error.trim()) ||
        "Upload failed: server did not report success"
    );
  }

  const imageUrl = body.imageUrl;
  if (typeof imageUrl !== "string" || !imageUrl.trim()) {
    throw new Error("Upload failed: server response missing image URL");
  }

  return { success: true, imageUrl };
};

/**
 * Approve submission (admin only)
 * PATCH /api/submissions/{id}/approve
 */
export const approveSubmission = async (submissionId: number): Promise<void> => {
  return fetchAPI<void>(`/api/submissions/${submissionId}/approve`, {
    method: "PATCH",
  });
};

/**
 * 拒绝投稿（仅限管理员）
 * PATCH /api/submissions/{id}/reject
 */
export const rejectSubmission = async (submissionId: number): Promise<void> => {
  return fetchAPI<void>(`/api/submissions/${submissionId}/reject`, {
    method: "PATCH",
  });
};

/**
 * Select submission as featured (admin only)
 * PATCH /api/submissions/{id}/select
 */
export const selectSubmission = async (submissionId: number): Promise<void> => {
  return fetchAPI<void>(`/api/submissions/${submissionId}/select`, {
    method: "PATCH",
  });
};

/**
 * Delete submission
 * DELETE /api/submissions/{id}
 */
export const deleteSubmission = async (submissionId: number): Promise<void> => {
  return fetchAPI<void>(`/api/submissions/${submissionId}`, {
    method: "DELETE",
  });
};

/**
 * Download selected submissions for an issue as ZIP file (Admin only)
 * GET /api/submissions/download-selected/{issueId}
 */
export const downloadSelectedSubmissions = async (issueId: number): Promise<void> => {
  try {
    const response = await fetch(`/api/submissions/download-selected/${issueId}`, {
      method: "GET",
      headers: getAuthHeader()
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Issue not found");
      } else if (response.status === 204) {
        throw new Error("No selected submissions found for this issue");
      } else {
        throw new Error("Failed to download selected submissions");
      }
    }

    // Get filename from response headers
    const contentDisposition = response.headers.get('content-disposition');
    let filename = 'selected_submissions.zip';
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Download the file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
    
  } catch (error) {
    console.error("Download error:", error);
    throw error;
  }
}; 