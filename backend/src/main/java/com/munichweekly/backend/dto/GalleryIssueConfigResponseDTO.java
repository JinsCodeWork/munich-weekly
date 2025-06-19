package com.munichweekly.backend.dto;

import com.munichweekly.backend.model.GalleryIssueConfig;
import com.munichweekly.backend.model.GallerySubmissionOrder;
import com.munichweekly.backend.model.Issue;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

/**
 * DTO for returning gallery issue configuration details.
 * Used for both public gallery display and admin management.
 */
public class GalleryIssueConfigResponseDTO {

    private Long id;
    private Long issueId;
    private String coverImageUrl;
    private Boolean isPublished;
    private Integer displayOrder;
    private String configTitle;
    private String configDescription;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int submissionCount;
    private boolean readyForPublication;

    // Issue details
    private IssueBasicDTO issue;

    // Submission orders (for admin management)
    private List<GallerySubmissionOrderResponseDTO> submissionOrders;

    // Creator information (for admin interface)
    private String createdByUserNickname;

    // Nested DTO for Issue information
    public static class IssueBasicDTO {
        private Long id;
        private String title;
        private String description;
        private LocalDateTime submissionStart;
        private LocalDateTime submissionEnd;
        private LocalDateTime votingStart;
        private LocalDateTime votingEnd;

        public IssueBasicDTO() {}

        public IssueBasicDTO(Issue issue) {
            this.id = issue.getId();
            this.title = issue.getTitle();
            this.description = issue.getDescription();
            this.submissionStart = issue.getSubmissionStart();
            this.submissionEnd = issue.getSubmissionEnd();
            this.votingStart = issue.getVotingStart();
            this.votingEnd = issue.getVotingEnd();
        }

        // Getters and setters
        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public LocalDateTime getSubmissionStart() {
            return submissionStart;
        }

        public void setSubmissionStart(LocalDateTime submissionStart) {
            this.submissionStart = submissionStart;
        }

        public LocalDateTime getSubmissionEnd() {
            return submissionEnd;
        }

        public void setSubmissionEnd(LocalDateTime submissionEnd) {
            this.submissionEnd = submissionEnd;
        }

        public LocalDateTime getVotingStart() {
            return votingStart;
        }

        public void setVotingStart(LocalDateTime votingStart) {
            this.votingStart = votingStart;
        }

        public LocalDateTime getVotingEnd() {
            return votingEnd;
        }

        public void setVotingEnd(LocalDateTime votingEnd) {
            this.votingEnd = votingEnd;
        }
    }

    // Constructors

    public GalleryIssueConfigResponseDTO() {}

    /**
     * Constructor that creates DTO from entity with lazy-loaded submission count.
     * IMPORTANT: This should not access config.getSubmissionOrders() due to lazy loading issues.
     */
    public GalleryIssueConfigResponseDTO(GalleryIssueConfig config) {
        this.id = config.getId();
        this.issueId = config.getIssue().getId();
        this.coverImageUrl = config.getCoverImageUrl();
        this.isPublished = config.getIsPublished();
        this.displayOrder = config.getDisplayOrder();
        this.configTitle = config.getConfigTitle();
        this.configDescription = config.getConfigDescription();
        this.createdAt = config.getCreatedAt();
        this.updatedAt = config.getUpdatedAt();
        
        // Set issue information
        if (config.getIssue() != null) {
            Issue issue = config.getIssue();
            this.issue = new IssueBasicDTO(issue);
        }
        
        // DO NOT access config.getSubmissionOrders() here - it causes LazyInitializationException
        // Use the overloaded constructor with explicit submission count instead
        this.submissionCount = 0; // Default value, should be overridden when count is known
        this.submissionOrders = new ArrayList<>();
    }

    /**
     * Constructor that creates DTO from entity with explicit submission count.
     * This avoids the lazy loading issue by accepting the count as a parameter.
     */
    public GalleryIssueConfigResponseDTO(GalleryIssueConfig config, long submissionCount) {
        this(config); // Call the main constructor
        this.submissionCount = (int) submissionCount; // Override with the provided count
    }

    // Methods for managing submission orders
    public void addSubmissionOrder(GallerySubmissionOrderResponseDTO submissionOrder) {
        if (this.submissionOrders == null) {
            this.submissionOrders = new ArrayList<>();
        }
        this.submissionOrders.add(submissionOrder);
    }

    /**
     * Set submission orders from a list of entities.
     * This method should be called separately when submission orders are explicitly loaded.
     */
    public void setSubmissionOrdersFromEntities(List<GallerySubmissionOrder> orders) {
        this.submissionOrders = new ArrayList<>();
        if (orders != null) {
            for (GallerySubmissionOrder order : orders) {
                this.submissionOrders.add(new GallerySubmissionOrderResponseDTO(order));
            }
            this.submissionCount = orders.size(); // Update count based on actual orders
        }
    }

    // Getters and setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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
        this.isPublished = isPublished;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
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

    public int getSubmissionCount() {
        return submissionCount;
    }

    public void setSubmissionCount(int submissionCount) {
        this.submissionCount = submissionCount;
    }

    public boolean isReadyForPublication() {
        return readyForPublication;
    }

    public void setReadyForPublication(boolean readyForPublication) {
        this.readyForPublication = readyForPublication;
    }

    public IssueBasicDTO getIssue() {
        return issue;
    }

    public void setIssue(IssueBasicDTO issue) {
        this.issue = issue;
    }

    public List<GallerySubmissionOrderResponseDTO> getSubmissionOrders() {
        return submissionOrders;
    }

    public void setSubmissionOrders(List<GallerySubmissionOrderResponseDTO> submissionOrders) {
        this.submissionOrders = submissionOrders;
        if (submissionOrders != null) {
            this.submissionCount = submissionOrders.size();
        }
    }

    public String getCreatedByUserNickname() {
        return createdByUserNickname;
    }

    public void setCreatedByUserNickname(String createdByUserNickname) {
        this.createdByUserNickname = createdByUserNickname;
    }
} 