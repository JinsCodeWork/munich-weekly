package com.munichweekly.backend.controller;

import com.munichweekly.backend.dto.*;
import com.munichweekly.backend.model.Issue;
import com.munichweekly.backend.service.GalleryIssueService;
import com.munichweekly.backend.service.GalleryIssueAdminService;
import com.munichweekly.backend.security.CurrentUserUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

/**
 * Admin API controller for Gallery Issue management.
 * Provides endpoints for managing gallery configurations, cover images, and submission ordering.
 * All endpoints require admin authentication.
 * 
 * REFACTORED: Now uses Issue ID consistently instead of Config ID for better API design.
 */
@RestController
@RequestMapping("/api/gallery/admin")
@PreAuthorize("hasAuthority('admin')")
public class GalleryIssueAdminController {

    private static final Logger logger = Logger.getLogger(GalleryIssueAdminController.class.getName());

    private final GalleryIssueService galleryIssueService;
    private final GalleryIssueAdminService galleryIssueAdminService;

    @Autowired
    public GalleryIssueAdminController(GalleryIssueService galleryIssueService, 
                                      GalleryIssueAdminService galleryIssueAdminService) {
        this.galleryIssueService = galleryIssueService;
        this.galleryIssueAdminService = galleryIssueAdminService;
    }

    /**
     * Get all gallery configurations.
     * GET /api/gallery/admin/configs
     * Admin access only - returns all gallery configurations for management.
     */
    @GetMapping("/configs")
    public ResponseEntity<Map<String, Object>> getAllGalleryConfigurations() {
        logger.info("Admin request to get all gallery configurations");

        try {
            List<GalleryIssueConfigResponseDTO> configs = galleryIssueAdminService.getAllGalleryConfigurations();
            
            Map<String, Object> response = new HashMap<>();
            response.put("configs", configs);
            response.put("total", configs.size());
            response.put("success", true);

            logger.info("Successfully returned " + configs.size() + " gallery configurations to admin");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.severe("Error retrieving gallery configurations for admin: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "error", "Failed to retrieve gallery configurations",
                        "message", e.getMessage(),
                        "success", false
                    ));
        }
    }

    /**
     * Create a new gallery configuration.
     * POST /api/gallery/admin/configs
     * Admin access only - creates a new gallery issue configuration.
     */
    @PostMapping("/configs")
    public ResponseEntity<Map<String, Object>> createGalleryConfiguration(
            @Valid @RequestBody GalleryIssueConfigRequestDTO requestDTO) {
        logger.info("Admin request to create gallery configuration for issue ID: " + requestDTO.getIssueId());

        try {
            Long userId = CurrentUserUtil.getUserIdOrThrow();
            
            GalleryIssueConfigResponseDTO config = galleryIssueAdminService.createGalleryConfiguration(requestDTO, userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("config", config);
            response.put("message", "Gallery configuration created successfully");
            response.put("success", true);

            logger.info("Successfully created gallery configuration ID: " + config.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException e) {
            logger.warning("Invalid request for creating gallery configuration: " + e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of(
                        "error", "Invalid request",
                        "message", e.getMessage(),
                        "success", false
                    ));

        } catch (Exception e) {
            logger.severe("Error creating gallery configuration: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "error", "Failed to create gallery configuration",
                        "message", e.getMessage(),
                        "success", false
                    ));
        }
    }

    /**
     * Update gallery configuration by Issue ID.
     * PUT /api/gallery/admin/issues/{issueId}
     * Admin access only - updates an existing gallery configuration.
     */
    @PutMapping("/issues/{issueId}")
    public ResponseEntity<Map<String, Object>> updateGalleryConfiguration(
            @PathVariable Long issueId,
            @Valid @RequestBody GalleryIssueConfigRequestDTO requestDTO) {
        logger.info("Admin request to update gallery configuration for issue ID: " + issueId);

        try {
            GalleryIssueConfigResponseDTO config = galleryIssueAdminService.updateGalleryConfigurationByIssueId(issueId, requestDTO);
            
            Map<String, Object> response = new HashMap<>();
            response.put("config", config);
            response.put("message", "Gallery configuration updated successfully");
            response.put("success", true);

            logger.info("Successfully updated gallery configuration for issue ID: " + issueId);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            logger.warning("Invalid request for updating gallery configuration: " + e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of(
                        "error", "Invalid request",
                        "message", e.getMessage(),
                        "success", false
                    ));

        } catch (Exception e) {
            logger.severe("Error updating gallery configuration: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "error", "Failed to update gallery configuration",
                        "message", e.getMessage(),
                        "success", false
                    ));
        }
    }

    /**
     * Delete gallery configuration by Issue ID.
     * DELETE /api/gallery/admin/issues/{issueId}
     * Admin access only - deletes a gallery configuration.
     */
    @DeleteMapping("/issues/{issueId}")
    public ResponseEntity<Map<String, Object>> deleteGalleryConfiguration(@PathVariable Long issueId) {
        logger.info("Admin request to delete gallery configuration for issue ID: " + issueId);

        try {
            galleryIssueAdminService.deleteGalleryConfigurationByIssueId(issueId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Gallery configuration deleted successfully");
            response.put("deletedIssueId", issueId);
            response.put("success", true);

            logger.info("Successfully deleted gallery configuration for issue ID: " + issueId);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            logger.warning("Invalid request for deleting gallery configuration: " + e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of(
                        "error", "Invalid request",
                        "message", e.getMessage(),
                        "success", false
                    ));

        } catch (Exception e) {
            logger.severe("Error deleting gallery configuration: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "error", "Failed to delete gallery configuration",
                        "message", e.getMessage(),
                        "success", false
                    ));
        }
    }

    /**
     * Get gallery configuration by Issue ID.
     * GET /api/gallery/admin/issues/{issueId}
     * Admin access only - returns detailed configuration for management.
     */
    @GetMapping("/issues/{issueId}")
    public ResponseEntity<Map<String, Object>> getGalleryConfigurationByIssueId(@PathVariable Long issueId) {
        logger.info("Admin request to get gallery configuration for issue ID: " + issueId);

        try {
            GalleryIssueConfigResponseDTO config = galleryIssueService.getGalleryIssueByIssueId(issueId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("config", config);
            response.put("success", true);

            logger.info("Successfully returned gallery configuration for issue ID: " + issueId);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            logger.warning("Gallery configuration not found for issue ID: " + issueId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                        "error", "Gallery configuration not found",
                        "message", e.getMessage(),
                        "success", false
                    ));

        } catch (Exception e) {
            logger.severe("Error retrieving gallery configuration: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "error", "Failed to retrieve gallery configuration",
                        "message", e.getMessage(),
                        "success", false
                    ));
        }
    }

    /**
     * Update submission order by Issue ID.
     * PUT /api/gallery/admin/issues/{issueId}/order
     * Admin access only - updates submission display order.
     */
    @PutMapping("/issues/{issueId}/order")
    public ResponseEntity<Map<String, Object>> updateSubmissionOrder(
            @PathVariable Long issueId,
            @Valid @RequestBody List<GalleryIssueConfigRequestDTO.SubmissionOrderRequestDTO> orderRequests) {
        logger.info("Admin request to update submission order for issue ID: " + issueId);

        try {
            galleryIssueAdminService.updateSubmissionOrderByIssueId(issueId, orderRequests);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Submission order updated successfully");
            response.put("issueId", issueId);
            response.put("updatedCount", orderRequests.size());
            response.put("success", true);

            logger.info("Successfully updated submission order for issue ID: " + issueId);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            logger.warning("Invalid request for updating submission order: " + e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of(
                        "error", "Invalid request",
                        "message", e.getMessage(),
                        "success", false
                    ));

        } catch (Exception e) {
            logger.severe("Error updating submission order: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "error", "Failed to update submission order",
                        "message", e.getMessage(),
                        "success", false
                    ));
        }
    }

    /**
     * Get available selected submissions for an issue.
     * GET /api/gallery/admin/issues/{issueId}/selected
     * Admin access only - returns submissions available for gallery configuration.
     */
    @GetMapping("/issues/{issueId}/selected")
    public ResponseEntity<Map<String, Object>> getAvailableSelectedSubmissions(@PathVariable Long issueId) {
        logger.info("Admin request to get available selected submissions for issue ID: " + issueId);

        try {
            List<SubmissionResponseDTO> submissions = galleryIssueAdminService.getAvailableSelectedSubmissions(issueId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("submissions", submissions);
            response.put("total", submissions.size());
            response.put("issueId", issueId);
            response.put("success", true);

            logger.info("Successfully returned " + submissions.size() + " available submissions for issue ID: " + issueId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.severe("Error retrieving available submissions: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "error", "Failed to retrieve available submissions",
                        "message", e.getMessage(),
                        "success", false
                    ));
        }
    }

    /**
     * Get issues without gallery configuration.
     * GET /api/gallery/admin/issues/available
     * Admin access only - returns issues that don't have gallery configurations yet.
     */
    @GetMapping("/issues/available")
    public ResponseEntity<Map<String, Object>> getIssuesWithoutGalleryConfig() {
        logger.info("Admin request to get issues without gallery configuration");

        try {
            List<Issue> issues = galleryIssueAdminService.getIssuesWithoutGalleryConfig();
            
            Map<String, Object> response = new HashMap<>();
            response.put("issues", issues);
            response.put("total", issues.size());
            response.put("success", true);

            logger.info("Successfully returned " + issues.size() + " issues without gallery config");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.severe("Error retrieving issues without gallery config: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "error", "Failed to retrieve issues without gallery config",
                        "message", e.getMessage(),
                        "success", false
                    ));
        }
    }

    /**
     * Upload cover image for gallery configuration by Issue ID.
     * POST /api/gallery/admin/issues/{issueId}/cover
     * Admin access only - uploads and sets cover image for gallery configuration.
     */
    @PostMapping("/issues/{issueId}/cover")
    public ResponseEntity<Map<String, Object>> uploadCoverImage(
            @PathVariable Long issueId,
            @RequestParam("file") MultipartFile file) {
        logger.info("Admin request to upload cover image for issue ID: " + issueId);

        try {
            String imageUrl = galleryIssueAdminService.uploadCoverImageByIssueId(issueId, file);

            Map<String, Object> response = new HashMap<>();
            response.put("imageUrl", imageUrl);
            response.put("message", "Cover image uploaded successfully");
            response.put("issueId", issueId);
            response.put("success", true);

            logger.info("Successfully uploaded cover image for issue ID: " + issueId);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            logger.warning("Invalid request for uploading cover image: " + e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of(
                        "error", "Invalid request",
                        "message", e.getMessage(),
                        "success", false
                    ));

        } catch (Exception e) {
            logger.severe("Error uploading cover image: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "error", "Failed to upload cover image",
                        "message", e.getMessage(),
                        "success", false
                    ));
        }
    }
} 