import { fetchAPI } from "../http";
import { mapGalleryOrderResponse } from "./utils";
import type { GalleryIssueConfig, GalleryIssueStats, GalleryOrderResponse, GallerySubmission } from "./types";

const API_BASE = "/api/gallery";

export async function getPublishedIssues(): Promise<GalleryIssueConfig[]> {
  try {
    const data = await fetchAPI<{ issues: GalleryIssueConfig[] }>(`${API_BASE}/issues`, {
      method: "GET",
      auth: false,
    });
    return data.issues;
  } catch {
    return [];
  }
}

export async function getIssueDetail(issueId: number): Promise<GalleryIssueConfig> {
  const data = await fetchAPI<{ issue: GalleryIssueConfig; success: boolean }>(
    `${API_BASE}/issues/${issueId}`,
    {
      method: "GET",
      auth: false,
    }
  );
  return data.issue;
}

export async function getIssueSubmissions(issueId: number): Promise<GallerySubmission[]> {
  const data = await fetchAPI<{ submissions: GalleryOrderResponse[]; total: number; success: boolean }>(
    `${API_BASE}/issues/${issueId}/submissions`,
    {
      method: "GET",
      auth: false,
    }
  );

  return data.submissions.map(mapGalleryOrderResponse);
}

export async function getGalleryIssueStats(): Promise<GalleryIssueStats> {
  return fetchAPI<GalleryIssueStats>(`${API_BASE}/issues/stats`, {
    method: "GET",
    auth: false,
  });
}
