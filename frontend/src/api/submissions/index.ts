/**
 * 投稿相关API模块
 * 提供投稿的增删改查和审核功能
 */
import { fetchAPI, getAuthHeader } from "../http";
import { 
  SubmissionRequest, 
  MySubmissionResponse, 
  AdminSubmissionResponse,
  Submission,
  PaginatedResponse
} from "@/types/submission";

/**
 * 获取用户自己的投稿
 * GET /api/submissions/mine
 * @param issueId 可选的期刊ID过滤
 * @param page 页码 (从0开始)
 * @param size 每页数量
 * @returns 分页的用户投稿列表
 */
export const getUserSubmissions = async (
  issueId?: number,
  page: number = 0,
  size: number = 8
): Promise<MySubmissionResponse[] | PaginatedResponse<MySubmissionResponse>> => {
  // 构建查询参数
  const params = new URLSearchParams();
  if (issueId) {
    params.append('issueId', issueId.toString());
  }
  params.append('page', page.toString());
  params.append('size', size.toString());
  
  const url = `/api/submissions/mine?${params.toString()}`;

  // 请求API
  const response = await fetchAPI<MySubmissionResponse[] | PaginatedResponse<MySubmissionResponse>>(url, {
    headers: getAuthHeader()
  });
  
  // 后端可能已经支持分页，也可能还未支持
  // 如果返回的是数组，我们手动将其转换为分页格式
  if (Array.isArray(response)) {
    // 手动分页
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
  
  // 否则直接返回后端的分页响应
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
export const createSubmission = async (data: SubmissionRequest): Promise<{ submissionId: number, uploadUrl: string }> => {
  return fetchAPI<{ submissionId: number, uploadUrl: string }>("/api/submissions", {
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

/**
 * 删除投稿
 * DELETE /api/submissions/{id}
 */
export const deleteSubmission = async (submissionId: number): Promise<void> => {
  return fetchAPI<void>(`/api/submissions/${submissionId}`, {
    method: "DELETE",
    headers: getAuthHeader()
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