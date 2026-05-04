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
