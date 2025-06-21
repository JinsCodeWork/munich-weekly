package com.munichweekly.backend.controller;

import com.munichweekly.backend.dto.FeaturedSubmissionDto;
import com.munichweekly.backend.dto.GalleryFeaturedConfigDto;
import com.munichweekly.backend.service.GalleryService;
import com.munichweekly.backend.security.CurrentUserUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.logging.Logger;

/**
 * Gallery controller
 * Provides REST API for Gallery featured functionality
 */
@RestController
@RequestMapping("/api/gallery")
public class GalleryController {

    private static final Logger logger = Logger.getLogger(GalleryController.class.getName());

    private final GalleryService galleryService;

    @Autowired
    public GalleryController(GalleryService galleryService) {
        this.galleryService = galleryService;
    }

    // Debug endpoint - Check current user permissions
    @GetMapping("/debug/auth")
    public ResponseEntity<Map<String, Object>> debugAuth() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Map<String, Object> debug = new HashMap<>();
        
        if (auth == null) {
            debug.put("authenticated", false);
            debug.put("message", "No authentication found");
        } else {
            debug.put("authenticated", auth.isAuthenticated());
            debug.put("principal", auth.getPrincipal().toString());
            debug.put("authorities", auth.getAuthorities().toString());
            debug.put("name", auth.getName());
            
            try {
                var user = CurrentUserUtil.getUser();
                if (user != null) {
                    debug.put("userId", user.getId());
                    debug.put("userRole", user.getRole());
                    debug.put("userEmail", user.getEmail());
                }
            } catch (Exception e) {
                debug.put("userError", e.getMessage());
            }
        }
        
        return ResponseEntity.ok(debug);
    }

    // Public API endpoints

    /**
     * Get featured submissions list
     * GET /api/gallery/featured
     * Public access, no authentication required
     *
     * @return Featured submissions list
     */
    @GetMapping("/featured")
    public ResponseEntity<List<FeaturedSubmissionDto>> getFeaturedSubmissions() {
        logger.info("Received request to get featured submissions");

        try {
            List<FeaturedSubmissionDto> submissions = galleryService.getFeaturedSubmissions();
            
            if (submissions.isEmpty()) {
                logger.info("No featured submissions available");
                return ResponseEntity.ok(submissions);
            }

            logger.info("Successfully returned " + submissions.size() + " featured submissions");
            return ResponseEntity.ok(submissions);

        } catch (Exception e) {
            logger.severe("Error retrieving featured submissions: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(List.of());
        }
    }

    /**
     * Get featured statistics
     * GET /api/gallery/stats
     * Public access, used to display statistics
     *
     * @return Statistics information
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getFeaturedStats() {
        logger.info("Received request to get featured statistics");

        try {
            Map<String, Object> stats = galleryService.getFeaturedStats();
            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            logger.severe("Error retrieving featured statistics: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve statistics"));
        }
    }

    // Admin API endpoints

    /**
     * Get currently active featured configuration
     * GET /api/gallery/featured/config
     * Admin access only
     *
     * @return Currently active featured configuration
     */
    @GetMapping("/featured/config")
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<Map<String, Object>> getActiveConfig() {
        logger.info("Received request to get active featured configuration");

        try {
            Optional<GalleryFeaturedConfigDto> configOpt = galleryService.getActiveConfig();
            
            Map<String, Object> response = new HashMap<>();
            if (configOpt.isPresent()) {
                response.put("config", configOpt.get());
                response.put("hasConfig", true);
            } else {
                response.put("config", null);
                response.put("hasConfig", false);
                response.put("message", "No active featured configuration available");
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.severe("Error retrieving active featured configuration: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve configuration: " + e.getMessage()));
        }
    }

    /**
     * Get all featured configurations
     * GET /api/gallery/featured/configs
     * Admin access only
     *
     * @return All featured configuration list
     */
    @GetMapping("/featured/configs")
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<Map<String, Object>> getAllConfigs() {
        logger.info("Received request to get all featured configurations");

        try {
            List<GalleryFeaturedConfigDto> configs = galleryService.getAllConfigs();
            
            Map<String, Object> response = new HashMap<>();
            response.put("configs", configs);
            response.put("total", configs.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.severe("Error retrieving all featured configurations: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve configuration list: " + e.getMessage()));
        }
    }

    /**
     * Create or update featured configuration
     * POST /api/gallery/featured/config
     * Admin access only
     *
     * @param configDto Featured configuration DTO
     * @return Saved configuration
     */
    @PostMapping("/featured/config")
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<Map<String, Object>> saveConfig(
            @Valid @RequestBody GalleryFeaturedConfigDto configDto) {
        
        logger.info("Received request to save featured configuration: " + configDto.toString());

        try {
            // Get current user ID
            Long userId = CurrentUserUtil.getUserIdOrThrow();
            
            // Save configuration
            GalleryFeaturedConfigDto savedConfig = galleryService.saveConfig(configDto, userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("config", savedConfig);
            response.put("message", "Featured configuration saved successfully");
            response.put("success", true);

            logger.info("Successfully saved featured configuration ID: " + savedConfig.getId());
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            logger.warning("Parameter error when saving featured configuration: " + e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of(
                        "error", e.getMessage(),
                        "success", false
                    ));

        } catch (Exception e) {
            logger.severe("Error saving featured configuration: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "error", "Failed to save configuration: " + e.getMessage(),
                        "success", false
                    ));
        }
    }

    /**
     * Preview submission by ID
     * GET /api/gallery/submissions/{id}/preview
     * Admin access only
     *
     * @param id Submission ID
     * @return Submission preview information
     */
    @GetMapping("/submissions/{id}/preview")
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<Map<String, Object>> previewSubmission(@PathVariable Long id) {
        logger.info("Received request to preview submission ID: " + id);

        try {
            Optional<FeaturedSubmissionDto> submissionOpt = galleryService.previewSubmission(id);
            
            Map<String, Object> response = new HashMap<>();
            if (submissionOpt.isPresent()) {
                response.put("submission", submissionOpt.get());
                response.put("found", true);
            } else {
                response.put("submission", null);
                response.put("found", false);
                response.put("message", "Submission does not exist or has been deleted");
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.severe("Error previewing submission: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to preview submission: " + e.getMessage()));
        }
    }

    /**
     * Delete featured configuration
     * DELETE /api/gallery/featured/config/{id}
     * Admin access only
     *
     * @param id Configuration ID
     * @return Deletion result
     */
    @DeleteMapping("/featured/config/{id}")
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<Map<String, Object>> deleteConfig(@PathVariable Long id) {
        logger.info("Received request to delete featured configuration ID: " + id);

        try {
            galleryService.deleteConfig(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Featured configuration deleted successfully");
            response.put("success", true);
            response.put("deletedId", id);

            logger.info("Successfully deleted featured configuration ID: " + id);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            logger.warning("Parameter error when deleting featured configuration: " + e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of(
                        "error", e.getMessage(),
                        "success", false
                    ));

        } catch (Exception e) {
            logger.severe("Error deleting featured configuration: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "error", "Failed to delete configuration: " + e.getMessage(),
                        "success", false
                    ));
        }
    }

    /**
     * Check if submission is featured
     * GET /api/gallery/submissions/{id}/featured-status
     * Admin access only
     *
     * @param id Submission ID
     * @return Featured status
     */
    @GetMapping("/submissions/{id}/featured-status")
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<Map<String, Object>> checkFeaturedStatus(@PathVariable Long id) {
        logger.info("Received request to check submission featured status ID: " + id);

        try {
            boolean isFeatured = galleryService.isSubmissionFeatured(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("submissionId", id);
            response.put("isFeatured", isFeatured);
            response.put("message", isFeatured ? "Submission is featured" : "Submission is not featured");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.severe("Error checking submission featured status: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to check featured status: " + e.getMessage()));
        }
    }
} 