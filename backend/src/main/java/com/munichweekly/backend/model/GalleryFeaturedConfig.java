package com.munichweekly.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

/**
 * Gallery featured configuration entity class
 * Manages the configuration for featured submissions carousel display on Gallery page
 */
@Entity
@Table(name = "gallery_featured_config")
public class GalleryFeaturedConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Featured submission ID array
     * Stores submission IDs to be displayed in the carousel
     */
    @Column(name = "submission_ids", columnDefinition = "INTEGER[]")
    @NotNull
    private Integer[] submissionIds = new Integer[]{};

    /**
     * Display order array
     * Corresponds to submissionIds, controls the display order
     */
    @Column(name = "display_order", columnDefinition = "INTEGER[]")
    @NotNull
    private Integer[] displayOrder = new Integer[]{};

    /**
     * Autoplay interval time (milliseconds)
     * Range: 1000-30000 milliseconds
     */
    @Column(name = "autoplay_interval", nullable = false)
    @NotNull
    @Min(value = 1000, message = "Autoplay interval must be at least 1000ms")
    @Max(value = 30000, message = "Autoplay interval must be at most 30000ms")
    private Integer autoplayInterval = 5000;

    /**
     * Whether this configuration is enabled
     * Only enabled configurations will be displayed on the frontend
     */
    @Column(name = "is_active", nullable = false)
    @NotNull
    private Boolean isActive = true;

    /**
     * Configuration title
     * Used to distinguish different configurations in the admin interface
     */
    @Column(name = "config_title", length = 100)
    @Size(max = 100, message = "Config title must be at most 100 characters")
    private String configTitle = "Default Gallery Featured Config";

    /**
     * Configuration description
     * Used to explain the purpose of the configuration in the admin interface
     */
    @Column(name = "config_description", columnDefinition = "TEXT")
    private String configDescription;

    /**
     * Creation time
     */
    @Column(name = "created_at", nullable = false)
    @NotNull
    private LocalDateTime createdAt = LocalDateTime.now();

    /**
     * Update time
     */
    @Column(name = "updated_at", nullable = false)
    @NotNull
    private LocalDateTime updatedAt = LocalDateTime.now();

    /**
     * Creator user ID
     * References the users table
     */
    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    // JPA lifecycle callbacks
    @PreUpdate
    private void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    private void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        this.updatedAt = LocalDateTime.now();
    }

    // Constructors
    public GalleryFeaturedConfig() {}

    public GalleryFeaturedConfig(String configTitle, String configDescription) {
        this.configTitle = configTitle;
        this.configDescription = configDescription;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public GalleryFeaturedConfig(Integer[] submissionIds, Integer[] displayOrder, 
                                Integer autoplayInterval, String configTitle) {
        this.submissionIds = submissionIds;
        this.displayOrder = displayOrder;
        this.autoplayInterval = autoplayInterval;
        this.configTitle = configTitle;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Business logic methods

    /**
     * Validate array length consistency
     */
    public boolean isArrayLengthValid() {
        if (submissionIds == null && displayOrder == null) return true;
        if (submissionIds == null || displayOrder == null) return false;
        return submissionIds.length == displayOrder.length;
    }

    /**
     * Get the number of featured submissions
     */
    public int getFeaturedCount() {
        return submissionIds != null ? submissionIds.length : 0;
    }

    /**
     * Check if it contains a specific submission ID
     */
    public boolean containsSubmissionId(Integer submissionId) {
        if (submissionIds == null || submissionId == null) return false;
        for (Integer id : submissionIds) {
            if (submissionId.equals(id)) return true;
        }
        return false;
    }

    /**
     * Get the display order for a specified submission ID
     */
    public Integer getDisplayOrderForSubmission(Integer submissionId) {
        if (submissionIds == null || displayOrder == null || submissionId == null) return null;
        for (int i = 0; i < submissionIds.length; i++) {
            if (submissionId.equals(submissionIds[i])) {
                return i < displayOrder.length ? displayOrder[i] : null;
            }
        }
        return null;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer[] getSubmissionIds() {
        return submissionIds;
    }

    public void setSubmissionIds(Integer[] submissionIds) {
        this.submissionIds = submissionIds;
    }

    public Integer[] getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer[] displayOrder) {
        this.displayOrder = displayOrder;
    }

    public Integer getAutoplayInterval() {
        return autoplayInterval;
    }

    public void setAutoplayInterval(Integer autoplayInterval) {
        this.autoplayInterval = autoplayInterval;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
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

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
    }

    @Override
    public String toString() {
        return "GalleryFeaturedConfig{" +
                "id=" + id +
                ", configTitle='" + configTitle + '\'' +
                ", featuredCount=" + getFeaturedCount() +
                ", autoplayInterval=" + autoplayInterval +
                ", isActive=" + isActive +
                ", updatedAt=" + updatedAt +
                '}';
    }
} 