package com.munichweekly.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Promotion image request DTO
 * Used for admin to add and update promotion image information
 */
public class PromotionImageRequestDTO {

    /**
     * Promotion configuration ID
     * Frontend field name: promotionConfigId
     */
    @NotNull(message = "Promotion config ID cannot be null")
    @JsonProperty("promotionConfigId")
    private Long promotionConfigId;

    /**
     * Image title
     * Frontend field name: imageTitle
     */
    @Size(max = 200, message = "Image title must be at most 200 characters")
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

    // Constructors
    public PromotionImageRequestDTO() {}

    public PromotionImageRequestDTO(Long promotionConfigId, String imageTitle, 
                                   String imageDescription, Integer displayOrder) {
        this.promotionConfigId = promotionConfigId;
        this.imageTitle = imageTitle;
        this.imageDescription = imageDescription;
        this.displayOrder = displayOrder;
    }

    // Getters and Setters
    public Long getPromotionConfigId() {
        return promotionConfigId;
    }

    public void setPromotionConfigId(Long promotionConfigId) {
        this.promotionConfigId = promotionConfigId;
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
} 