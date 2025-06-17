package com.munichweekly.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * Complete promotion page response DTO
 * Contains promotion configuration and image list, used for frontend to display complete promotion page
 */
public class PromotionPageResponseDTO {

    /**
     * Promotion configuration information
     * Frontend field name: config
     */
    @JsonProperty("config")
    private PromotionConfigResponseDTO config;

    /**
     * Promotion image list (sorted by displayOrder)
     * Frontend field name: images
     */
    @JsonProperty("images")
    private List<PromotionImageResponseDTO> images;

    // Constructors
    public PromotionPageResponseDTO() {}

    public PromotionPageResponseDTO(PromotionConfigResponseDTO config, List<PromotionImageResponseDTO> images) {
        this.config = config;
        this.images = images;
    }

    // Getters and Setters
    public PromotionConfigResponseDTO getConfig() {
        return config;
    }

    public void setConfig(PromotionConfigResponseDTO config) {
        this.config = config;
    }

    public List<PromotionImageResponseDTO> getImages() {
        return images;
    }

    public void setImages(List<PromotionImageResponseDTO> images) {
        this.images = images;
    }
} 