package com.munichweekly.backend.dto;

import com.munichweekly.backend.model.Issue;

import java.time.LocalDateTime;

/**
 * Issue option shown when admins create a gallery issue configuration.
 */
public class AvailableGalleryIssueDTO {

    private Long id;
    private String title;
    private String description;
    private LocalDateTime submissionStart;
    private LocalDateTime submissionEnd;
    private LocalDateTime votingStart;
    private LocalDateTime votingEnd;
    private Long selectedSubmissionCount;

    public AvailableGalleryIssueDTO() {
    }

    public AvailableGalleryIssueDTO(Issue issue, long selectedSubmissionCount) {
        this.id = issue.getId();
        this.title = issue.getTitle();
        this.description = issue.getDescription();
        this.submissionStart = issue.getSubmissionStart();
        this.submissionEnd = issue.getSubmissionEnd();
        this.votingStart = issue.getVotingStart();
        this.votingEnd = issue.getVotingEnd();
        this.selectedSubmissionCount = selectedSubmissionCount;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Long getSelectedSubmissionCount() {
        return selectedSubmissionCount;
    }

    public void setSelectedSubmissionCount(Long selectedSubmissionCount) {
        this.selectedSubmissionCount = selectedSubmissionCount;
    }
}
