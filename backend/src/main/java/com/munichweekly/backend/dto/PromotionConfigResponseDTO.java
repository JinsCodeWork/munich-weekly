package com.munichweekly.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.munichweekly.backend.model.PromotionConfig;

/**
 * Promotion configuration response DTO
 * Used to return promotion configuration information to frontend, field naming strictly consistent with frontend
 */
public class PromotionConfigResponseDTO {

    /**
     * Configuration ID
     */
    @JsonProperty("id")
    private Long id;

    /**
     * Whether promotion is enabled
     * Frontend field name: isEnabled
     */
    @JsonProperty("isEnabled")
    private Boolean isEnabled;

    /**
     * Navigation bar display name
     * Frontend field name: navTitle
     */
    @JsonProperty("navTitle")
    private String navTitle;

    /**
     * Page URL path
     * Frontend field name: pageUrl
     */
    @JsonProperty("pageUrl")
    private String pageUrl;

    /**
     * Promotion page description
     * Frontend field name: description
     */
    @JsonProperty("description")
    private String description;

    /**
     * Creation time (ISO format string)
     * Frontend field name: createdAt
     */
    @JsonProperty("createdAt")
    private String createdAt;

    /**
     * Update time (ISO format string)
     * Frontend field name: updatedAt
     */
    @JsonProperty("updatedAt")
    private String updatedAt;

    // Constructors
    public PromotionConfigResponseDTO() {}

    /**
     * Create DTO from PromotionConfig entity
     */
    public PromotionConfigResponseDTO(PromotionConfig promotionConfig) {
        this.id = promotionConfig.getId();
        this.isEnabled = promotionConfig.getIsEnabled();
        this.navTitle = promotionConfig.getNavTitle();
        this.pageUrl = promotionConfig.getPageUrl();
        this.description = promotionConfig.getDescription();
        this.createdAt = promotionConfig.getCreatedAt() != null 
            ? promotionConfig.getCreatedAt().toString() 
            : null;
        this.updatedAt = promotionConfig.getUpdatedAt() != null 
            ? promotionConfig.getUpdatedAt().toString() 
            : null;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Boolean getIsEnabled() {
        return isEnabled;
    }

    public void setIsEnabled(Boolean isEnabled) {
        this.isEnabled = isEnabled;
    }

    public String getNavTitle() {
        return navTitle;
    }

    public void setNavTitle(String navTitle) {
        this.navTitle = navTitle;
    }

    public String getPageUrl() {
        return pageUrl;
    }

    public void setPageUrl(String pageUrl) {
        this.pageUrl = pageUrl;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
} 