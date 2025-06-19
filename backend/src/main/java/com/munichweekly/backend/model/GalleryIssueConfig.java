package com.munichweekly.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing gallery issue configuration.
 * Manages the display of issues in the public gallery with cover images and publication status.
 */
@Entity
@Table(name = "gallery_issue_config")
public class GalleryIssueConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Reference to the issue being configured for gallery display.
     * Each issue can only have one gallery configuration.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "issue_id", nullable = false, unique = true)
    @NotNull(message = "Issue is required")
    private Issue issue;

    /**
     * Cover image URL for the issue.
     * This is separate from submission images and is uploaded by administrators.
     */
    @Column(name = "cover_image_url", length = 500)
    @Size(max = 500, message = "Cover image URL must be at most 500 characters")
    private String coverImageUrl;

    /**
     * Whether this issue is published and visible in the public gallery.
     */
    @Column(name = "is_published", nullable = false)
    @NotNull
    private Boolean isPublished = false;

    /**
     * Display order for issue list in the gallery.
     * Lower numbers appear first.
     */
    @Column(name = "display_order", nullable = false)
    @NotNull
    private Integer displayOrder = 0;

    /**
     * Configuration title for admin interface display.
     */
    @Column(name = "config_title", length = 200)
    @Size(max = 200, message = "Config title must be at most 200 characters")
    private String configTitle;

    /**
     * Optional description for admin interface.
     */
    @Column(name = "config_description", columnDefinition = "TEXT")
    private String configDescription;

    /**
     * Timestamp when the configuration was created.
     */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    /**
     * Timestamp when the configuration was last updated.
     * Automatically updated by database trigger.
     */
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    /**
     * Reference to the user who created this configuration.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdByUser;

    /**
     * List of submission orders for this gallery configuration.
     * Represents the ordered list of selected submissions within this issue.
     */
    @OneToMany(mappedBy = "galleryConfig", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC")
    private List<GallerySubmissionOrder> submissionOrders = new ArrayList<>();

    // Constructors

    public GalleryIssueConfig() {}

    public GalleryIssueConfig(Issue issue, User createdByUser) {
        this.issue = issue;
        this.createdByUser = createdByUser;
        this.configTitle = "Gallery Config for " + issue.getTitle();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public GalleryIssueConfig(Issue issue, String coverImageUrl, Boolean isPublished, 
                             Integer displayOrder, User createdByUser) {
        this(issue, createdByUser);
        this.coverImageUrl = coverImageUrl;
        this.isPublished = isPublished != null ? isPublished : false;
        this.displayOrder = displayOrder != null ? displayOrder : 0;
    }

    // Business methods

    /**
     * Check if this gallery configuration is ready for publication.
     * A configuration is ready if it has a cover image and at least one ordered submission.
     */
    public boolean isReadyForPublication() {
        return coverImageUrl != null && !coverImageUrl.trim().isEmpty() 
               && !submissionOrders.isEmpty();
    }

    /**
     * Get the count of submissions in this gallery configuration.
     */
    public int getSubmissionCount() {
        return submissionOrders != null ? submissionOrders.size() : 0;
    }

    /**
     * Add a submission order to this gallery configuration.
     * The display order will be automatically set to the next available order.
     */
    public void addSubmissionOrder(GallerySubmissionOrder submissionOrder) {
        if (submissionOrders == null) {
            submissionOrders = new ArrayList<>();
        }
        submissionOrder.setGalleryConfig(this);
        submissionOrders.add(submissionOrder);
    }

    /**
     * Remove a submission order from this gallery configuration.
     */
    public void removeSubmissionOrder(GallerySubmissionOrder submissionOrder) {
        if (submissionOrders != null) {
            submissionOrders.remove(submissionOrder);
            submissionOrder.setGalleryConfig(null);
        }
    }

    /**
     * Clear all submission orders from this gallery configuration.
     */
    public void clearSubmissionOrders() {
        if (submissionOrders != null) {
            submissionOrders.forEach(order -> order.setGalleryConfig(null));
            submissionOrders.clear();
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

    public Issue getIssue() {
        return issue;
    }

    public void setIssue(Issue issue) {
        this.issue = issue;
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

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder != null ? displayOrder : 0;
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

    public User getCreatedByUser() {
        return createdByUser;
    }

    public void setCreatedByUser(User createdByUser) {
        this.createdByUser = createdByUser;
    }

    public List<GallerySubmissionOrder> getSubmissionOrders() {
        return submissionOrders;
    }

    public void setSubmissionOrders(List<GallerySubmissionOrder> submissionOrders) {
        this.submissionOrders = submissionOrders != null ? submissionOrders : new ArrayList<>();
    }
} 