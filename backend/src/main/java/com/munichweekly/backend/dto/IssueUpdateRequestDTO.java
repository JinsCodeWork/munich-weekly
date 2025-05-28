package com.munichweekly.backend.dto;

import java.time.LocalDateTime;

/**
 * DTO for updating an existing issue.
 * Used in PUT /api/issues/{id} request body.
 * Contains all editable fields of an Issue.
 */
public class IssueUpdateRequestDTO {

    private String title;
    private String description;

    private LocalDateTime submissionStart;
    private LocalDateTime submissionEnd;

    private LocalDateTime votingStart;
    private LocalDateTime votingEnd;

    /**
     * Default constructor
     */
    public IssueUpdateRequestDTO() {
        // Default constructor for Jackson
    }

    /**
     * Constructor with all fields
     */
    public IssueUpdateRequestDTO(String title, String description,
                                LocalDateTime submissionStart, LocalDateTime submissionEnd,
                                LocalDateTime votingStart, LocalDateTime votingEnd) {
        this.title = title;
        this.description = description;
        this.submissionStart = submissionStart;
        this.submissionEnd = submissionEnd;
        this.votingStart = votingStart;
        this.votingEnd = votingEnd;
    }

    // Getters and setters

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

    @Override
    public String toString() {
        return "IssueUpdateRequestDTO{" +
                "title='" + title + '\'' +
                ", description='" + description + '\'' +
                ", submissionStart=" + submissionStart +
                ", submissionEnd=" + submissionEnd +
                ", votingStart=" + votingStart +
                ", votingEnd=" + votingEnd +
                '}';
    }
} 