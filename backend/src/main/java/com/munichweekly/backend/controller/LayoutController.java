package com.munichweekly.backend.controller;

import com.munichweekly.backend.devtools.annotation.Description;
import com.munichweekly.backend.dto.MasonryOrderApiResponse;
import com.munichweekly.backend.dto.SubmissionResponseDTO;
import com.munichweekly.backend.security.JwtUtil;
import com.munichweekly.backend.service.MasonryOrderService;
import com.munichweekly.backend.service.SubmissionService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * REST controller for layout calculation endpoints.
 * Provides optimized masonry ordering calculations for hybrid frontend/backend approach.
 */
@RestController
@RequestMapping("/api/layout")
public class LayoutController {
    
    private static final Logger logger = LoggerFactory.getLogger(LayoutController.class);
    
    private final MasonryOrderService masonryOrderService;
    private final SubmissionService submissionService;
    private final JwtUtil jwtUtil;
    
    public LayoutController(
        MasonryOrderService masonryOrderService,
        SubmissionService submissionService,
        JwtUtil jwtUtil
    ) {
        this.masonryOrderService = masonryOrderService;
        this.submissionService = submissionService;
        this.jwtUtil = jwtUtil;
    }
    
    /**
     * Get optimal ordering for masonry layout (new hybrid approach).
     * 
     * Returns pre-calculated ordering for both 2-column and 4-column layouts.
     * Frontend uses this ordering with Skyline algorithm for responsive positioning.
     * 
     * Benefits:
     * - Backend provides high-quality ordering (quality guarantee)
     * - Frontend handles responsive layout (performance guarantee)
     * - Simplified API with no viewport-specific parameters
     */
    @Description("Get optimal masonry ordering for hybrid layout approach")
    @GetMapping("/order")
    @Cacheable(value = "masonryOrdering", key = "'order:' + #issueId")
    public ResponseEntity<MasonryOrderApiResponse> getMasonryOrdering(
        @RequestParam Long issueId,
        HttpServletRequest request
    ) {
        long startTime = System.currentTimeMillis();
        
        try {
            // Check for optional JWT authentication (doesn't fail if missing)
            Optional<Long> userId = extractOptionalUserId(request);
            
            logger.info("🎯 Masonry排序计算开始: issueId={}, authenticated={}, thread={}", 
                       issueId, userId.isPresent(), Thread.currentThread().getName());
            
            // Get approved submissions for the issue
            List<SubmissionResponseDTO> submissions = submissionService.listApprovedByIssue(issueId);
            
            if (submissions.isEmpty()) {
                logger.info("No approved submissions found for issue {}", issueId);
                return ResponseEntity.ok(createEmptyOrderResponse(issueId, userId.isPresent()));
            }
            
            // Calculate the optimal ordering
            MasonryOrderApiResponse.MasonryOrderResult orderResult = 
                masonryOrderService.calculateOptimalOrdering(issueId, submissions);
            
            // Build response with metadata
            MasonryOrderApiResponse.OrderCacheInfo cacheInfo = new MasonryOrderApiResponse.OrderCacheInfo(
                LocalDateTime.now(),
                issueId,
                false, // 由于技术限制，暂时标记为false
                generateVersionHash(submissions),
                System.currentTimeMillis() - startTime
            );
            
            MasonryOrderApiResponse response = new MasonryOrderApiResponse(orderResult, cacheInfo);
            
            long duration = System.currentTimeMillis() - startTime;
            logger.info("✅ Masonry排序完成: issueId={}, 2列序列={}, 4列序列={}, duration={}ms, thread={}", 
                       issueId, orderResult.getOrderedIds2col().size(), 
                       orderResult.getOrderedIds4col().size(), duration, Thread.currentThread().getName());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error calculating masonry ordering: issueId={}, thread={}", 
                        issueId, Thread.currentThread().getName(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Create an empty ordering response for issues with no submissions
     */
    private MasonryOrderApiResponse createEmptyOrderResponse(Long issueId, boolean isAuthenticated) {
        MasonryOrderApiResponse.MasonryOrderResult emptyOrder = 
            new MasonryOrderApiResponse.MasonryOrderResult(
                java.util.Collections.emptyList(),
                java.util.Collections.emptyList(),
                0,
                0.0,
                0
            );
        
        MasonryOrderApiResponse.OrderCacheInfo cacheInfo = new MasonryOrderApiResponse.OrderCacheInfo(
            LocalDateTime.now(),
            issueId,
            false,
            "empty",
            0L
        );
        
        return new MasonryOrderApiResponse(emptyOrder, cacheInfo);
    }
    
    /**
     * Extract user ID from JWT token if present, but don't fail if missing.
     * This allows the endpoint to work for both authenticated and anonymous users.
     */
    private Optional<Long> extractOptionalUserId(HttpServletRequest request) {
        try {
            String token = extractJwtFromRequest(request);
            if (token != null) {
                // Parse and validate token - will throw exception if invalid
                Long userId = jwtUtil.extractUserId(token);
                return Optional.ofNullable(userId);
            }
        } catch (Exception e) {
            // Log at debug level since this is expected for anonymous users
            logger.debug("Could not extract user ID from request: {}", e.getMessage());
        }
        return Optional.empty();
    }
    
    /**
     * Extract JWT token from request headers.
     * Supports both "Authorization: Bearer {token}" and custom headers.
     */
    private String extractJwtFromRequest(HttpServletRequest request) {
        // Check Authorization header first
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        
        // Check for custom token header (if your frontend uses this)
        String customToken = request.getHeader("X-Auth-Token");
        if (customToken != null) {
            return customToken;
        }
        
        return null;
    }
    
    /**
     * Generate a version hash based on submission data for cache invalidation.
     * This ensures cache is invalidated when submissions change.
     */
    private String generateVersionHash(List<SubmissionResponseDTO> submissions) {
        StringBuilder hashInput = new StringBuilder();
        for (SubmissionResponseDTO submission : submissions) {
            hashInput.append(submission.getId())
                     .append("::")
                     .append(submission.getImageUrl())
                     .append("::")
                     .append(submission.getDescription() != null ? submission.getDescription().length() : 0)
                     .append("::")
                     .append(submission.getVoteCount())
                     .append(";");
        }
        
        // Simple hash - in production you might want to use SHA-256 or similar
        return String.valueOf(hashInput.toString().hashCode());
    }
    
    /**
     * Health check endpoint for the layout service
     */
    @Description("Health check for layout calculation service")
    @GetMapping("/health")
    public ResponseEntity<java.util.Map<String, Object>> healthCheck() {
        java.util.Map<String, Object> health = new java.util.HashMap<>();
        health.put("status", "ok");
        health.put("service", "Munich Weekly Layout Service");
        health.put("timestamp", LocalDateTime.now());
        health.put("supportedViewports", java.util.Arrays.asList("mobile", "tablet", "desktop"));
        
        return ResponseEntity.ok(health);
    }
    
    /**
     * Debug endpoint to get layout calculation details
     * (Remove in production or restrict to admin users)
     */
    @Description("Debug endpoint for ordering calculation details - Development only")
    @GetMapping("/debug")
    public ResponseEntity<java.util.Map<String, Object>> debugOrdering(
        @RequestParam Long issueId,
        HttpServletRequest request
    ) {
        // Only enable in development/staging environments
        if (!isDebugEnabled()) {
            return ResponseEntity.notFound().build();
        }
        
        java.util.Map<String, Object> debug = new java.util.HashMap<>();
        
        try {
            List<SubmissionResponseDTO> submissions = submissionService.listApprovedByIssue(issueId);
            
            debug.put("issueId", issueId);
            debug.put("submissionCount", submissions.size());
            debug.put("submissions", submissions.stream()
                .map(s -> java.util.Map.of(
                    "id", s.getId(),
                    "imageUrl", s.getImageUrl(),
                    "descriptionLength", s.getDescription() != null ? s.getDescription().length() : 0,
                    "voteCount", s.getVoteCount()
                ))
                .collect(java.util.stream.Collectors.toList()));
            
            // Add ordering algorithm info
            debug.put("algorithm", "Hybrid: Backend ordering + Frontend positioning");
            debug.put("supportedColumns", java.util.Arrays.asList(2, 4));
            
        } catch (Exception e) {
            debug.put("error", e.getMessage());
        }
        
        return ResponseEntity.ok(debug);
    }
    
    /**
     * Check if debug endpoints should be enabled
     * (Based on environment or configuration)
     */
    private boolean isDebugEnabled() {
        // In a real application, you'd check environment variables or configuration
        String profile = System.getProperty("spring.profiles.active", "production");
        return "development".equals(profile) || "staging".equals(profile);
    }
} 