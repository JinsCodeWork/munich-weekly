package com.munichweekly.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "submissions")
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private User user;

    @ManyToOne(optional = false)
    private Issue issue;

    private String imageUrl;

    @Column(length = 200)
    private String description;

    private Boolean isCover = false;

    // pending, approved, rejected, selected
    private String status = "pending";

    private LocalDateTime submittedAt = LocalDateTime.now();

    private LocalDateTime reviewedAt;
    
    // **NEW FIELDS: Image dimensions for masonry layout optimization**
    
    /**
     * Original image width in pixels
     * Used for masonry layout calculations to avoid frontend dimension fetching
     * Null for legacy submissions without dimension data
     */
    @Column(name = "image_width")
    @Positive(message = "Image width must be positive")
    private Integer imageWidth;
    
    /**
     * Original image height in pixels
     * Used for masonry layout calculations to avoid frontend dimension fetching
     * Null for legacy submissions without dimension data
     */
    @Column(name = "image_height")
    @Positive(message = "Image height must be positive")
    private Integer imageHeight;
    
    /**
     * Precomputed aspect ratio (width/height)
     * Used for efficient wide image detection in masonry layouts
     * Stored as decimal for precision and database indexing
     * Null for legacy submissions without dimension data
     */
    @Column(name = "aspect_ratio", precision = 10, scale = 6)
    @DecimalMin(value = "0.1", message = "Aspect ratio must be at least 0.1")
    @DecimalMax(value = "10.0", message = "Aspect ratio must be at most 10.0")
    private BigDecimal aspectRatio;

    public Submission() {}

    public Submission(User user, Issue issue, String imageUrl, String description) {
        this.user = user;
        this.issue = issue;
        this.imageUrl = imageUrl;
        this.description = description;
        this.status = "pending";
        this.submittedAt = LocalDateTime.now();
    }
    
    /**
     * Constructor with image dimensions for new submissions
     * Automatically calculates aspect ratio from width and height
     */
    public Submission(User user, Issue issue, String imageUrl, String description, 
                     Integer imageWidth, Integer imageHeight) {
        this(user, issue, imageUrl, description);
        this.setImageDimensions(imageWidth, imageHeight);
    }
    
    // **NEW METHODS: Image dimension handling**
    
    /**
     * Set image dimensions and automatically calculate aspect ratio
     * Ensures consistency between width, height, and aspect ratio
     * 
     * @param width  Image width in pixels (must be positive)
     * @param height Image height in pixels (must be positive)
     * @throws IllegalArgumentException if width or height is invalid
     */
    public void setImageDimensions(Integer width, Integer height) {
        if (width != null && height != null) {
            if (width <= 0 || height <= 0) {
                throw new IllegalArgumentException("Image dimensions must be positive");
            }
            this.imageWidth = width;
            this.imageHeight = height;
            this.aspectRatio = BigDecimal.valueOf((double) width / height)
                    .setScale(6, BigDecimal.ROUND_HALF_UP);
        } else {
            // If either dimension is null, clear all dimension data
            this.imageWidth = null;
            this.imageHeight = null;
            this.aspectRatio = null;
        }
    }
    
    /**
     * Check if this submission has complete dimension data
     * Used to determine whether to use stored dimensions or fetch dynamically
     * 
     * @return true if width, height, and aspect ratio are all available
     */
    public boolean hasDimensionData() {
        return imageWidth != null && imageHeight != null && aspectRatio != null;
    }
    
    /**
     * Check if this image is considered "wide" for masonry layout
     * Uses the standard 16:9 threshold (1.778 aspect ratio)
     * 
     * @return true if aspect ratio >= 16:9, false otherwise or if no dimension data
     */
    public boolean isWideImage() {
        if (aspectRatio == null) {
            return false;
        }
        return aspectRatio.compareTo(BigDecimal.valueOf(16.0 / 9.0)) >= 0;
    }
    
    /**
     * Get aspect ratio as double for calculations
     * 
     * @return aspect ratio as double, or null if no dimension data
     */
    public Double getAspectRatioAsDouble() {
        return aspectRatio != null ? aspectRatio.doubleValue() : null;
    }

    // Getters & setters ...

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Issue getIssue() {
        return issue;
    }

    public void setIssue(Issue issue) {
        this.issue = issue;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public Boolean getCover() {
        return isCover;
    }

    public void setCover(Boolean cover) {
        isCover = cover;
    }
    
    // **NEW GETTERS AND SETTERS: Image dimensions**
    
    public Integer getImageWidth() {
        return imageWidth;
    }
    
    public void setImageWidth(Integer imageWidth) {
        this.imageWidth = imageWidth;
        // Recalculate aspect ratio if both dimensions are available
        if (imageWidth != null && imageHeight != null) {
            this.aspectRatio = BigDecimal.valueOf((double) imageWidth / imageHeight)
                    .setScale(6, BigDecimal.ROUND_HALF_UP);
        }
    }
    
    public Integer getImageHeight() {
        return imageHeight;
    }
    
    public void setImageHeight(Integer imageHeight) {
        this.imageHeight = imageHeight;
        // Recalculate aspect ratio if both dimensions are available
        if (imageWidth != null && imageHeight != null) {
            this.aspectRatio = BigDecimal.valueOf((double) imageWidth / imageHeight)
                    .setScale(6, BigDecimal.ROUND_HALF_UP);
        }
    }
    
    public BigDecimal getAspectRatio() {
        return aspectRatio;
    }
    
    public void setAspectRatio(BigDecimal aspectRatio) {
        this.aspectRatio = aspectRatio;
    }
}