/**
 * 投票相关API模块
 * 提供投票功能和投票状态检查
 */
import { fetchAPI } from "../http";

/**
 * 提交投票
 * POST /api/votes?submissionId={submissionId}
 * Backend reads visitorId from cookie.
 */
export const submitVote = async (submissionId: number): Promise<void> => {
  const url = new URL("/api/votes", window.location.origin);
  url.searchParams.append("submissionId", submissionId.toString());
  
  return fetchAPI<void>(url.toString(), {
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
  
  return fetchAPI<{ voted: boolean }>(url.toString(), { method: "GET" });
}; 