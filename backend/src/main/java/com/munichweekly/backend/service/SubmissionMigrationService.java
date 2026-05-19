package com.munichweekly.backend.service;

import com.munichweekly.backend.model.Issue;
import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.repository.IssueRepository;
import com.munichweekly.backend.repository.SubmissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Admin migration use-cases only — submissions listing and persistence for tooling.
 */
@Service
public class SubmissionMigrationService {

    private final SubmissionRepository submissionRepository;
    private final IssueRepository issueRepository;

    public SubmissionMigrationService(SubmissionRepository submissionRepository,
                                     IssueRepository issueRepository) {
        this.submissionRepository = submissionRepository;
        this.issueRepository = issueRepository;
    }

    public List<Submission> listSubmissionsByIssueId(Long issueId) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue not found"));
        return submissionRepository.findByIssue(issue);
    }

    public List<Submission> listAllSubmissions() {
        return submissionRepository.findAll();
    }

    @Transactional
    public Submission updateSubmission(Submission submission) {
        if (submission == null || submission.getId() == null) {
            throw new IllegalArgumentException("Submission and submission ID cannot be null");
        }
        if (!submissionRepository.existsById(submission.getId())) {
            throw new IllegalArgumentException("Submission not found with ID: " + submission.getId());
        }
        return submissionRepository.save(submission);
    }
}
