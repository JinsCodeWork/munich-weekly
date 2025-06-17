package com.munichweekly.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

/**
 * Promotion configuration entity
 * Manages global settings for promotion features, including enable status, navigation title, and page URL
 */
@Entity
@Table(name = "promotion_config")
public class PromotionConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Whether promotion feature is enabled
     * true: promotion feature enabled, navigation shows promotion link
     * false: promotion feature disabled, navigation hides promotion link
     */
    @Column(name = "is_enabled", nullable = false)
    private Boolean isEnabled = false;

    /**
     * Navigation bar display name
     * Examples: "Special Event", "Christmas Sale", "Photo Contest"
     */
    @NotBlank(message = "Navigation title cannot be blank")
    @Size(max = 50, message = "Navigation title must be at most 50 characters")
    @Column(name = "nav_title", length = 50)
    private String navTitle;

    /**
     * Promotion page URL path (without domain)
     * Examples: "christmas-2024", "photo-contest", "special-event"
     * Will be used to generate route /{pageUrl}
     */
    @Size(max = 100, message = "Page URL must be at most 100 characters")
    @Column(name = "page_url", length = 100, unique = true)
    private String pageUrl;

    /**
     * Promotion page description
     * Displayed below the title on the promotion page
     * Examples: "Join our annual photo contest...", "Celebrate Christmas with us..."
     */
    @Size(max = 1000, message = "Description must be at most 1000 characters")
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Constructors
    public PromotionConfig() {}

    public PromotionConfig(Boolean isEnabled, String navTitle, String pageUrl) {
        this.isEnabled = isEnabled;
        this.navTitle = navTitle;
        this.pageUrl = pageUrl;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public PromotionConfig(Boolean isEnabled, String navTitle, String pageUrl, String description) {
        this.isEnabled = isEnabled;
        this.navTitle = navTitle;
        this.pageUrl = pageUrl;
        this.description = description;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // JPA lifecycle callback to update the updatedAt field
    @PreUpdate
    private void preUpdate() {
        this.updatedAt = LocalDateTime.now();
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