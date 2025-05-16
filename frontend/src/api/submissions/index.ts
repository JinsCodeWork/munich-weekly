/**
 * 投稿相关API模块
 * 提供投稿的增删改查和审核功能
 */
import { fetchAPI, getAuthHeader } from "../http";
import { 
  SubmissionRequest, 
  SubmissionListResponse, 
  MySubmissionResponse, 
  AdminSubmissionResponse,
  Submission
} from "@/types/submission";

/**
 * 获取用户自己的投稿
 * GET /api/submissions/mine
 */
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
 * 获取某期刊的所有投稿（仅限管理员）
 * GET /api/submissions/all?issueId={issueId}
 */
export const getAllSubmissionsByIssue = async (
  issueId: number
): Promise<AdminSubmissionResponse[]> => {
  return fetchAPI<AdminSubmissionResponse[]>(`/api/submissions/all?issueId=${issueId}`, {
    headers: getAuthHeader()
  });
};

/**
 * 创建新投稿
 * POST /api/submissions
 */
export const createSubmission = async (data: SubmissionRequest): Promise<MySubmissionResponse> => {
  return fetchAPI<MySubmissionResponse>("/api/submissions", {
    method: "POST",
    body: JSON.stringify(data),
    headers: getAuthHeader()
  });
};

/**
 * 批准投稿（仅限管理员）
 * PATCH /api/submissions/{id}/approve
 */
export const approveSubmission = async (submissionId: number): Promise<void> => {
  return fetchAPI<void>(`/api/submissions/${submissionId}/approve`, {
    method: "PATCH",
    headers: getAuthHeader()
  });
};

/**
 * 拒绝投稿（仅限管理员）
 * PATCH /api/submissions/{id}/reject
 */
export const rejectSubmission = async (submissionId: number): Promise<void> => {
  return fetchAPI<void>(`/api/submissions/${submissionId}/reject`, {
    method: "PATCH",
    headers: getAuthHeader()
  });
};

/**
 * 选择投稿作为特色（仅限管理员）
 * PATCH /api/submissions/{id}/select
 */
export const selectSubmission = async (submissionId: number): Promise<void> => {
  return fetchAPI<void>(`/api/submissions/${submissionId}/select`, {
    method: "PATCH",
    headers: getAuthHeader()
  });
}; 