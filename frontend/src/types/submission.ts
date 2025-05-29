// Submission status enum
export enum SubmissionStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  SELECTED = "selected"
}

// 期刊类型
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
  userVote?: 'up' | 'down' | null; // 用户的投票状态
}

// 分页响应类型
export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
}

// 提交列表响应类型
export type SubmissionListResponse = PaginatedResponse<Submission>;

// 提交请求类型
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
}