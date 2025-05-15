/**
 * 投票相关API模块
 * 提供投票功能和投票状态检查
 */
import { fetchAPI } from "../http";

/**
 * 提交投票
 * POST /api/votes
 */
export const submitVote = async (submissionId: number, visitorId?: string): Promise<void> => {
  const url = new URL("/api/votes", window.location.origin);
  if (visitorId) {
    url.searchParams.append("visitorId", visitorId);
  }
  
  return fetchAPI<void>(url.toString(), {
    method: "POST",
    body: JSON.stringify({ submissionId })
  });
};

/**
 * 检查当前访问者是否已为某投稿投票
 * GET /api/votes/check?submissionId={submissionId}&visitorId={visitorId}
 */
export const checkVoteStatus = async (submissionId: number, visitorId?: string): Promise<boolean> => {
  const url = new URL("/api/votes/check", window.location.origin);
  url.searchParams.append("submissionId", submissionId.toString());
  if (visitorId) {
    url.searchParams.append("visitorId", visitorId);
  }
  
  return fetchAPI<boolean>(url.toString());
}; 