package com.munichweekly.backend.service;

import com.munichweekly.backend.dto.IssueCreateRequestDTO;
import com.munichweekly.backend.model.Issue;
import com.munichweekly.backend.repository.IssueRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing issues (weekly photo rounds).
 * Handles creation and business validation logic.
 */
@Service
public class IssueService {

    private final IssueRepository issueRepository;

    public IssueService(IssueRepository issueRepository) {
        this.issueRepository = issueRepository;
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
        if (dto.getSubmissionStart().isAfter(dto.getSubmissionEnd())) {
            throw new IllegalArgumentException("Submission start must be before submission end.");
        }

        if (dto.getVotingStart().isAfter(dto.getVotingEnd())) {
            throw new IllegalArgumentException("Voting start must be before voting end.");
        }

        if (dto.getVotingStart().isBefore(dto.getSubmissionEnd())) {
            throw new IllegalArgumentException("Voting must start after submission ends.");
        }

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
}