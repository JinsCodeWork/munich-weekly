package com.munichweekly.backend.controller;

import com.munichweekly.backend.dto.*;
import com.munichweekly.backend.service.PromotionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;
import java.util.Optional;

/**
 * Promotion feature controller
 * Provides REST API for promotion configuration and image management
 * Includes public interfaces (navigation bar, promotion pages) and admin interfaces (configuration management)
 */
@RestController
@RequestMapping("/api/promotion")
public class PromotionController {

    private final PromotionService promotionService;

    @Autowired
    public PromotionController(PromotionService promotionService) {
        this.promotionService = promotionService;
    }

    // ================== Public Interfaces ==================

    /**
     * Get enabled promotion configuration
     * Public interface, used for frontend navigation bar to display promotion links
     * 
     * GET /api/promotion/config
     */
    @GetMapping("/config")
    public ResponseEntity<PromotionConfigResponseDTO> getPromotionConfig() {
        System.out.println("=== PromotionController.getPromotionConfig() called ===");
        
        try {
            Optional<PromotionConfigResponseDTO> config = promotionService.getEnabledPromotionConfig();
            
            if (config.isPresent()) {
                System.out.println("Config found: " + config.get());
                return ResponseEntity.ok(config.get());
            } else {
                System.out.println("No enabled config found, returning 204");
                return ResponseEntity.noContent().build();
            }
        } catch (Exception e) {
            System.err.println("Error in getPromotionConfig: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Get promotion page content by page URL
     * Public interface, used for displaying promotion pages
     * 
     * GET /api/promotion/page/{pageUrl}
     */
    @GetMapping("/page/{pageUrl}")
    public ResponseEntity<PromotionPageResponseDTO> getPromotionPage(@PathVariable String pageUrl) {
        Optional<PromotionPageResponseDTO> page = promotionService.getPromotionPageByUrl(pageUrl);
        
        if (page.isPresent()) {
            return ResponseEntity.ok(page.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // ================== Admin Interfaces ==================

    /**
     * Get all promotion configurations (admin)
     * Admin interface, used for management interface to display configuration list
     * 
     * GET /api/promotion/admin/configs
     */
    @GetMapping("/admin/configs")
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<List<PromotionConfigResponseDTO>> getAllPromotionConfigsForAdmin() {
        List<PromotionConfigResponseDTO> configs = promotionService.getAllPromotionConfigsForAdmin();
        return ResponseEntity.ok(configs);
    }

    /**
     * Get specific promotion configuration by ID (admin)
     * Admin interface, used for editing specific configuration
     * 
     * GET /api/promotion/admin/config/{id}
     */
    @GetMapping("/admin/config/{id}")
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<PromotionConfigResponseDTO> getPromotionConfigByIdForAdmin(@PathVariable Long id) {
        try {
            PromotionConfigResponseDTO config = promotionService.getPromotionConfigByIdForAdmin(id);
            return ResponseEntity.ok(config);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get promotion configuration (admin)
     * Admin interface, used for management interface to display current configuration
     * 
     * GET /api/promotion/admin/config
     */
    @GetMapping("/admin/config")
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<PromotionConfigResponseDTO> getPromotionConfigForAdmin() {
        PromotionConfigResponseDTO config = promotionService.getPromotionConfigForAdmin();
        return ResponseEntity.ok(config);
    }

    /**
     * Update promotion configuration (admin)
     * Admin interface, used for updating promotion settings
     * 
     * PUT /api/promotion/admin/config
     */
    @PutMapping("/admin/config")
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<PromotionConfigResponseDTO> updatePromotionConfig(
            @Valid @RequestBody PromotionConfigRequestDTO requestDTO) {
        PromotionConfigResponseDTO updatedConfig = promotionService.updatePromotionConfig(requestDTO);
        return ResponseEntity.ok(updatedConfig);
    }

    /**
     * Get promotion image list (admin)
     * Admin interface, used for management interface to display image list
     * 
     * GET /api/promotion/admin/images?configId={configId}
     */
    @GetMapping("/admin/images")
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<List<PromotionImageResponseDTO>> getPromotionImages(
            @RequestParam Long configId) {
        try {
            // Validate configId
            if (configId == null) {
                return ResponseEntity.badRequest().build();
            }
            
            List<PromotionImageResponseDTO> images = promotionService.getPromotionImages(configId);
            return ResponseEntity.ok(images);
        } catch (IllegalArgumentException e) {
            System.err.println("Invalid configId in getPromotionImages: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Add promotion image (admin)
     * Admin interface, used for adding new promotion images
     * 
     * POST /api/promotion/admin/images
     */
    @PostMapping("/admin/images")
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<PromotionImageResponseDTO> addPromotionImage(
            @Valid @RequestBody PromotionImageRequestDTO requestDTO) {
        try {
            PromotionImageResponseDTO image = promotionService.addPromotionImage(requestDTO);
            return ResponseEntity.ok(image);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Upload promotion image file (admin)
     * Admin interface, used for uploading image files
     * Uses independent storage path, separated from other images
     * 
     * POST /api/promotion/admin/images/{imageId}/upload
     */
    @PostMapping("/admin/images/{imageId}/upload")
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<String> uploadPromotionImageFile(
            @PathVariable Long imageId,
            @RequestParam("file") MultipartFile file) {
        try {
            // Validate file type
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File cannot be empty");
            }

            String contentType = file.getContentType();
            if (contentType == null || (!contentType.startsWith("image/"))) {
                return ResponseEntity.badRequest().body("File must be image format");
            }

            // Call service to upload file
            String imageUrl = promotionService.uploadPromotionImageFile(imageId, file);
            return ResponseEntity.ok(imageUrl);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("File upload failed");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Internal server error");
        }
    }

    /**
     * Delete promotion image (admin)
     * Admin interface, used for deleting promotion images
     * 
     * DELETE /api/promotion/admin/images/{imageId}
     */
    @DeleteMapping("/admin/images/{imageId}")
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<Void> deletePromotionImage(@PathVariable Long imageId) {
        try {
            promotionService.deletePromotionImage(imageId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Delete promotion configuration completely (admin)
     * Admin interface, used for completely removing promotion configuration and all associated data
     * This will delete the configuration, all images from database, and all image files from R2 storage
     * 
     * DELETE /api/promotion/admin/config/{id}
     */
    @DeleteMapping("/admin/config/{id}")
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<Void> deletePromotionConfig(@PathVariable Long id) {
        try {
            promotionService.deletePromotionConfig(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            // Log unexpected errors
            System.err.println("Unexpected error in deletePromotionConfig: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
} 