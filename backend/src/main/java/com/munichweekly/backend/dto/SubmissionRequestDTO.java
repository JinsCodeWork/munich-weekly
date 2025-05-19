package com.munichweekly.backend.dto;

public class SubmissionRequestDTO {

    private Long issueId;
    private String description;

    public SubmissionRequestDTO() {}

    public SubmissionRequestDTO(Long issueId, String description) {
        this.issueId = issueId;
        this.description = description;
    }

    public Long getIssueId() {
        return issueId;
    }

    public void setIssueId(Long issueId) {
        this.issueId = issueId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}