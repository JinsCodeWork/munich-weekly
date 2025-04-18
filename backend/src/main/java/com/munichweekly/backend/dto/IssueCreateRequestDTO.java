package com.munichweekly.backend.dto;

import java.time.LocalDateTime;

/**
 * DTO for creating a new issue.
 * Used in POST /api/issues request body.
 */
public class IssueCreateRequestDTO {

    private String title;
    private String description;

    private LocalDateTime submissionStart;
    private LocalDateTime submissionEnd;

    private LocalDateTime votingStart;
    private LocalDateTime votingEnd;

    public IssueCreateRequestDTO() {
        // Default constructor
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getSubmissionStart() {
        return submissionStart;
    }

    public void setSubmissionStart(LocalDateTime submissionStart) {
        this.submissionStart = submissionStart;
    }

    public LocalDateTime getSubmissionEnd() {
        return submissionEnd;
    }

    public void setSubmissionEnd(LocalDateTime submissionEnd) {
        this.submissionEnd = submissionEnd;
    }

    public LocalDateTime getVotingStart() {
        return votingStart;
    }

    public void setVotingStart(LocalDateTime votingStart) {
        this.votingStart = votingStart;
    }

    public LocalDateTime getVotingEnd() {
        return votingEnd;
    }

    public void setVotingEnd(LocalDateTime votingEnd) {
        this.votingEnd = votingEnd;
    }
}