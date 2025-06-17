package com.munichweekly.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.munichweekly.backend.model.GalleryFeaturedConfig;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.Arrays;

/**
 * Gallery featured configuration DTO
 * Used for data transfer between frontend and backend
 */
public class GalleryFeaturedConfigDto {

    @JsonProperty("id")
    private Long id;

    /**
     * Featured submission ID array
     */
    @JsonProperty("submissionIds")
    @NotNull(message = "Submission IDs cannot be null")
    private Integer[] submissionIds;

    /**
     * Display order array
     */
    @JsonProperty("displayOrder")
    @NotNull(message = "Display order cannot be null")
    private Integer[] displayOrder;

    /**
     * Autoplay interval time (milliseconds)
     */
    @JsonProperty("autoplayInterval")
    @NotNull(message = "Autoplay interval cannot be null")
    @Min(value = 1000, message = "Autoplay interval must be at least 1000ms")
    @Max(value = 30000, message = "Autoplay interval must be at most 30000ms")
    private Integer autoplayInterval;

    /**
     * Whether this configuration is enabled
     */
    @JsonProperty("isActive")
    @NotNull(message = "IsActive status cannot be null")
    private Boolean isActive;

    /**
     * Configuration title
     */
    @JsonProperty("configTitle")
    @Size(max = 100, message = "Config title must be at most 100 characters")
    private String configTitle;

    /**
     * Configuration description
     */
    @JsonProperty("configDescription")
    private String configDescription;

    /**
     * Creation time
     */
    @JsonProperty("createdAt")
    private LocalDateTime createdAt;

    /**
     * Update time
     */
    @JsonProperty("updatedAt")
    private LocalDateTime updatedAt;

    /**
     * Creator user ID
     */
    @JsonProperty("createdByUserId")
    private Long createdByUserId;

    /**
     * Number of featured submissions (calculated field)
     */
    @JsonProperty("featuredCount")
    private Integer featuredCount;

    // Constructors
    public GalleryFeaturedConfigDto() {}

    public GalleryFeaturedConfigDto(Integer[] submissionIds, Integer[] displayOrder, 
                                   Integer autoplayInterval, Boolean isActive) {
        this.submissionIds = submissionIds;
        this.displayOrder = displayOrder;
        this.autoplayInterval = autoplayInterval;
        this.isActive = isActive;
        this.featuredCount = submissionIds != null ? submissionIds.length : 0;
    }

    /**
     * Create DTO from entity
     */
    public static GalleryFeaturedConfigDto fromEntity(GalleryFeaturedConfig entity) {
        if (entity == null) return null;

        GalleryFeaturedConfigDto dto = new GalleryFeaturedConfigDto();
        dto.setId(entity.getId());
        dto.setSubmissionIds(entity.getSubmissionIds());
        dto.setDisplayOrder(entity.getDisplayOrder());
        dto.setAutoplayInterval(entity.getAutoplayInterval());
        dto.setIsActive(entity.getIsActive());
        dto.setConfigTitle(entity.getConfigTitle());
        dto.setConfigDescription(entity.getConfigDescription());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        dto.setCreatedByUserId(entity.getCreatedByUserId());
        dto.setFeaturedCount(entity.getFeaturedCount());
        
        return dto;
    }

    /**
     * Convert to entity
     */
    public GalleryFeaturedConfig toEntity() {
        GalleryFeaturedConfig entity = new GalleryFeaturedConfig();
        entity.setId(this.id);
        entity.setSubmissionIds(this.submissionIds);
        entity.setDisplayOrder(this.displayOrder);
        entity.setAutoplayInterval(this.autoplayInterval);
        entity.setIsActive(this.isActive);
        entity.setConfigTitle(this.configTitle);
        entity.setConfigDescription(this.configDescription);
        entity.setCreatedByUserId(this.createdByUserId);
        
        if (this.createdAt != null) {
            entity.setCreatedAt(this.createdAt);
        }
        if (this.updatedAt != null) {
            entity.setUpdatedAt(this.updatedAt);
        }
        
        return entity;
    }

    /**
     * Validate array length consistency
     */
    public boolean isArrayLengthValid() {
        if (submissionIds == null && displayOrder == null) return true;
        if (submissionIds == null || displayOrder == null) return false;
        return submissionIds.length == displayOrder.length;
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
        // Update calculated field
        this.featuredCount = submissionIds != null ? submissionIds.length : 0;
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

    public Integer getFeaturedCount() {
        return featuredCount;
    }

    public void setFeaturedCount(Integer featuredCount) {
        this.featuredCount = featuredCount;
    }

    @Override
    public String toString() {
        return "GalleryFeaturedConfigDto{" +
                "id=" + id +
                ", configTitle='" + configTitle + '\'' +
                ", featuredCount=" + featuredCount +
                ", autoplayInterval=" + autoplayInterval +
                ", isActive=" + isActive +
                ", submissionIds=" + Arrays.toString(submissionIds) +
                ", displayOrder=" + Arrays.toString(displayOrder) +
                ", updatedAt=" + updatedAt +
                '}';
    }
} 