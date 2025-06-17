// Submission status enum
export enum SubmissionStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  SELECTED = "selected"
}

// Issue type
export interface Issue {
  id: number;
  title: string;
  description: string;
  submissionStart: string;
  submissionEnd: string;
  votingStart: string;
  votingEnd: string;
  createdAt: string;
}

// Image dimensions interface for optimized masonry layout
export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

// Submission type
export interface Submission {
  id: number;
  imageUrl: string;
  description: string;
  status: SubmissionStatus;
  submittedAt: string;
  reviewedAt?: string;
  isCover: boolean;
  voteCount: number;
  issue: Issue;
  userId: number;
  userVote?: 'up' | 'down' | null; // User's voting status
  
  // **NEW: Image dimension fields for optimized masonry layout**
  // These fields are populated from backend for new submissions
  // and provide instant layout calculation without frontend dimension fetching
  imageWidth?: number;      // Original image width in pixels
  imageHeight?: number;     // Original image height in pixels  
  aspectRatio?: number;     // Precomputed aspect ratio (width/height)
}

// Paginated response type
export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
}

// Submission list response type
export type SubmissionListResponse = PaginatedResponse<Submission>;

// Submission request type
export interface SubmissionRequest {
  issueId: number;
  description: string;
}

// My submission response type
export interface MySubmissionResponse {
  id: number;
  imageUrl: string;
  description: string;
  status: string;
  submittedAt: string;
  voteCount: number;
  selected: boolean;
  isCover: boolean;
  userEmail?: string;
  userNickname?: string;
  userId?: number;
  user?: {
    id: number;
    email: string;
    nickname: string;
    avatarUrl?: string;
  };
  nickname?: string;
  
  // **NEW: Image dimension fields for MySubmissionResponse**
  imageWidth?: number;
  imageHeight?: number;
  aspectRatio?: number;
}

// Admin submission response type
export interface AdminSubmissionResponse {
  id: number;
  imageUrl: string;
  description: string;
  status: SubmissionStatus | string;
  submittedAt: string;
  reviewedAt?: string;
  isCover: boolean;
  voteCount: number;
  userId: number;
  userEmail: string;
  userNickname: string;
  userAvatarUrl?: string;
  
  // **NEW: Image dimension fields for AdminSubmissionResponse**
  imageWidth?: number;
  imageHeight?: number;
  aspectRatio?: number;
}

// Utility function to check if submission has stored dimensions
export function hasStoredDimensions(submission: Submission | MySubmissionResponse | AdminSubmissionResponse): boolean {
  return !!(submission.imageWidth && submission.imageHeight && submission.aspectRatio);
}

// Utility function to get dimensions from submission
export function getSubmissionDimensions(submission: Submission | MySubmissionResponse | AdminSubmissionResponse): ImageDimensions | null {
  if (hasStoredDimensions(submission)) {
    return {
      width: submission.imageWidth!,
      height: submission.imageHeight!,
      aspectRatio: submission.aspectRatio!,
    };
  }
  return null;
}

// Utility function to determine if image is wide based on stored aspect ratio
export function isWideImage(submission: Submission | MySubmissionResponse | AdminSubmissionResponse, threshold: number = 16/9): boolean {
  if (submission.aspectRatio) {
    return submission.aspectRatio >= threshold;
  }
  return false; // Unknown dimensions, assume narrow for safe fallback
}