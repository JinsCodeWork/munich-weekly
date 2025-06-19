package com.munichweekly.backend.dto;

import com.munichweekly.backend.model.GallerySubmissionOrder;
import com.munichweekly.backend.model.Submission;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for returning gallery submission order details.
 * Used for both public gallery display and admin management of submission ordering.
 */
public class GallerySubmissionOrderResponseDTO {

    private Long id;
    private Long galleryConfigId;
    private Integer displayOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Submission details
    private SubmissionDetailsDTO submission;

    // Constructors

    public GallerySubmissionOrderResponseDTO() {}

    public GallerySubmissionOrderResponseDTO(GallerySubmissionOrder order) {
        this.id = order.getId();
        this.galleryConfigId = order.getGalleryConfig().getId();
        this.displayOrder = order.getDisplayOrder();
        this.createdAt = order.getCreatedAt();
        this.updatedAt = order.getUpdatedAt();

        // Include submission details
        if (order.getSubmission() != null) {
            this.submission = new SubmissionDetailsDTO(order.getSubmission());
        }
    }

    // Nested DTO for submission details
    public static class SubmissionDetailsDTO {
        private Long id;
        private String imageUrl;
        private String description;
        private String status;
        private LocalDateTime submittedAt;
        private Long issueId;
        private String issueTitle;

        // Image dimensions for display optimization
        private Integer imageWidth;
        private Integer imageHeight;
        private BigDecimal aspectRatio;

        // Author information
        private String authorNickname;
        private Long authorId;

        public SubmissionDetailsDTO() {}

        public SubmissionDetailsDTO(Submission submission) {
            this.id = submission.getId();
            this.imageUrl = submission.getImageUrl();
            this.description = submission.getDescription();
            this.status = submission.getStatus();
            this.submittedAt = submission.getSubmittedAt();

            // Issue information
            if (submission.getIssue() != null) {
                this.issueId = submission.getIssue().getId();
                this.issueTitle = submission.getIssue().getTitle();
            }

            // Image dimension data
            this.imageWidth = submission.getImageWidth();
            this.imageHeight = submission.getImageHeight();
            this.aspectRatio = submission.getAspectRatio();

            // Author information
            if (submission.getUser() != null) {
                this.authorNickname = submission.getUser().getNickname();
                this.authorId = submission.getUser().getId();
            }
        }

        // Convenience methods
        public boolean hasImageDimensions() {
            return imageWidth != null && imageHeight != null && aspectRatio != null;
        }

        public Double getAspectRatioAsDouble() {
            return aspectRatio != null ? aspectRatio.doubleValue() : null;
        }

        // Getters and setters
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

        public Long getIssueId() {
            return issueId;
        }

        public void setIssueId(Long issueId) {
            this.issueId = issueId;
        }

        public String getIssueTitle() {
            return issueTitle;
        }

        public void setIssueTitle(String issueTitle) {
            this.issueTitle = issueTitle;
        }

        public Integer getImageWidth() {
            return imageWidth;
        }

        public void setImageWidth(Integer imageWidth) {
            this.imageWidth = imageWidth;
        }

        public Integer getImageHeight() {
            return imageHeight;
        }

        public void setImageHeight(Integer imageHeight) {
            this.imageHeight = imageHeight;
        }

        public BigDecimal getAspectRatio() {
            return aspectRatio;
        }

        public void setAspectRatio(BigDecimal aspectRatio) {
            this.aspectRatio = aspectRatio;
        }

        public String getAuthorNickname() {
            return authorNickname;
        }

        public void setAuthorNickname(String authorNickname) {
            this.authorNickname = authorNickname;
        }

        public Long getAuthorId() {
            return authorId;
        }

        public void setAuthorId(Long authorId) {
            this.authorId = authorId;
        }
    }

    // Business methods
    public boolean isSubmissionValid() {
        return submission != null && "selected".equals(submission.getStatus());
    }

    // Getters and setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getGalleryConfigId() {
        return galleryConfigId;
    }

    public void setGalleryConfigId(Long galleryConfigId) {
        this.galleryConfigId = galleryConfigId;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public SubmissionDetailsDTO getSubmission() {
        return submission;
    }

    public void setSubmission(SubmissionDetailsDTO submission) {
        this.submission = submission;
    }
} 