package com.munichweekly.backend.service;

import com.munichweekly.backend.dto.IssueCreateRequestDTO;
import com.munichweekly.backend.dto.IssueUpdateRequestDTO;
import com.munichweekly.backend.model.Issue;
import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.model.User;
import com.munichweekly.backend.repository.GalleryIssueConfigRepository;
import com.munichweekly.backend.repository.IssueRepository;
import com.munichweekly.backend.repository.SubmissionRepository;
import com.munichweekly.backend.repository.VoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for managing issues (weekly photo rounds).
 * Handles creation, retrieval, updates and business validation logic.
 */
@Service
public class IssueService {

    private final IssueRepository issueRepository;
    private final SubmissionRepository submissionRepository;
    private final VoteRepository voteRepository;
    private final GalleryIssueConfigRepository galleryIssueConfigRepository;
    private final SubmissionService submissionService;

    public IssueService(
            IssueRepository issueRepository,
            SubmissionRepository submissionRepository,
            VoteRepository voteRepository,
            GalleryIssueConfigRepository galleryIssueConfigRepository,
            SubmissionService submissionService
    ) {
        this.issueRepository = issueRepository;
        this.submissionRepository = submissionRepository;
        this.voteRepository = voteRepository;
        this.galleryIssueConfigRepository = galleryIssueConfigRepository;
        this.submissionService = submissionService;
    }

    /**
     * Get a specific issue by ID.
     * 
     * @param id the issue ID
     * @return the Issue entity
     * @throws IllegalArgumentException if issue not found
     */
    public Issue getIssueById(Long id) {
        return issueRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Issue not found with id: " + id));
    }

    /**
     * Create a new issue based on admin input.
     * Validates time range logic and saves to database.
     *
     * @param dto request payload from frontend
     * @return saved Issue entity
     */
    @Transactional
    public Issue createIssue(IssueCreateRequestDTO dto) {
        // Basic time validation
        validateIssueTimes(dto.getSubmissionStart(), dto.getSubmissionEnd(), 
                          dto.getVotingStart(), dto.getVotingEnd());

        Issue issue = new Issue(
                dto.getTitle(),
                dto.getDescription(),
                dto.getSubmissionStart(),
                dto.getSubmissionEnd(),
                dto.getVotingStart(),
                dto.getVotingEnd()
        );

        return issueRepository.save(issue);
    }

    /**
     * Update an existing issue.
     * Validates time range logic and updates all editable fields.
     *
     * @param id the ID of the issue to update
     * @param dto request payload with updated data
     * @return updated Issue entity
     * @throws IllegalArgumentException if issue not found
     */
    @Transactional
    public Issue updateIssue(Long id, IssueUpdateRequestDTO dto) {
        Issue existingIssue = getIssueById(id);
        
        // Validate time ranges
        validateIssueTimes(dto.getSubmissionStart(), dto.getSubmissionEnd(),
                          dto.getVotingStart(), dto.getVotingEnd());

        // Update all editable fields
        existingIssue.setTitle(dto.getTitle());
        existingIssue.setDescription(dto.getDescription());
        existingIssue.setSubmissionStart(dto.getSubmissionStart());
        existingIssue.setSubmissionEnd(dto.getSubmissionEnd());
        existingIssue.setVotingStart(dto.getVotingStart());
        existingIssue.setVotingEnd(dto.getVotingEnd());

        return issueRepository.save(existingIssue);
    }

    /**
     * Delete an issue when it has no blocking dependencies.
     * Unselected anonymous submissions are cleaned up with their stored images and synthetic users.
     *
     * @param id the ID of the issue to delete
     * @throws IllegalArgumentException if issue not found
     * @throws IllegalStateException if registered submissions, selected anonymous submissions, votes, or gallery config exist
     */
    @Transactional
    public void deleteIssue(Long id) {
        Issue issue = getIssueById(id);

        if (galleryIssueConfigRepository.existsByIssueId(id)) {
            throw new IllegalStateException("Cannot delete issue " + id + " because it has a gallery configuration");
        }

        List<Submission> submissions = submissionRepository.findByIssue(issue);
        if (submissions.isEmpty()) {
            if (voteRepository.countByIssueId(id) > 0) {
                throw new IllegalStateException("Cannot delete issue " + id + " because it has votes");
            }

            issueRepository.delete(issue);
            return;
        }

        boolean hasNonAnonymousSubmissions = submissions.stream()
                .anyMatch(submission -> !isAnonymousSubmission(submission));
        if (hasNonAnonymousSubmissions) {
            throw new IllegalStateException("Cannot delete issue " + id + " because it has non-anonymous submissions");
        }

        boolean hasSelectedAnonymousSubmissions = submissions.stream()
                .anyMatch(submission -> "selected".equals(submission.getStatus()));
        if (hasSelectedAnonymousSubmissions) {
            throw new IllegalStateException("Cannot delete issue " + id + " because it has selected anonymous submissions");
        }

        for (Submission submission : submissions) {
            submissionService.deleteAnonymousSubmissionIfNotSelected(submission);
        }

        issueRepository.delete(issue);
    }

    private boolean isAnonymousSubmission(Submission submission) {
        return submission.getUser() != null
                && User.ACCOUNT_TYPE_ANONYMOUS_SUBMISSION.equals(submission.getUser().getAccountType());
    }

    /**
     * Validate issue time periods to ensure logical consistency.
     * 
     * @param submissionStart when submissions open
     * @param submissionEnd when submissions close
     * @param votingStart when voting opens
     * @param votingEnd when voting closes
     * @throws IllegalArgumentException if validation fails
     */
    private void validateIssueTimes(java.time.LocalDateTime submissionStart, 
                                   java.time.LocalDateTime submissionEnd,
                                   java.time.LocalDateTime votingStart, 
                                   java.time.LocalDateTime votingEnd) {
        if (submissionStart.isAfter(submissionEnd)) {
            throw new IllegalArgumentException("Submission start must be before submission end.");
        }

        if (votingStart.isAfter(votingEnd)) {
            throw new IllegalArgumentException("Voting start must be before voting end.");
        }

        if (votingStart.isBefore(submissionStart)) {
            throw new IllegalArgumentException("Voting must start after submission start.");
        }
    }
}
