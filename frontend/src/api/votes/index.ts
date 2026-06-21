/**
 * Voting-related API module
 * Provides voting functionality and vote status checking
 */
import { fetchAPI, getCsrfHeader } from "../http";

interface VoteResponse {
  vote: { id: number; submissionId: number };
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
 * Backend manages anonymous identity through the signed HttpOnly cookie.
 * Returns the vote object and current vote count.
 */
export const submitVote = async (submissionId: number): Promise<VoteResponse> => {
  const url = new URL("/api/votes", window.location.origin);
  url.searchParams.append("submissionId", submissionId.toString());
  const csrfHeader = await getCsrfHeader();
  
  return fetchAPI<VoteResponse>(url.toString(), {
    method: "POST",
    credentials: "include",
    headers: csrfHeader,
  });
};

/**
 * 检查当前访问者是否已为某投稿投票
 * GET /api/votes/check?submissionId={submissionId}
 * Backend manages anonymous identity through the signed HttpOnly cookie.
 */
export const checkVoteStatus = async (submissionId: number): Promise<{ voted: boolean }> => {
  const url = new URL("/api/votes/check", window.location.origin);
  url.searchParams.append("submissionId", submissionId.toString());
  
  return fetchAPI<{ voted: boolean }>(url.toString(), {
    method: "GET",
    credentials: "include",
  });
};

/**
 * Batch check vote status for multiple submissions
 * GET /api/votes/check-batch?submissionIds={id1,id2,id3}
 * Backend manages anonymous identity through the signed HttpOnly cookie.
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
  
  return fetchAPI<BatchVoteStatusResponse>(url.toString(), {
    method: "GET",
    credentials: "include",
  });
};

/**
 * 取消投票
 * DELETE /api/votes?submissionId={submissionId}
 * Backend manages anonymous identity through the signed HttpOnly cookie.
 * Returns success status and updated vote count.
 */
export const cancelVote = async (submissionId: number): Promise<CancelVoteResponse> => {
  const url = new URL("/api/votes", window.location.origin);
  url.searchParams.append("submissionId", submissionId.toString());
  const csrfHeader = await getCsrfHeader();
  
  return fetchAPI<CancelVoteResponse>(url.toString(), {
    method: "DELETE",
    credentials: "include",
    headers: csrfHeader,
  });
};
