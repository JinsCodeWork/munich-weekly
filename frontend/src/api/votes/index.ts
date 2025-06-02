/**
 * 投票相关API模块
 * 提供投票功能和投票状态检查
 */
import { fetchAPI } from "../http";
import { getOrGenerateVisitorId } from "@/lib/visitorId";

interface VoteResponse {
  vote: { id: number; submissionId: number; visitorId: string };
  voteCount: number;
}

interface CancelVoteResponse {
  success: boolean;
  voteCount: number;
}

interface BatchVoteStatusResponse {
  statuses: Record<number, boolean>; // submissionId -> voted status
  totalChecked: number;
}

/**
 * 提交投票
 * POST /api/votes?submissionId={submissionId}
 * Backend reads visitorId from cookie.
 * Returns the vote object and current vote count.
 */
export const submitVote = async (submissionId: number): Promise<VoteResponse> => {
  const url = new URL("/api/votes", window.location.origin);
  url.searchParams.append("submissionId", submissionId.toString());
  
  // 确保已设置visitorId cookie
  getOrGenerateVisitorId();
  
  return fetchAPI<VoteResponse>(url.toString(), {
    method: "POST",
  });
};

/**
 * 检查当前访问者是否已为某投稿投票
 * GET /api/votes/check?submissionId={submissionId}
 * Backend reads visitorId from cookie.
 */
export const checkVoteStatus = async (submissionId: number): Promise<{ voted: boolean }> => {
  const url = new URL("/api/votes/check", window.location.origin);
  url.searchParams.append("submissionId", submissionId.toString());
  
  // 确保已设置visitorId cookie
  getOrGenerateVisitorId();
  
  return fetchAPI<{ voted: boolean }>(url.toString(), { method: "GET" });
};

/**
 * Batch check vote status for multiple submissions
 * GET /api/votes/check-batch?submissionIds={id1,id2,id3}
 * Backend reads visitorId from cookie.
 * 
 * This is a performance optimization to reduce API calls when checking
 * vote status for multiple submissions simultaneously (e.g., on vote page load).
 * 
 * @param submissionIds Array of submission IDs to check
 * @returns Object mapping submission IDs to their voted status
 */
export const checkBatchVoteStatus = async (submissionIds: number[]): Promise<BatchVoteStatusResponse> => {
  if (submissionIds.length === 0) {
    return { statuses: {}, totalChecked: 0 };
  }
  
  const url = new URL("/api/votes/check-batch", window.location.origin);
  url.searchParams.append("submissionIds", submissionIds.join(","));
  
  // 确保已设置visitorId cookie
  getOrGenerateVisitorId();
  
  return fetchAPI<BatchVoteStatusResponse>(url.toString(), { method: "GET" });
};

/**
 * 取消投票
 * DELETE /api/votes?submissionId={submissionId}
 * Backend reads visitorId from cookie.
 * Returns success status and updated vote count.
 */
export const cancelVote = async (submissionId: number): Promise<CancelVoteResponse> => {
  const url = new URL("/api/votes", window.location.origin);
  url.searchParams.append("submissionId", submissionId.toString());
  
  // 确保已设置visitorId cookie
  const visitorId = getOrGenerateVisitorId();
  console.log("Cancelling vote with visitorId:", visitorId);
  
  return fetchAPI<CancelVoteResponse>(url.toString(), {
    method: "DELETE",
    credentials: 'include', // 确保包含cookie
  });
}; 