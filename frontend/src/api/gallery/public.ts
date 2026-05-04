import { FeaturedSubmission, GalleryStats } from "./types";
import { fetchAPI } from "../http";

const API_BASE = "/api/gallery";

/**
 * Get featured submissions for carousel display (public)
 * GET /api/gallery/featured
 */
export async function getFeaturedSubmissions(): Promise<FeaturedSubmission[]> {
  return fetchAPI<FeaturedSubmission[]>(`${API_BASE}/featured`, {
    method: "GET",
    auth: false,
  });
}

/**
 * Get gallery statistics (public)
 * GET /api/gallery/stats
 */
export async function getGalleryStats(): Promise<GalleryStats> {
  return fetchAPI<GalleryStats>(`${API_BASE}/stats`, {
    method: "GET",
    auth: false,
  });
}
