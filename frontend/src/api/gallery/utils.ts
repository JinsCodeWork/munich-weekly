import type { GalleryOrderResponse, GallerySubmission } from "./types";

export function validateSubmissionIds(idsString: string): {
  isValid: boolean;
  ids: number[];
  errors: string[];
} {
  const errors: string[] = [];
  const ids: number[] = [];

  if (!idsString.trim()) {
    return { isValid: true, ids: [], errors: [] };
  }

  const parts = idsString
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s);

  for (const part of parts) {
    const num = parseInt(part, 10);
    if (Number.isNaN(num) || num <= 0) {
      errors.push(`Invalid ID: "${part}"`);
    } else {
      ids.push(num);
    }
  }

  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length !== ids.length) {
    errors.push("Duplicate IDs found");
  }

  return {
    isValid: errors.length === 0,
    ids: uniqueIds,
    errors,
  };
}

export function generateDisplayOrder(submissionIds: number[]): number[] {
  return submissionIds.map((_, index) => index + 1);
}

export function formatSubmissionIds(ids: number[]): string {
  return ids.join(", ");
}

export function isWideImage(aspectRatio?: number): boolean {
  return aspectRatio ? aspectRatio >= 1.6 : false;
}

export function mapGalleryOrderResponse(item: GalleryOrderResponse): GallerySubmission {
  if (item.itemType === "CUSTOM_IMAGE" && item.customImage) {
    const title = item.customImage.title || "Gallery image";
    return {
      id: item.customImage.id || item.id,
      orderId: item.id,
      itemType: "CUSTOM_IMAGE",
      isCustomImage: true,
      imageUrl: item.customImage.imageUrl,
      thumbnailUrl: item.customImage.imageUrl,
      title,
      description: item.customImage.description || "",
      authorName: "",
      authorId: null,
      imageWidth: item.customImage.imageWidth,
      imageHeight: item.customImage.imageHeight,
      aspectRatio: item.customImage.aspectRatio,
      status: "custom",
      submittedAt: "",
      displayOrder: item.displayOrder,
    };
  }

  if (!item.submission) {
    throw new Error(`Gallery item ${item.id} does not include image data`);
  }

  return {
    id: item.submission.id,
    orderId: item.id,
    submissionId: item.submission.id,
    itemType: "SUBMISSION",
    isCustomImage: false,
    imageUrl: item.submission.imageUrl,
    thumbnailUrl: item.submission.imageUrl,
    title: item.submission.description || "Untitled",
    description: item.submission.description || "",
    authorName: item.submission.authorNickname || "Anonymous",
    authorId: item.submission.authorId ?? null,
    imageWidth: item.submission.imageWidth,
    imageHeight: item.submission.imageHeight,
    aspectRatio: item.submission.aspectRatio,
    status: item.submission.status as "selected" | "cover",
    submittedAt: item.submission.submittedAt,
    displayOrder: item.displayOrder,
  };
}
