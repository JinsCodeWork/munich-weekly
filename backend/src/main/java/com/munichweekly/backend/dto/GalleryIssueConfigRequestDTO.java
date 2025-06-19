package com.munichweekly.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import java.util.List;

/**
 * DTO for creating and updating gallery issue configurations.
 * Used for admin operations to configure gallery displays.
 */
public class GalleryIssueConfigRequestDTO {

    /**
     * The issue ID to be configured for gallery display.
     * Required for creating new configurations.
     */
    @NotNull(message = "Issue ID is required")
    private Long issueId;

    /**
     * Cover image URL for the issue.
     * Optional - can be uploaded separately.
     */
    @Size(max = 500, message = "Cover image URL must be at most 500 characters")
    private String coverImageUrl;

    /**
     * Whether this issue should be published in the gallery.
     */
    private Boolean isPublished = false;



    /**
     * Configuration title for admin interface.
     * If not provided, will be auto-generated from issue title.
     */
    @Size(max = 200, message = "Config title must be at most 200 characters")
    private String configTitle;

    /**
     * Optional description for admin interface.
     */
    private String configDescription;

    /**
     * List of submission IDs and their display orders.
     * Used for setting up the initial submission order.
     */
    private List<SubmissionOrderRequestDTO> submissionOrders;

    // Constructors

    public GalleryIssueConfigRequestDTO() {}

    public GalleryIssueConfigRequestDTO(Long issueId, String coverImageUrl, Boolean isPublished,
                                       String configTitle, String configDescription) {
        this.issueId = issueId;
        this.coverImageUrl = coverImageUrl;
        this.isPublished = isPublished != null ? isPublished : false;
        this.configTitle = configTitle;
        this.configDescription = configDescription;
    }

    // Nested DTO for submission order requests
    public static class SubmissionOrderRequestDTO {
        @NotNull(message = "Submission ID is required")
        private Long submissionId;

        @NotNull(message = "Display order is required")
        @Min(value = 1, message = "Display order must be positive")
        private Integer displayOrder;

        public SubmissionOrderRequestDTO() {}

        public SubmissionOrderRequestDTO(Long submissionId, Integer displayOrder) {
            this.submissionId = submissionId;
            this.displayOrder = displayOrder;
        }

        // Getters and setters
        public Long getSubmissionId() {
            return submissionId;
        }

        public void setSubmissionId(Long submissionId) {
            this.submissionId = submissionId;
        }

        public Integer getDisplayOrder() {
            return displayOrder;
        }

        public void setDisplayOrder(Integer displayOrder) {
            this.displayOrder = displayOrder;
        }
    }

    // Getters and setters

    public Long getIssueId() {
        return issueId;
    }

    public void setIssueId(Long issueId) {
        this.issueId = issueId;
    }

    public String getCoverImageUrl() {
        return coverImageUrl;
    }

    public void setCoverImageUrl(String coverImageUrl) {
        this.coverImageUrl = coverImageUrl;
    }

    public Boolean getIsPublished() {
        return isPublished;
    }

    public void setIsPublished(Boolean isPublished) {
        this.isPublished = isPublished != null ? isPublished : false;
    }



    public String getConfigTitle() {
        return configTitle;
    }

    public void setConfigTitle(String configTitle) {
        this.configTitle = configTitle;
    }

    public String getConfigDescription() {
        return configDescription;
    }

    public void setConfigDescription(String configDescription) {
        this.configDescription = configDescription;
    }

    public List<SubmissionOrderRequestDTO> getSubmissionOrders() {
        return submissionOrders;
    }

    public void setSubmissionOrders(List<SubmissionOrderRequestDTO> submissionOrders) {
        this.submissionOrders = submissionOrders;
    }
} 