package com.munichweekly.backend.dto;

public class SubmissionRequestDTO {

    private Long issueId;
    private String imageUrl;
    private String description;

    public SubmissionRequestDTO() {}

    public SubmissionRequestDTO(Long issueId, String imageUrl, String description) {
        this.issueId = issueId;
        this.imageUrl = imageUrl;
        this.description = description;
    }

    public Long getIssueId() {
        return issueId;
    }

    public void setIssueId(Long issueId) {
        this.issueId = issueId;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}