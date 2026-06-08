package com.munichweekly.backend.service;

import com.munichweekly.backend.model.Issue;
import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.model.Vote;
import com.munichweekly.backend.repository.SubmissionRepository;
import com.munichweekly.backend.repository.VoteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/**
 * Service layer for handling voting logic using an anonymous server-issued subject or userId.
 * Ensures voting constraints and saves vote entries.
 */
@Service
public class VoteService {
    private static final Logger logger = LoggerFactory.getLogger(VoteService.class);

    private final VoteRepository voteRepository;
    private final SubmissionRepository submissionRepository;

    public VoteService(VoteRepository voteRepository,
                       SubmissionRepository submissionRepository) {
        this.voteRepository = voteRepository;
        this.submissionRepository = submissionRepository;
    }

    public Submission requireSubmissionForVote(Long submissionId) {
        return submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found"));
    }

    public int countVotesForSubmission(Submission submission) {
        return (int) voteRepository.countBySubmission(submission);
    }

    /**
     * Batch vote status check; missing submission yields false per legacy API behavior.
     */
    public BatchVoteStatusResult batchVoteStatuses(List<Long> submissionIds,
                                                   Optional<Long> currentUserId,
                                                   Optional<String> anonymousSubjectOpt) {
        Map<String, Boolean> voteStatuses = new LinkedHashMap<>();
        for (Long submissionId : submissionIds) {
            voteStatuses.put(submissionId.toString(), false);
        }

        if (submissionIds.isEmpty()) {
            return new BatchVoteStatusResult(voteStatuses, 0);
        }

        String anonymousSubject = anonymousSubjectOpt.orElse("");
        List<Vote> votes;

        if (currentUserId.isPresent()) {
            votes = voteRepository.findByUserIdAndSubmissionIdIn(currentUserId.get(), submissionIds);
        } else if (!anonymousSubject.isEmpty()) {
            votes = voteRepository.findByVisitorIdAndSubmissionIdIn(anonymousSubject, submissionIds);
        } else {
            return new BatchVoteStatusResult(voteStatuses, submissionIds.size());
        }

        for (Vote vote : votes) {
            if (vote.getSubmission() != null && vote.getSubmission().getId() != null) {
                voteStatuses.put(vote.getSubmission().getId().toString(), true);
            }
        }

        return new BatchVoteStatusResult(voteStatuses, submissionIds.size());
    }

    /**
     * Cast a vote for a submission using the server-managed anonymous subject.
     * Checks for duplicate votes and voting window.
     */
    public Vote vote(String anonymousSubject, Submission submission, String ipAddress) {
        Issue issue = submission.getIssue();
        
        logger.info("Anonymous vote attempt: anonymousIdentity={}, submissionId={}, ip={}",
                  identityForLog(anonymousSubject), submission.getId(), ipAddress);

        if (!"approved".equals(submission.getStatus())) {
            logger.warn("Vote rejected: submission not approved, submissionId={}", submission.getId());
            throw new IllegalStateException("Only approved submissions can be voted on");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(issue.getVotingStart()) || now.isAfter(issue.getVotingEnd())) {
            logger.warn("Vote rejected: outside voting window, submissionId={}", submission.getId());
            throw new IllegalStateException("Voting is not open at this time");
        }

        boolean alreadyVoted = voteRepository.existsByVisitorIdAndSubmission(anonymousSubject, submission);
        if (alreadyVoted) {
            logger.warn("Vote rejected: already voted, anonymousIdentity={}, submissionId={}",
                      identityForLog(anonymousSubject), submission.getId());
            throw new IllegalStateException("You have already voted for this submission");
        }

        Vote vote = new Vote();
        vote.setSubmission(submission);
        vote.setIssue(issue);
        vote.setVisitorId(anonymousSubject);
        vote.setIpAddress(ipAddress);
        vote.setVotedAt(now);

        Vote savedVote = voteRepository.save(vote);
        logger.info("Anonymous vote successful: anonymousIdentity={}, submissionId={}, voteId={}",
                  identityForLog(anonymousSubject), submission.getId(), savedVote.getId());
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
     * Cancel a vote for a submission using the server-managed anonymous subject.
     * Checks if the vote exists and the voting window is still open.
     */
    public boolean cancelVote(String anonymousSubject, Submission submission) {
        Issue issue = submission.getIssue();
        
        logger.info("Anonymous cancel vote attempt: anonymousIdentity={}, submissionId={}",
                  identityForLog(anonymousSubject), submission.getId());

        if (!"approved".equals(submission.getStatus())) {
            logger.warn("Cancel vote rejected: submission not approved, submissionId={}", submission.getId());
            throw new IllegalStateException("Only approved submissions can be voted on");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(issue.getVotingStart()) || now.isAfter(issue.getVotingEnd())) {
            logger.warn("Cancel vote rejected: outside voting window, submissionId={}", submission.getId());
            throw new IllegalStateException("Voting window is closed");
        }

        if (anonymousSubject == null || anonymousSubject.isEmpty()) {
            logger.error("Cancel vote rejected: missing anonymous identity for submissionId={}", submission.getId());
            throw new IllegalStateException("Anonymous vote identity is required to cancel a vote");
        }

        Optional<Vote> existingVote = voteRepository.findByVisitorIdAndSubmission(anonymousSubject, submission);
        if (existingVote.isEmpty()) {
            logger.warn("Cancel vote rejected: no matching vote found, anonymousIdentity={}, submissionId={}",
                      identityForLog(anonymousSubject), submission.getId());
            throw new IllegalStateException("You have not voted for this submission");
        }

        voteRepository.delete(existingVote.get());
        logger.info("Anonymous vote cancelled successfully: anonymousIdentity={}, submissionId={}, voteId={}",
                  identityForLog(anonymousSubject), submission.getId(), existingVote.get().getId());
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
     * Check if an anonymous subject has already voted for a submission.
     */
    public boolean hasVoted(String anonymousSubject, Submission submission) {
        boolean voted = voteRepository.existsByVisitorIdAndSubmission(anonymousSubject, submission);
        logger.debug("Check if anonymous identity voted: anonymousIdentity={}, submissionId={}, result={}",
                   identityForLog(anonymousSubject), submission.getId(), voted);
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

    public record BatchVoteStatusResult(Map<String, Boolean> statuses, int totalChecked) {}

    private static String identityForLog(String identity) {
        if (identity == null || identity.isBlank()) {
            return "none";
        }
        return "len=" + identity.length() + ",hash=" + Integer.toHexString(Objects.hashCode(identity));
    }
}
