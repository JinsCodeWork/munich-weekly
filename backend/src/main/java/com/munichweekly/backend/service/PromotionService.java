package com.munichweekly.backend.service;

import com.munichweekly.backend.dto.*;
import com.munichweekly.backend.model.ImageDimensions;
import com.munichweekly.backend.model.PromotionConfig;
import com.munichweekly.backend.model.PromotionImage;
import com.munichweekly.backend.repository.PromotionConfigRepository;
import com.munichweekly.backend.repository.PromotionImageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Promotion feature service class
 * Provides business logic for promotion configuration and image management
 * Reuses existing storage service and image dimension service
 */
@Service
@Transactional
public class PromotionService {

    private final PromotionConfigRepository promotionConfigRepository;
    private final PromotionImageRepository promotionImageRepository;
    private final StorageService storageService;
    private final ImageDimensionService imageDimensionService;

    @Autowired
    public PromotionService(PromotionConfigRepository promotionConfigRepository,
                           PromotionImageRepository promotionImageRepository,
                           StorageService storageService,
                           ImageDimensionService imageDimensionService) {
        this.promotionConfigRepository = promotionConfigRepository;
        this.promotionImageRepository = promotionImageRepository;
        this.storageService = storageService;
        this.imageDimensionService = imageDimensionService;
    }

    /**
     * Get currently enabled promotion configuration
     * Public interface, used for navigation bar display
     */
    @Transactional(readOnly = true)
    public Optional<PromotionConfigResponseDTO> getEnabledPromotionConfig() {
        Optional<PromotionConfig> config = promotionConfigRepository.findEnabledConfig();
        return config.map(PromotionConfigResponseDTO::new);
    }

    /**
     * Get complete promotion page information by page URL
     * Public interface, used for promotion page display
     */
    @Transactional(readOnly = true)
    public Optional<PromotionPageResponseDTO> getPromotionPageByUrl(String pageUrl) {
        Optional<PromotionConfig> configOpt = promotionConfigRepository.findByPageUrl(pageUrl);
        
        if (configOpt.isEmpty() || !configOpt.get().getIsEnabled()) {
            return Optional.empty();
        }

        PromotionConfig config = configOpt.get();
        List<PromotionImage> images = promotionImageRepository
            .findByPromotionConfigOrderByDisplayOrderAsc(config);

        PromotionConfigResponseDTO configDTO = new PromotionConfigResponseDTO(config);
        List<PromotionImageResponseDTO> imagesDTOs = images.stream()
            .map(PromotionImageResponseDTO::new)
            .collect(Collectors.toList());

        return Optional.of(new PromotionPageResponseDTO(configDTO, imagesDTOs));
    }

    /**
     * Get all promotion configurations (admin)
     * Returns list of all configurations for admin management
     */
    @Transactional(readOnly = true)
    public List<PromotionConfigResponseDTO> getAllPromotionConfigsForAdmin() {
        List<PromotionConfig> allConfigs = promotionConfigRepository.findAll();
        return allConfigs.stream()
            .map(PromotionConfigResponseDTO::new)
            .collect(Collectors.toList());
    }

    /**
     * Get specific promotion configuration by ID (admin)
     * Returns specific configuration for editing
     */
    @Transactional(readOnly = true)
    public PromotionConfigResponseDTO getPromotionConfigByIdForAdmin(Long configId) {
        Optional<PromotionConfig> config = promotionConfigRepository.findById(configId);
        
        if (config.isPresent()) {
            return new PromotionConfigResponseDTO(config.get());
        }
        
        throw new IllegalArgumentException("Promotion configuration not found");
    }

    /**
     * Get promotion configuration (admin)
     * Returns any existing configuration regardless of enabled status, or creates default if none exists
     */
    @Transactional(readOnly = true)
    public PromotionConfigResponseDTO getPromotionConfigForAdmin() {
        // First try to find any existing configuration (enabled or disabled)
        List<PromotionConfig> allConfigs = promotionConfigRepository.findAll();
        
        if (!allConfigs.isEmpty()) {
            // Return the first (and should be only) configuration
            return new PromotionConfigResponseDTO(allConfigs.get(0));
        }
        
        // If no configuration exists at all, return default configuration (but don't save to database)
        PromotionConfig defaultConfig = new PromotionConfig(false, "", "");
        return new PromotionConfigResponseDTO(defaultConfig);
    }

    /**
     * Update promotion configuration (admin)
     */
    public PromotionConfigResponseDTO updatePromotionConfig(PromotionConfigRequestDTO requestDTO) {
        // Find any existing configuration (enabled or disabled)
        List<PromotionConfig> allConfigs = promotionConfigRepository.findAll();
        
        PromotionConfig config;
        if (!allConfigs.isEmpty()) {
            config = allConfigs.get(0);
            
            // Check page URL uniqueness (if URL has changed)
            if (requestDTO.getPageUrl() != null && 
                !requestDTO.getPageUrl().equals(config.getPageUrl())) {
                if (promotionConfigRepository.existsByPageUrlAndIdNot(requestDTO.getPageUrl(), config.getId())) {
                    throw new IllegalArgumentException("Page URL already exists");
                }
            }
        } else {
            // Create new configuration
            config = new PromotionConfig();
            
            // Check page URL uniqueness (when creating new)
            if (requestDTO.getPageUrl() != null && 
                promotionConfigRepository.existsByPageUrl(requestDTO.getPageUrl())) {
                throw new IllegalArgumentException("Page URL already exists");
            }
        }

        // Update configuration information
        config.setIsEnabled(requestDTO.getIsEnabled());
        config.setNavTitle(requestDTO.getNavTitle());
        config.setPageUrl(requestDTO.getPageUrl());
        config.setDescription(requestDTO.getDescription());

        PromotionConfig savedConfig = promotionConfigRepository.save(config);
        return new PromotionConfigResponseDTO(savedConfig);
    }

    /**
     * Add promotion image (admin)
     */
    public PromotionImageResponseDTO addPromotionImage(PromotionImageRequestDTO requestDTO) {
        // Find promotion configuration
        PromotionConfig config = promotionConfigRepository.findById(requestDTO.getPromotionConfigId())
            .orElseThrow(() -> new IllegalArgumentException("Promotion config not found"));

        // If display order not specified, automatically set to max value + 1
        Integer displayOrder = requestDTO.getDisplayOrder();
        if (displayOrder == null) {
            Integer maxOrder = promotionImageRepository.findMaxDisplayOrderByPromotionConfig(config);
            displayOrder = (maxOrder != null ? maxOrder : 0) + 1;
        }

        // Create promotion image entity
        PromotionImage image = new PromotionImage(
            config,
            null, // imageUrl will be set after upload
            requestDTO.getImageTitle(),
            requestDTO.getImageDescription(),
            displayOrder
        );

        PromotionImage savedImage = promotionImageRepository.save(image);
        return new PromotionImageResponseDTO(savedImage);
    }

    /**
     * Upload promotion image file (admin)
     * Reuses existing storage service with independent storage path
     */
    public String uploadPromotionImageFile(Long imageId, MultipartFile file) throws IOException {
        // Find promotion image
        PromotionImage image = promotionImageRepository.findById(imageId)
            .orElseThrow(() -> new IllegalArgumentException("Promotion image not found"));

        // Use dedicated storage path: promotion/{configId}/{imageId}
        String promotionPath = "promotion/" + image.getPromotionConfig().getId();
        
        // Call storage service to save file (needs to adapt StorageService interface here)
        String imageUrl = storePromotionImageFile(file, promotionPath, imageId.toString());

        // Get and set image dimensions
        try {
            ImageDimensions dimensions = imageDimensionService.fetchImageDimensionsForUpload(imageUrl);
            if (dimensions != null) {
                image.setImageDimensions(dimensions.getWidth(), dimensions.getHeight());
            }
        } catch (Exception e) {
            // If dimension extraction fails, log error but don't interrupt the process
            System.err.println("Failed to extract image dimensions: " + e.getMessage());
        }

        // Update image URL
        image.setImageUrl(imageUrl);
        promotionImageRepository.save(image);

        return imageUrl;
    }

    /**
     * Delete promotion image (admin)
     */
    public void deletePromotionImage(Long imageId) {
        PromotionImage image = promotionImageRepository.findById(imageId)
            .orElseThrow(() -> new IllegalArgumentException("Promotion image not found"));

        // Delete file
        if (image.getImageUrl() != null) {
            storageService.deleteFile(image.getImageUrl());
        }

        // Delete database record
        promotionImageRepository.delete(image);
    }

    /**
     * Delete promotion configuration completely (admin)
     * This will delete the configuration and all associated images from both database and R2 storage
     */
    @Transactional
    public void deletePromotionConfig(Long configId) {
        // Find promotion configuration
        PromotionConfig config = promotionConfigRepository.findById(configId)
            .orElseThrow(() -> new IllegalArgumentException("Promotion configuration not found"));

        // Get all associated images
        List<PromotionImage> images = promotionImageRepository.findByPromotionConfigOrderByDisplayOrderAsc(config);
        
        // Delete all image files from R2 storage
        for (PromotionImage image : images) {
            if (image.getImageUrl() != null) {
                try {
                    storageService.deleteFile(image.getImageUrl());
                    System.out.println("Deleted image file: " + image.getImageUrl());
                } catch (Exception e) {
                    // Log error but continue with deletion
                    System.err.println("Failed to delete image file: " + image.getImageUrl() + " - " + e.getMessage());
                }
            }
        }
        
        // Delete all promotion images from database (cascade will handle this, but explicit for clarity)
        promotionImageRepository.deleteByPromotionConfig(config);
        
        // Delete promotion configuration from database
        promotionConfigRepository.delete(config);
        
        System.out.println("Successfully deleted promotion configuration ID: " + configId + 
                          " with " + images.size() + " associated images");
    }

    /**
     * Get all images of promotion configuration (admin)
     */
    @Transactional(readOnly = true)
    public List<PromotionImageResponseDTO> getPromotionImages(Long configId) {
        List<PromotionImage> images = promotionImageRepository
            .findByPromotionConfigIdOrderByDisplayOrderAsc(configId);
        
        return images.stream()
            .map(PromotionImageResponseDTO::new)
            .collect(Collectors.toList());
    }

    /**
     * Private method: store promotion image file
     * Needs adaptation due to fixed StorageService interface parameters
     */
    private String storePromotionImageFile(MultipartFile file, String promotionPath, String imageId) throws IOException {
        // Needs adaptation based on actual StorageService interface
        // May need to pass special parameters to indicate this is a promotion image
        // For example, using special issueId and userId formats
        
        // Use special identifiers to distinguish promotion images
        String specialIssueId = "promotion";
        String specialUserId = promotionPath; // promotion/{configId}
        String specialSubmissionId = imageId;
        
        return storageService.storeFile(file, specialIssueId, specialUserId, specialSubmissionId);
    }
} 