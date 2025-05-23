package com.munichweekly.backend.dto;

import com.munichweekly.backend.model.Submission;

import java.time.LocalDateTime;

/**
 * DTO for returning current user's own submissions for a specific issue,
 * including vote count, selection status, and cover status.
 */
public class MySubmissionResponseDTO {

    private Long id;
    private String imageUrl;
    private String description;
    private String status;
    private LocalDateTime submittedAt;

    private int voteCount;
    private boolean selected;
    private boolean isCover;

    public MySubmissionResponseDTO() {
        // Default constructor
    }

    public MySubmissionResponseDTO(Submission s, int voteCount) {
        this.id = s.getId();
        this.imageUrl = s.getImageUrl() != null ? s.getImageUrl() : "";
        this.description = s.getDescription();
        this.status = s.getStatus();
        this.submittedAt = s.getSubmittedAt();
        this.voteCount = voteCount;
        this.selected = "selected".equals(s.getStatus());
        this.isCover = Boolean.TRUE.equals(s.getCover());
    }

    // generate getters and setters


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public int getVoteCount() {
        return voteCount;
    }

    public void setVoteCount(int voteCount) {
        this.voteCount = voteCount;
    }

    public boolean isSelected() {
        return selected;
    }

    public void setSelected(boolean selected) {
        this.selected = selected;
    }

    public boolean isCover() {
        return isCover;
    }

    public void setCover(boolean cover) {
        isCover = cover;
    }
}