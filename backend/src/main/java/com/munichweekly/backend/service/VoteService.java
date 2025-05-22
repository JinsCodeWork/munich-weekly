package com.munichweekly.backend.service;

import com.munichweekly.backend.model.Issue;
import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.model.Vote;
import com.munichweekly.backend.repository.IssueRepository;
import com.munichweekly.backend.repository.SubmissionRepository;
import com.munichweekly.backend.repository.VoteRepository;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service layer for handling voting logic using anonymous visitorId or userId.
 * Ensures voting constraints and saves vote entries.
 */
@Service
public class VoteService {
    private static final Logger logger = LoggerFactory.getLogger(VoteService.class);

    private final VoteRepository voteRepository;
    private final IssueRepository issueRepository;
    private final SubmissionRepository submissionRepository;

    public VoteService(VoteRepository voteRepository,
                       SubmissionRepository submissionRepository,
                       IssueRepository issueRepository) {
        this.voteRepository = voteRepository;
        this.submissionRepository = submissionRepository;
        this.issueRepository = issueRepository;
    }

    /**
     * Cast a vote for a submission using visitorId (for anonymous users).
     * Checks for duplicate votes and voting window.
     */
    public Vote vote(String visitorId, Submission submission, String ipAddress) {
        Issue issue = submission.getIssue();
        
        logger.info("Anonymous vote attempt: visitorId={}, submissionId={}, ip={}", 
                  visitorId, submission.getId(), ipAddress);

        if (!"approved".equals(submission.getStatus())) {
            logger.warn("Vote rejected: submission not approved, submissionId={}", submission.getId());
            throw new IllegalStateException("Only approved submissions can be voted on");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(issue.getVotingStart()) || now.isAfter(issue.getVotingEnd())) {
            logger.warn("Vote rejected: outside voting window, submissionId={}", submission.getId());
            throw new IllegalStateException("Voting is not open at this time");
        }

        boolean alreadyVoted = voteRepository.existsByVisitorIdAndSubmission(visitorId, submission);
        if (alreadyVoted) {
            logger.warn("Vote rejected: already voted, visitorId={}, submissionId={}", 
                      visitorId, submission.getId());
            throw new IllegalStateException("You have already voted for this submission");
        }

        Vote vote = new Vote();
        vote.setSubmission(submission);
        vote.setIssue(issue);
        vote.setVisitorId(visitorId);
        vote.setIpAddress(ipAddress);
        vote.setVotedAt(now);

        Vote savedVote = voteRepository.save(vote);
        logger.info("Anonymous vote successful: visitorId={}, submissionId={}, voteId={}", 
                  visitorId, submission.getId(), savedVote.getId());
        return savedVote;
    }

    /**
     * Cast a vote for a submission using userId (for authenticated users).
     * Checks for duplicate votes and voting window.
     */
    public Vote voteAsUser(Long userId, Submission submission, String ipAddress) {
        Issue issue = submission.getIssue();
        
        logger.info("User vote attempt: userId={}, submissionId={}, ip={}", 
                  userId, submission.getId(), ipAddress);

        if (!"approved".equals(submission.getStatus())) {
            logger.warn("Vote rejected: submission not approved, submissionId={}", submission.getId());
            throw new IllegalStateException("Only approved submissions can be voted on");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(issue.getVotingStart()) || now.isAfter(issue.getVotingEnd())) {
            logger.warn("Vote rejected: outside voting window, submissionId={}", submission.getId());
            throw new IllegalStateException("Voting is not open at this time");
        }

        boolean alreadyVoted = voteRepository.existsByUserIdAndSubmission(userId, submission);
        if (alreadyVoted) {
            logger.warn("Vote rejected: already voted, userId={}, submissionId={}", 
                      userId, submission.getId());
            throw new IllegalStateException("You have already voted for this submission");
        }

        Vote vote = new Vote();
        vote.setSubmission(submission);
        vote.setIssue(issue);
        vote.setUserId(userId);
        vote.setVisitorId("user_" + userId);
        vote.setIpAddress(ipAddress);
        vote.setVotedAt(now);

        Vote savedVote = voteRepository.save(vote);
        logger.info("User vote successful: userId={}, submissionId={}, voteId={}", 
                  userId, submission.getId(), savedVote.getId());
        return savedVote;
    }

    /**
     * Cancel a vote for a submission using visitorId (for anonymous users).
     * Checks if the vote exists and the voting window is still open.
     */
    public boolean cancelVote(String visitorId, Submission submission) {
        Issue issue = submission.getIssue();
        
        logger.info("Anonymous cancel vote attempt: visitorId={}, submissionId={}", 
                  visitorId, submission.getId());

        if (!"approved".equals(submission.getStatus())) {
            logger.warn("Cancel vote rejected: submission not approved, submissionId={}", submission.getId());
            throw new IllegalStateException("Only approved submissions can be voted on");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(issue.getVotingStart()) || now.isAfter(issue.getVotingEnd())) {
            logger.warn("Cancel vote rejected: outside voting window, submissionId={}", submission.getId());
            throw new IllegalStateException("Voting window is closed");
        }

        // 详细检查visitorId参数
        if (visitorId == null || visitorId.isEmpty()) {
            logger.error("Cancel vote rejected: missing visitorId for submissionId={}", submission.getId());
            throw new IllegalStateException("Visitor ID is required to cancel a vote");
        }

        Optional<Vote> existingVote = voteRepository.findByVisitorIdAndSubmission(visitorId, submission);
        if (existingVote.isEmpty()) {
            logger.warn("Cancel vote rejected: no matching vote found, visitorId={}, submissionId={}", 
                      visitorId, submission.getId());
            
            // 尝试查找是否存在任何投票记录
            int voteCount = voteRepository.findBySubmission(submission).size();
            logger.info("Total votes for submission: {}", voteCount);
            
            throw new IllegalStateException("You have not voted for this submission");
        }

        voteRepository.delete(existingVote.get());
        logger.info("Anonymous vote cancelled successfully: visitorId={}, submissionId={}, voteId={}", 
                  visitorId, submission.getId(), existingVote.get().getId());
        return true;
    }

    /**
     * Cancel a vote for a submission using userId (for authenticated users).
     * Checks if the vote exists and the voting window is still open.
     */
    public boolean cancelVoteAsUser(Long userId, Submission submission) {
        Issue issue = submission.getIssue();
        
        logger.info("User cancel vote attempt: userId={}, submissionId={}", 
                  userId, submission.getId());

        if (!"approved".equals(submission.getStatus())) {
            logger.warn("Cancel vote rejected: submission not approved, submissionId={}", submission.getId());
            throw new IllegalStateException("Only approved submissions can be voted on");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(issue.getVotingStart()) || now.isAfter(issue.getVotingEnd())) {
            logger.warn("Cancel vote rejected: outside voting window, submissionId={}", submission.getId());
            throw new IllegalStateException("Voting window is closed");
        }

        Optional<Vote> existingVote = voteRepository.findByUserIdAndSubmission(userId, submission);
        if (existingVote.isEmpty()) {
            logger.warn("Cancel vote rejected: no matching vote found, userId={}, submissionId={}", 
                      userId, submission.getId());
            throw new IllegalStateException("You have not voted for this submission");
        }

        voteRepository.delete(existingVote.get());
        logger.info("User vote cancelled successfully: userId={}, submissionId={}, voteId={}", 
                  userId, submission.getId(), existingVote.get().getId());
        return true;
    }

    /**
     * Check if a visitor has already voted for a submission.
     */
    public boolean hasVoted(String visitorId, Submission submission) {
        boolean voted = voteRepository.existsByVisitorIdAndSubmission(visitorId, submission);
        logger.debug("Check if visitor voted: visitorId={}, submissionId={}, result={}", 
                   visitorId, submission.getId(), voted);
        return voted;
    }

    /**
     * Check if a registered user has already voted for a submission.
     */
    public boolean hasVotedAsUser(Long userId, Submission submission) {
        boolean voted = voteRepository.existsByUserIdAndSubmission(userId, submission);
        logger.debug("Check if user voted: userId={}, submissionId={}, result={}", 
                   userId, submission.getId(), voted);
        return voted;
    }

    public IssueRepository getIssueRepository() {
        return issueRepository;
    }
}
