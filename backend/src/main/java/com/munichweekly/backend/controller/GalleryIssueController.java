package com.munichweekly.backend.controller;

import com.munichweekly.backend.dto.GalleryIssueConfigResponseDTO;
import com.munichweekly.backend.dto.GallerySubmissionOrderResponseDTO;
import com.munichweekly.backend.service.GalleryIssueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

/**
 * Public API controller for Gallery Issue functionality.
 * Provides endpoints for public gallery display without authentication requirements.
 */
@RestController
@RequestMapping("/api/gallery/issues")
public class GalleryIssueController {

    private static final Logger logger = Logger.getLogger(GalleryIssueController.class.getName());

    private final GalleryIssueService galleryIssueService;

    @Autowired
    public GalleryIssueController(GalleryIssueService galleryIssueService) {
        this.galleryIssueService = galleryIssueService;
    }

    /**
     * Get all published gallery issues.
     * GET /api/gallery/issues
     * Public access - returns list of published gallery issue configurations.
     *
     * @return List of published gallery issues
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getPublishedGalleryIssues() {
        logger.info("★★★ DEBUG: Received request to get published gallery issues - NO AUTH REQUIRED");
        System.out.println("★★★ DEBUG: GalleryIssueController.getPublishedGalleryIssues() called");

        try {
            List<GalleryIssueConfigResponseDTO> issues = galleryIssueService.getPublishedGalleryIssues();
            
            Map<String, Object> response = new HashMap<>();
            response.put("issues", issues);
            response.put("total", issues.size());
            response.put("success", true);

            logger.info("Successfully returned " + issues.size() + " published gallery issues");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.severe("Error retrieving published gallery issues: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "error", "Failed to retrieve gallery issues",
                        "message", e.getMessage(),
                        "success", false
                    ));
        }
    }

    /**
     * Get gallery issue configuration by issue ID.
     * GET /api/gallery/issues/{id}
     * Public access - returns detailed gallery issue configuration.
     *
     * @param id Issue ID (not gallery config ID)
     * @return Gallery issue configuration details
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getGalleryIssueByIssueId(@PathVariable Long id) {
        logger.info("Received request to get gallery issue by issue ID: " + id);

        try {
            GalleryIssueConfigResponseDTO issue = galleryIssueService.getGalleryIssueByIssueId(id);
            
            // Check if issue is published for public access
            if (!issue.getIsPublished()) {
                logger.warning("Attempted to access unpublished gallery issue ID: " + id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of(
                            "error", "Gallery issue not found or not published",
                            "success", false
                        ));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("issue", issue);
            response.put("success", true);

            logger.info("Successfully returned gallery issue for issue ID: " + id);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            logger.warning("Gallery issue not found: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                        "error", "Gallery issue not found",
                        "message", e.getMessage(),
                        "success", false
                    ));

        } catch (Exception e) {
            logger.severe("Error retrieving gallery issue: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "error", "Failed to retrieve gallery issue",
                        "message", e.getMessage(),
                        "success", false
                    ));
        }
    }

    /**
     * Get submissions for a gallery issue.
     * GET /api/gallery/issues/{id}/submissions
     * Public access - returns ordered submissions for display.
     *
     * @param id Issue ID (this endpoint expects issueId, not configId)
     * @return List of ordered submissions
     */
    @GetMapping("/{id}/submissions")
    public ResponseEntity<Map<String, Object>> getGalleryIssueSubmissions(@PathVariable Long id) {
        logger.info("Received request to get submissions for gallery issue ID: " + id);

        try {
            List<GallerySubmissionOrderResponseDTO> submissions = galleryIssueService.getGalleryIssueSubmissions(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("submissions", submissions);
            response.put("total", submissions.size());
            response.put("issueId", id);
            response.put("success", true);

            logger.info("Successfully returned " + submissions.size() + " submissions for gallery issue ID: " + id);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            logger.warning("Gallery issue not found or not published: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                        "error", "Gallery issue not found or not published",
                        "message", e.getMessage(),
                        "success", false
                    ));

        } catch (Exception e) {
            logger.severe("Error retrieving gallery issue submissions: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "error", "Failed to retrieve gallery issue submissions",
                        "message", e.getMessage(),
                        "success", false
                    ));
        }
    }

    /**
     * Get gallery statistics.
     * GET /api/gallery/issues/stats
     * Public access - returns general statistics about the gallery.
     *
     * @return Gallery statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getGalleryStats() {
        logger.info("Received request to get gallery statistics");

        try {
            List<GalleryIssueConfigResponseDTO> publishedIssues = galleryIssueService.getPublishedGalleryIssues();
            
            int totalSubmissions = publishedIssues.stream()
                    .mapToInt(GalleryIssueConfigResponseDTO::getSubmissionCount)
                    .sum();

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalPublishedIssues", publishedIssues.size());
            stats.put("totalSubmissions", totalSubmissions);
            stats.put("success", true);

            logger.info("Successfully returned gallery statistics");
            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            logger.severe("Error retrieving gallery statistics: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "error", "Failed to retrieve gallery statistics",
                        "message", e.getMessage(),
                        "success", false
                    ));
        }
    }
} 