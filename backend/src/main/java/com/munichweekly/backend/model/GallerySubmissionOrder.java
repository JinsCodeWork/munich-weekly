package com.munichweekly.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
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
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submission_id", nullable = false)
    @NotNull(message = "Submission is required")
    private Submission submission;

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
        return submission != null && "selected".equals(submission.getStatus());
    }

    /**
     * Get the submission's image URL for gallery display.
     */
    public String getImageUrl() {
        return submission != null ? submission.getImageUrl() : null;
    }

    /**
     * Get the submission's description.
     */
    public String getDescription() {
        return submission != null ? submission.getDescription() : null;
    }

    /**
     * Get the author's nickname from the submission.
     */
    public String getAuthorNickname() {
        return submission != null && submission.getUser() != null 
               ? submission.getUser().getNickname() : null;
    }

    /**
     * Check if this submission has dimension data for optimal display.
     */
    public boolean hasDimensionData() {
        return submission != null && submission.hasDimensionData();
    }

    /**
     * Get the aspect ratio for responsive display calculations.
     */
    public Double getAspectRatio() {
        return submission != null ? submission.getAspectRatioAsDouble() : null;
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