import {
  AvailableIssue,
  ConfigResponse,
  ConfigsResponse,
  CreateGalleryConfigRequest,
  DeleteConfigResponse,
  FeaturedStatusResponse,
  GalleryIssueConfig,
  GallerySubmission,
  SaveConfigRequest,
  SaveConfigResponse,
  SubmissionOrderUpdate,
  SubmissionPreviewResponse,
  UpdateGalleryConfigRequest,
} from "./types";
import { fetchAPI } from "../http";

const API_BASE = "/api/gallery";

export async function getActiveConfig(): Promise<ConfigResponse> {
  return fetchAPI<ConfigResponse>(`${API_BASE}/featured/config`, {
    method: "GET",
  });
}

export async function getAllConfigs(): Promise<ConfigsResponse> {
  return fetchAPI<ConfigsResponse>(`${API_BASE}/featured/configs`, {
    method: "GET",
  });
}

export async function saveConfig(config: SaveConfigRequest): Promise<SaveConfigResponse> {
  return fetchAPI<SaveConfigResponse>(`${API_BASE}/featured/config`, {
    method: "POST",
    body: JSON.stringify(config),
  });
}

export async function deleteConfig(configId: number): Promise<DeleteConfigResponse> {
  return fetchAPI<DeleteConfigResponse>(`${API_BASE}/featured/config/${configId}`, {
    method: "DELETE",
  });
}

export async function previewSubmission(submissionId: number): Promise<SubmissionPreviewResponse> {
  return fetchAPI<SubmissionPreviewResponse>(`${API_BASE}/submissions/${submissionId}/preview`, {
    method: "GET",
  });
}

export async function checkFeaturedStatus(submissionId: number): Promise<FeaturedStatusResponse> {
  return fetchAPI<FeaturedStatusResponse>(`${API_BASE}/submissions/${submissionId}/featured-status`, {
    method: "GET",
  });
}

export async function getGalleryConfigs(): Promise<GalleryIssueConfig[]> {
  const data = await fetchAPI<{ configs: GalleryIssueConfig[] }>(`${API_BASE}/admin/configs`, {
    method: "GET",
  });
  return data.configs;
}

export async function createGalleryConfig(
  config: CreateGalleryConfigRequest
): Promise<GalleryIssueConfig> {
  return fetchAPI<GalleryIssueConfig>(`${API_BASE}/admin/configs`, {
    method: "POST",
    body: JSON.stringify(config),
  });
}

export async function updateGalleryConfigByIssueId(
  issueId: number,
  config: UpdateGalleryConfigRequest
): Promise<GalleryIssueConfig> {
  const data = await fetchAPI<{ config: GalleryIssueConfig }>(`${API_BASE}/admin/issues/${issueId}`, {
    method: "PUT",
    body: JSON.stringify(config),
  });
  return data.config;
}

export async function getGalleryConfigByIssueId(issueId: number): Promise<GalleryIssueConfig> {
  const data = await fetchAPI<{ config: GalleryIssueConfig }>(`${API_BASE}/admin/issues/${issueId}`, {
    method: "GET",
  });
  return data.config;
}

export async function deleteGalleryConfigByIssueId(issueId: number): Promise<void> {
  await fetchAPI<{ message: string }>(`${API_BASE}/admin/issues/${issueId}`, {
    method: "DELETE",
  });
}

export async function updateSubmissionOrderByIssueId(
  issueId: number,
  orders: SubmissionOrderUpdate[]
): Promise<void> {
  await fetchAPI<undefined>(`${API_BASE}/admin/issues/${issueId}/order`, {
    method: "PUT",
    body: JSON.stringify(orders),
    parseResponseJson: false,
  });
}

export async function getSelectedSubmissions(issueId: number): Promise<GallerySubmission[]> {
  try {
    const data = await fetchAPI<{ submissions: GallerySubmission[] }>(
      `${API_BASE}/admin/issues/${issueId}/selected`,
      {
        method: "GET",
      }
    );
    return data.submissions;
  } catch {
    return [];
  }
}

export async function getAvailableIssues(): Promise<AvailableIssue[]> {
  try {
    const data = await fetchAPI<{ issues: AvailableIssue[] }>(`${API_BASE}/admin/issues/available`, {
      method: "GET",
    });
    return data.issues;
  } catch {
    return [];
  }
}

export async function uploadCoverImageByIssueId(
  issueId: number,
  file: File
): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);

  return fetchAPI<{ imageUrl: string }>(`${API_BASE}/admin/issues/${issueId}/cover`, {
    method: "POST",
    body: formData,
  });
}

export async function uploadCoverImage(configId: number, file: File): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);

  return fetchAPI<{ imageUrl: string }>(`${API_BASE}/admin/configs/${configId}/cover`, {
    method: "POST",
    body: formData,
  });
}
