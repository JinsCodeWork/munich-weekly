package com.munichweekly.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.munichweekly.backend.model.Submission;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Featured submission DTO
 * Used for submission information in Gallery carousel display
 */
public class FeaturedSubmissionDto {

    @JsonProperty("id")
    private Long id;

    /**
     * Image URL
     */
    @JsonProperty("imageUrl")
    private String imageUrl;

    /**
     * Thumbnail URL (for list display)
     */
    @JsonProperty("thumbnailUrl")
    private String thumbnailUrl;

    /**
     * Submission description
     */
    @JsonProperty("description")
    private String description;

    /**
     * Submission title (optional)
     */
    @JsonProperty("title")
    private String title;

    /**
     * Author name
     */
    @JsonProperty("authorName")
    private String authorName;

    /**
     * Author ID
     */
    @JsonProperty("authorId")
    private Long authorId;

    /**
     * Issue title
     */
    @JsonProperty("issueTitle")
    private String issueTitle;

    /**
     * Issue ID
     */
    @JsonProperty("issueId")
    private Long issueId;

    /**
     * Image width
     */
    @JsonProperty("imageWidth")
    private Integer imageWidth;

    /**
     * Image height
     */
    @JsonProperty("imageHeight")
    private Integer imageHeight;

    /**
     * Aspect ratio
     */
    @JsonProperty("aspectRatio")
    private BigDecimal aspectRatio;

    /**
     * Submission status
     */
    @JsonProperty("status")
    private String status;

    /**
     * Whether it is a cover submission
     */
    @JsonProperty("isCover")
    private Boolean isCover;

    /**
     * Submission time
     */
    @JsonProperty("submittedAt")
    private LocalDateTime submittedAt;

    /**
     * Review time
     */
    @JsonProperty("reviewedAt")
    private LocalDateTime reviewedAt;

    /**
     * Display order in carousel
     */
    @JsonProperty("displayOrder")
    private Integer displayOrder;

    // Constructors
    public FeaturedSubmissionDto() {}

    public FeaturedSubmissionDto(Long id, String imageUrl, String description, 
                               String authorName, String issueTitle) {
        this.id = id;
        this.imageUrl = imageUrl;
        this.description = description;
        this.authorName = authorName;
        this.issueTitle = issueTitle;
    }

    /**
     * Create DTO from Submission entity
     */
    public static FeaturedSubmissionDto fromSubmission(Submission submission, Integer displayOrder) {
        if (submission == null) return null;

        FeaturedSubmissionDto dto = new FeaturedSubmissionDto();
        dto.setId(submission.getId());
        dto.setImageUrl(submission.getImageUrl());
        dto.setDescription(submission.getDescription());
        dto.setStatus(submission.getStatus());
        dto.setIsCover(submission.getCover());
        dto.setSubmittedAt(submission.getSubmittedAt());
        dto.setReviewedAt(submission.getReviewedAt());
        dto.setDisplayOrder(displayOrder);

        // Image dimension information
        dto.setImageWidth(submission.getImageWidth());
        dto.setImageHeight(submission.getImageHeight());
        dto.setAspectRatio(submission.getAspectRatio());

        // Author information
        if (submission.getUser() != null) {
            dto.setAuthorName(submission.getUser().getNickname());
            dto.setAuthorId(submission.getUser().getId());
        }

        // Issue information
        if (submission.getIssue() != null) {
            dto.setIssueTitle(submission.getIssue().getTitle());
            dto.setIssueId(submission.getIssue().getId());
        }

        // Generate thumbnail URL (based on original image URL)
        dto.setThumbnailUrl(generateThumbnailUrl(submission.getImageUrl()));

        return dto;
    }

    /**
     * Create DTO from Submission entity (without display order)
     */
    public static FeaturedSubmissionDto fromSubmission(Submission submission) {
        return fromSubmission(submission, null);
    }

    /**
     * Generate thumbnail URL
     * Generate thumbnail version based on original image URL
     */
    private static String generateThumbnailUrl(String originalUrl) {
        if (originalUrl == null || originalUrl.isEmpty()) {
            return originalUrl;
        }

        // If it's a CDN URL, add thumbnail parameters
        if (originalUrl.contains("munichweekly.art") || originalUrl.contains("cloudflare")) {
            // Add Cloudflare Image Resizing parameters
            if (originalUrl.contains("?")) {
                return originalUrl + "&width=400&height=300&fit=cover&quality=85";
            } else {
                return originalUrl + "?width=400&height=300&fit=cover&quality=85";
            }
        }

        // For local images, return original URL (frontend handles scaling)
        return originalUrl;
    }

    /**
     * Check if it is a wide image (suitable for cross-column display)
     */
    public boolean isWideImage() {
        if (aspectRatio == null) return false;
        // Aspect ratio >= 1.6 is considered wide image
        return aspectRatio.compareTo(BigDecimal.valueOf(1.6)) >= 0;
    }

    /**
     * Get image dimension description
     */
    public String getDimensionDescription() {
        if (imageWidth == null || imageHeight == null) {
            return "Unknown dimensions";
        }
        return imageWidth + "×" + imageHeight;
    }

    // Getters and Setters
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

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getAuthorName() {
        return authorName;
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }

    public Long getAuthorId() {
        return authorId;
    }

    public void setAuthorId(Long authorId) {
        this.authorId = authorId;
    }

    public String getIssueTitle() {
        return issueTitle;
    }

    public void setIssueTitle(String issueTitle) {
        this.issueTitle = issueTitle;
    }

    public Long getIssueId() {
        return issueId;
    }

    public void setIssueId(Long issueId) {
        this.issueId = issueId;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getIsCover() {
        return isCover;
    }

    public void setIsCover(Boolean isCover) {
        this.isCover = isCover;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    @Override
    public String toString() {
        return "FeaturedSubmissionDto{" +
                "id=" + id +
                ", authorName='" + authorName + '\'' +
                ", issueTitle='" + issueTitle + '\'' +
                ", displayOrder=" + displayOrder +
                ", aspectRatio=" + aspectRatio +
                ", status='" + status + '\'' +
                '}';
    }
} 