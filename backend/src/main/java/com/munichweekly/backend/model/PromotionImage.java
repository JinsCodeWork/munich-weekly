package com.munichweekly.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

/**
 * Promotion image entity
 * Stores promotion page image information, reusing existing image dimension optimization features
 */
@Entity
@Table(name = "promotion_images")
public class PromotionImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Associated promotion configuration
     */
    @ManyToOne(optional = false)
    @JoinColumn(name = "promotion_config_id", nullable = false)
    private PromotionConfig promotionConfig;

    /**
     * Image URL
     * Format: /uploads/promotion/{promotionConfigId}/{imageId}_{timestamp}.{extension}
     */
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    /**
     * Image title
     */
    @Size(max = 200, message = "Image title must be at most 200 characters")
    @Column(name = "image_title", length = 200)
    private String imageTitle;

    /**
     * Image description
     */
    @Column(name = "image_description", columnDefinition = "TEXT")
    private String imageDescription;

    /**
     * Display order
     * Used for sequential display of images on promotion pages
     */
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    // **Reuse existing image dimension optimization fields**
    
    /**
     * Original image width (pixels)
     * Used for page layout calculations, avoiding repeated frontend image dimension fetching
     */
    @Column(name = "image_width")
    @Positive(message = "Image width must be positive")
    private Integer imageWidth;
    
    /**
     * Original image height (pixels)
     * Used for page layout calculations, avoiding repeated frontend image dimension fetching
     */
    @Column(name = "image_height")
    @Positive(message = "Image height must be positive")
    private Integer imageHeight;
    
    /**
     * Pre-calculated aspect ratio (width/height)
     * Used for efficient layout calculations and responsive design
     */
    @Column(name = "aspect_ratio", precision = 10, scale = 6)
    @DecimalMin(value = "0.1", message = "Aspect ratio must be at least 0.1")
    @DecimalMax(value = "10.0", message = "Aspect ratio must be at most 10.0")
    private BigDecimal aspectRatio;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Constructors
    public PromotionImage() {}

    public PromotionImage(PromotionConfig promotionConfig, String imageUrl, String imageTitle, 
                         String imageDescription, Integer displayOrder) {
        this.promotionConfig = promotionConfig;
        this.imageUrl = imageUrl;
        this.imageTitle = imageTitle;
        this.imageDescription = imageDescription;
        this.displayOrder = displayOrder;
        this.createdAt = LocalDateTime.now();
    }

    /**
     * Constructor with image dimensions
     * Automatically calculates aspect ratio
     */
    public PromotionImage(PromotionConfig promotionConfig, String imageUrl, String imageTitle, 
                         String imageDescription, Integer displayOrder,
                         Integer imageWidth, Integer imageHeight) {
        this(promotionConfig, imageUrl, imageTitle, imageDescription, displayOrder);
        // Set image dimensions and calculate aspect ratio
        if (imageWidth != null && imageHeight != null) {
            if (imageWidth <= 0 || imageHeight <= 0) {
                throw new IllegalArgumentException("Image dimensions must be positive");
            }
            this.imageWidth = imageWidth;
            this.imageHeight = imageHeight;
            this.aspectRatio = BigDecimal.valueOf((double) imageWidth / imageHeight)
                    .setScale(6, RoundingMode.HALF_UP);
        }
    }

    // **Image dimension related methods (reusing Submission design)**
    
    /**
     * Set image dimensions and automatically calculate aspect ratio
     */
    public void setImageDimensions(Integer width, Integer height) {
        if (width != null && height != null) {
            if (width <= 0 || height <= 0) {
                throw new IllegalArgumentException("Image dimensions must be positive");
            }
            this.imageWidth = width;
            this.imageHeight = height;
            this.aspectRatio = BigDecimal.valueOf((double) width / height)
                    .setScale(6, RoundingMode.HALF_UP);
        } else {
            // If any dimension is null, clear all dimension data
            this.imageWidth = null;
            this.imageHeight = null;
            this.aspectRatio = null;
        }
    }
    
    /**
     * Check if complete dimension data is available
     */
    public boolean hasDimensionData() {
        return imageWidth != null && imageHeight != null && aspectRatio != null;
    }
    
    /**
     * Get aspect ratio as double value
     */
    public Double getAspectRatioAsDouble() {
        return aspectRatio != null ? aspectRatio.doubleValue() : null;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public PromotionConfig getPromotionConfig() {
        return promotionConfig;
    }

    public void setPromotionConfig(PromotionConfig promotionConfig) {
        this.promotionConfig = promotionConfig;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getImageTitle() {
        return imageTitle;
    }

    public void setImageTitle(String imageTitle) {
        this.imageTitle = imageTitle;
    }

    public String getImageDescription() {
        return imageDescription;
    }

    public void setImageDescription(String imageDescription) {
        this.imageDescription = imageDescription;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public Integer getImageWidth() {
        return imageWidth;
    }

    public void setImageWidth(Integer imageWidth) {
        this.imageWidth = imageWidth;
    }

    public Integer getImageHeight() {
        return imageHeight;
    }

    public void setImageHeight(Integer imageHeight) {
        this.imageHeight = imageHeight;
    }

    public BigDecimal getAspectRatio() {
        return aspectRatio;
    }

    public void setAspectRatio(BigDecimal aspectRatio) {
        this.aspectRatio = aspectRatio;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
} 