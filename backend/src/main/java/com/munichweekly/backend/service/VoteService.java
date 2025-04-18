package com.munichweekly.backend.service;

import com.munichweekly.backend.model.Issue;
import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.model.User;
import com.munichweekly.backend.model.Vote;
import com.munichweekly.backend.repository.IssueRepository;
import com.munichweekly.backend.repository.SubmissionRepository;
import com.munichweekly.backend.repository.UserRepository;
import com.munichweekly.backend.repository.VoteRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Service layer for handling voting logic.
 * Ensures voting constraints and saves vote entries.
 */
@Service
public class VoteService {

    private final VoteRepository voteRepository;
    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;
    private final IssueRepository issueRepository;

    public VoteService(VoteRepository voteRepository,
                       UserRepository userRepository,
                       SubmissionRepository submissionRepository,
                       IssueRepository issueRepository) {
        this.voteRepository = voteRepository;
        this.userRepository = userRepository;
        this.submissionRepository = submissionRepository;
        this.issueRepository = issueRepository;
    }

    /**
     * Cast a vote for a submission by a specific user.
     * Performs checks to avoid duplicate votes and invalid submissions.
     */
    public Vote vote(Long userId, Long submissionId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found"));

        Issue issue = submission.getIssue();

        if (!"approved".equals(submission.getStatus())) {
            throw new IllegalStateException("Only approved submissions can be voted on");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(issue.getVotingStart()) || now.isAfter(issue.getVotingEnd())) {
            throw new IllegalStateException("Voting is not open at this time");
        }

        boolean alreadyVoted = voteRepository.existsByUserAndSubmission(user, submission);
        if (alreadyVoted) {
            throw new IllegalStateException("You have already voted for this submission");
        }

        Vote vote = new Vote(user, submission, issue);
        return voteRepository.save(vote);
    }

    public IssueRepository getIssueRepository() {
        return issueRepository;
    }
}
