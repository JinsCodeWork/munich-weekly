import { AdminSubmissionResponse, Issue, SubmissionStatus } from "@/types/submission";

/**
 * Generate mock submission data for development and testing
 * Creates a set of submissions with varying statuses and properties
 */
export function generateMockSubmissions(): AdminSubmissionResponse[] {
  return Array.from({ length: 10 }, (_, i) => {
    const userId = i + 100;
    const nickname = `Photographer ${userId}`;
    const email = `user${userId}@example.com`;
    
    return {
      id: i + 1,
      imageUrl: `https://picsum.photos/seed/${i + 1}/800/600`,
      description: `Submission ${i + 1} description. This is a sample description for testing purposes.`,
      status: i % 4 === 0 ? SubmissionStatus.APPROVED : 
             i % 4 === 1 ? SubmissionStatus.REJECTED :
             i % 4 === 2 ? SubmissionStatus.SELECTED : SubmissionStatus.PENDING,
      submittedAt: new Date(Date.now() - i * 86400000).toISOString(),
      reviewedAt: i % 2 === 0 ? new Date(Date.now() - i * 43200000).toISOString() : undefined,
      voteCount: Math.floor(Math.random() * 50),
      isCover: i === 0,
      userId: userId,
      userEmail: email,
      userNickname: nickname,
      userAvatarUrl: `https://i.pravatar.cc/150?u=${email}`
    };
  });
}

/**
 * Generate a mock issue for development and testing
 */
export function generateMockIssue(id: number = 1): Issue {
  return {
    id: id,
    title: `Issue ${id} Photography Weekly`,
    description: "This is a themed photography contest, welcome to submit!",
    submissionStart: new Date(Date.now() - 10 * 86400000).toISOString(),
    submissionEnd: new Date(Date.now() + 10 * 86400000).toISOString(),
    votingStart: new Date(Date.now() + 11 * 86400000).toISOString(),
    votingEnd: new Date(Date.now() + 20 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
  };
} 