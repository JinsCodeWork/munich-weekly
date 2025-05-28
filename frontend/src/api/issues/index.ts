/**
 * 期刊相关API模块
 * 提供期刊获取、创建、更新等功能
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
 * 获取所有期刊
 * GET /api/issues
 */
export const getAllIssues = async (): Promise<Issue[]> => {
  return fetchAPI<Issue[]>("/api/issues");
};

/**
 * 获取单个期刊详情
 * GET /api/issues/{id}
 */
export const getIssueById = async (id: number): Promise<Issue> => {
  return fetchAPI<Issue>(`/api/issues/${id}`);
};

/**
 * 创建新期刊（仅限管理员）
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
 * 更新现有期刊（仅限管理员）
 * PUT /api/issues/{id}
 */
export const updateIssue = async (id: number, data: IssueUpdateRequest): Promise<Issue> => {
  return fetchAPI<Issue>(`/api/issues/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: getAuthHeader()
  });
}; 