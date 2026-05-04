import { fetchAPI } from "../http";
import { GalleryIssueConfig, GalleryIssueStats, GallerySubmission } from "./types";

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

interface SubmissionOrderResponse {
  id: number;
  displayOrder: number;
  submission: {
    id: number;
    imageUrl: string;
    description: string;
    status: string;
    submittedAt: string;
    imageWidth?: number;
    imageHeight?: number;
    aspectRatio?: number;
    authorNickname: string;
    authorId: number;
  };
}

export async function getIssueSubmissions(issueId: number): Promise<GallerySubmission[]> {
  const data = await fetchAPI<{ submissions: SubmissionOrderResponse[]; total: number; success: boolean }>(
    `${API_BASE}/issues/${issueId}/submissions`,
    {
      method: "GET",
      auth: false,
    }
  );

  return data.submissions.map((item) => ({
    id: item.submission.id,
    imageUrl: item.submission.imageUrl,
    thumbnailUrl: item.submission.imageUrl,
    title: item.submission.description || "Untitled",
    description: item.submission.description || "",
    authorName: item.submission.authorNickname,
    authorId: item.submission.authorId,
    imageWidth: item.submission.imageWidth,
    imageHeight: item.submission.imageHeight,
    aspectRatio: item.submission.aspectRatio,
    status: item.submission.status as "selected" | "cover",
    submittedAt: item.submission.submittedAt,
    displayOrder: item.displayOrder,
  }));
}

export async function getGalleryIssueStats(): Promise<GalleryIssueStats> {
  return fetchAPI<GalleryIssueStats>(`${API_BASE}/issues/stats`, {
    method: "GET",
    auth: false,
  });
}
