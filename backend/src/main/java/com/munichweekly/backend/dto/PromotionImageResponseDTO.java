package com.munichweekly.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.munichweekly.backend.model.PromotionImage;

/**
 * Promotion image response DTO
 * Used to return promotion image information to frontend, including image dimension optimization fields
 */
public class PromotionImageResponseDTO {

    /**
     * Image ID
     */
    @JsonProperty("id")
    private Long id;

    /**
     * Image URL
     * Frontend field name: imageUrl
     */
    @JsonProperty("imageUrl")
    private String imageUrl;

    /**
     * Image title
     * Frontend field name: imageTitle
     */
    @JsonProperty("imageTitle")
    private String imageTitle;

    /**
     * Image description
     * Frontend field name: imageDescription
     */
    @JsonProperty("imageDescription")
    private String imageDescription;

    /**
     * Display order
     * Frontend field name: displayOrder
     */
    @JsonProperty("displayOrder")
    private Integer displayOrder;

    /**
     * Image width (pixels)
     * Frontend field name: imageWidth
     */
    @JsonProperty("imageWidth")
    private Integer imageWidth;

    /**
     * Image height (pixels)
     * Frontend field name: imageHeight
     */
    @JsonProperty("imageHeight")
    private Integer imageHeight;

    /**
     * Aspect ratio
     * Frontend field name: aspectRatio
     */
    @JsonProperty("aspectRatio")
    private Double aspectRatio;

    /**
     * Creation time
     * Frontend field name: createdAt
     */
    @JsonProperty("createdAt")
    private String createdAt;

    // Constructors
    public PromotionImageResponseDTO() {}

    /**
     * Create DTO from PromotionImage entity
     */
    public PromotionImageResponseDTO(PromotionImage promotionImage) {
        this.id = promotionImage.getId();
        this.imageUrl = promotionImage.getImageUrl();
        this.imageTitle = promotionImage.getImageTitle();
        this.imageDescription = promotionImage.getImageDescription();
        this.displayOrder = promotionImage.getDisplayOrder();
        this.imageWidth = promotionImage.getImageWidth();
        this.imageHeight = promotionImage.getImageHeight();
        this.aspectRatio = promotionImage.getAspectRatioAsDouble();
        this.createdAt = promotionImage.getCreatedAt() != null 
            ? promotionImage.getCreatedAt().toString() 
            : null;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Double getAspectRatio() {
        return aspectRatio;
    }

    public void setAspectRatio(Double aspectRatio) {
        this.aspectRatio = aspectRatio;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
} 