package com.munichweekly.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Promotion configuration request DTO
 * Used for admin to update promotion configuration, field validation consistent with entity class
 */
public class PromotionConfigRequestDTO {

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
    @NotBlank(message = "Navigation title cannot be blank")
    @Size(max = 50, message = "Navigation title must be at most 50 characters")
    @JsonProperty("navTitle")
    private String navTitle;

    /**
     * Page URL path
     * Frontend field name: pageUrl
     */
    @NotBlank(message = "Page URL cannot be blank")
    @Size(max = 100, message = "Page URL must be at most 100 characters")
    @JsonProperty("pageUrl")
    private String pageUrl;

    /**
     * Promotion page description
     * Frontend field name: description
     */
    @Size(max = 1000, message = "Description must be at most 1000 characters")
    @JsonProperty("description")
    private String description;

    // Constructors
    public PromotionConfigRequestDTO() {}

    public PromotionConfigRequestDTO(Boolean isEnabled, String navTitle, String pageUrl) {
        this.isEnabled = isEnabled;
        this.navTitle = navTitle;
        this.pageUrl = pageUrl;
    }

    public PromotionConfigRequestDTO(Boolean isEnabled, String navTitle, String pageUrl, String description) {
        this.isEnabled = isEnabled;
        this.navTitle = navTitle;
        this.pageUrl = pageUrl;
        this.description = description;
    }

    // Getters and Setters
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
} 