package com.munichweekly.backend.service;

import com.munichweekly.backend.model.Issue;
import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.model.Vote;
import com.munichweekly.backend.repository.IssueRepository;
import com.munichweekly.backend.repository.SubmissionRepository;
import com.munichweekly.backend.repository.VoteRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Service layer for handling voting logic using anonymous visitorId.
 * Ensures voting constraints and saves vote entries.
 */
@Service
public class VoteService {

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
     * Cast a vote for a submission using visitorId.
     * Checks for duplicate votes and voting window.
     */
    public Vote vote(String visitorId, Submission submission, String ipAddress) {
        Issue issue = submission.getIssue();

        if (!"approved".equals(submission.getStatus())) {
            throw new IllegalStateException("Only approved submissions can be voted on");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(issue.getVotingStart()) || now.isAfter(issue.getVotingEnd())) {
            throw new IllegalStateException("Voting is not open at this time");
        }

        boolean alreadyVoted = voteRepository.existsByVisitorIdAndSubmission(visitorId, submission);
        if (alreadyVoted) {
            throw new IllegalStateException("You have already voted for this submission");
        }

        Vote vote = new Vote();
        vote.setSubmission(submission);
        vote.setIssue(issue);
        vote.setVisitorId(visitorId);
        vote.setIpAddress(ipAddress);
        vote.setVotedAt(now);

        return voteRepository.save(vote);
    }

    /**
     * Check if a visitor has already voted for a submission.
     */
    public boolean hasVoted(String visitorId, Submission submission) {
        return voteRepository.existsByVisitorIdAndSubmission(visitorId, submission);
    }

    public IssueRepository getIssueRepository() {
        return issueRepository;
    }
}
