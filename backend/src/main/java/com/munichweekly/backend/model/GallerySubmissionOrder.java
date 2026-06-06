package com.munichweekly.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

/**
 * Entity representing the display order of submissions within a gallery issue.
 * Controls how selected submissions are ordered when displayed in the gallery.
 */
@Entity
@Table(name = "gallery_submission_order")
public class GallerySubmissionOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Reference to the gallery issue configuration.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "gallery_config_id", nullable = false)
    @NotNull(message = "Gallery configuration is required")
    private GalleryIssueConfig galleryConfig;

    /**
     * Reference to the submission being ordered.
     * Must have status = 'selected' to be valid.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id")
    private Submission submission;

    /**
     * Type of gallery item. SUBMISSION points to a real user submission, while
     * CUSTOM_IMAGE stores administrator-managed image metadata on this row.
     */
    @Column(name = "item_type", length = 30, columnDefinition = "varchar(30) default 'SUBMISSION'")
    private String itemType = "SUBMISSION";

    @Column(name = "custom_image_url", length = 500)
    private String customImageUrl;

    @Column(name = "custom_title", length = 200)
    private String customTitle;

    @Column(name = "custom_description", columnDefinition = "TEXT")
    private String customDescription;

    @Column(name = "custom_image_width")
    private Integer customImageWidth;

    @Column(name = "custom_image_height")
    private Integer customImageHeight;

    @Column(name = "custom_aspect_ratio", precision = 10, scale = 6)
    private BigDecimal customAspectRatio;

    /**
     * Display order within the issue (1-based).
     * Lower numbers appear first in the gallery.
     */
    @Column(name = "display_order", nullable = false)
    @NotNull(message = "Display order is required")
    @Positive(message = "Display order must be positive")
    private Integer displayOrder;

    /**
     * Timestamp when this order was created.
     */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    /**
     * Timestamp when this order was last updated.
     * Automatically updated by database trigger.
     */
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Constructors

    public GallerySubmissionOrder() {}

    public GallerySubmissionOrder(GalleryIssueConfig galleryConfig, Submission submission, Integer displayOrder) {
        this.galleryConfig = galleryConfig;
        this.submission = submission;
        this.itemType = "SUBMISSION";
        this.displayOrder = displayOrder;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public GallerySubmissionOrder(GalleryIssueConfig galleryConfig, String customImageUrl, String customTitle,
                                  String customDescription, Integer imageWidth, Integer imageHeight,
                                  Integer displayOrder) {
        this.galleryConfig = galleryConfig;
        this.itemType = "CUSTOM_IMAGE";
        this.customImageUrl = customImageUrl;
        this.customTitle = customTitle;
        this.customDescription = customDescription;
        setCustomImageDimensions(imageWidth, imageHeight);
        this.displayOrder = displayOrder;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Business methods

    /**
     * Check if the submission is valid for gallery display.
     * The submission must have status 'selected' to be displayable in the gallery.
     */
    public boolean isSubmissionValid() {
        return isCustomImage() || (submission != null && "selected".equals(submission.getStatus()));
    }

    /**
     * Get the submission's image URL for gallery display.
     */
    public String getImageUrl() {
        return isCustomImage() ? customImageUrl : (submission != null ? submission.getImageUrl() : null);
    }

    /**
     * Get the submission's description.
     */
    public String getDescription() {
        return isCustomImage() ? customDescription : (submission != null ? submission.getDescription() : null);
    }

    /**
     * Get the author's nickname from the submission.
     */
    public String getAuthorNickname() {
        if (isCustomImage()) {
            return null;
        }
        return submission != null && submission.getUser() != null
               ? submission.getUser().getNickname() : null;
    }

    /**
     * Check if this submission has dimension data for optimal display.
     */
    public boolean hasDimensionData() {
        if (isCustomImage()) {
            return customImageWidth != null && customImageHeight != null && customAspectRatio != null;
        }
        return submission != null && submission.hasDimensionData();
    }

    /**
     * Get the aspect ratio for responsive display calculations.
     */
    public Double getAspectRatio() {
        if (isCustomImage()) {
            return customAspectRatio != null ? customAspectRatio.doubleValue() : null;
        }
        return submission != null ? submission.getAspectRatioAsDouble() : null;
    }

    public boolean isCustomImage() {
        return "CUSTOM_IMAGE".equals(itemType);
    }

    public boolean isSubmissionItem() {
        return itemType == null || "SUBMISSION".equals(itemType);
    }

    public void setCustomImageDimensions(Integer width, Integer height) {
        if (width != null && height != null) {
            if (width <= 0 || height <= 0) {
                throw new IllegalArgumentException("Image dimensions must be positive");
            }
            this.customImageWidth = width;
            this.customImageHeight = height;
            this.customAspectRatio = BigDecimal.valueOf((double) width / height)
                    .setScale(6, RoundingMode.HALF_UP);
        } else {
            this.customImageWidth = null;
            this.customImageHeight = null;
            this.customAspectRatio = null;
        }
    }

    // JPA lifecycle callbacks

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public GalleryIssueConfig getGalleryConfig() {
        return galleryConfig;
    }

    public void setGalleryConfig(GalleryIssueConfig galleryConfig) {
        this.galleryConfig = galleryConfig;
    }

    public Submission getSubmission() {
        return submission;
    }

    public void setSubmission(Submission submission) {
        this.submission = submission;
    }

    public String getItemType() {
        return itemType != null ? itemType : "SUBMISSION";
    }

    public void setItemType(String itemType) {
        this.itemType = itemType != null ? itemType : "SUBMISSION";
    }

    public String getCustomImageUrl() {
        return customImageUrl;
    }

    public void setCustomImageUrl(String customImageUrl) {
        this.customImageUrl = customImageUrl;
    }

    public String getCustomTitle() {
        return customTitle;
    }

    public void setCustomTitle(String customTitle) {
        this.customTitle = customTitle;
    }

    public String getCustomDescription() {
        return customDescription;
    }

    public void setCustomDescription(String customDescription) {
        this.customDescription = customDescription;
    }

    public Integer getCustomImageWidth() {
        return customImageWidth;
    }

    public void setCustomImageWidth(Integer customImageWidth) {
        this.customImageWidth = customImageWidth;
        if (customImageWidth != null && customImageHeight != null) {
            this.customAspectRatio = BigDecimal.valueOf((double) customImageWidth / customImageHeight)
                    .setScale(6, RoundingMode.HALF_UP);
        }
    }

    public Integer getCustomImageHeight() {
        return customImageHeight;
    }

    public void setCustomImageHeight(Integer customImageHeight) {
        this.customImageHeight = customImageHeight;
        if (customImageWidth != null && customImageHeight != null) {
            this.customAspectRatio = BigDecimal.valueOf((double) customImageWidth / customImageHeight)
                    .setScale(6, RoundingMode.HALF_UP);
        }
    }

    public BigDecimal getCustomAspectRatio() {
        return customAspectRatio;
    }

    public void setCustomAspectRatio(BigDecimal customAspectRatio) {
        this.customAspectRatio = customAspectRatio;
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
}
