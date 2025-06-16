package com.munichweekly.backend.controller;

import com.munichweekly.backend.devtools.annotation.Description;
import com.munichweekly.backend.dto.MasonryOrderApiResponse;
import com.munichweekly.backend.dto.SubmissionResponseDTO;
import com.munichweekly.backend.model.Submission;
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
 * Enhanced REST controller for layout calculation endpoints.
 * Provides optimized masonry ordering calculations using submission entities
 * for improved performance with stored image dimensions.
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
     * Get optimal ordering for masonry layout with enhanced performance.
     * 
     * This endpoint provides pre-calculated ordering for both 2-column and 4-column layouts
     * using optimized submission entity processing. The hybrid approach ensures:
     * - Backend provides high-quality ordering (quality guarantee)
     * - Frontend handles responsive layout (performance guarantee)
     * - Stored dimensions minimize external API calls for improved speed
     * 
     * Performance improvements:
     * - Uses submission entities with stored dimensions when available
     * - Falls back to dynamic dimension fetching only for legacy data
     * - Comprehensive performance metrics and logging
     * 
     * @param issueId The issue ID to calculate ordering for
     * @param request HTTP request for optional authentication context
     * @return MasonryOrderApiResponse with optimal orderings and metadata
     */
    @Description("Get optimal masonry ordering for hybrid layout approach with enhanced performance")
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
            
            logger.info("Starting masonry ordering calculation: issueId={}, authenticated={}, thread={}", 
                       issueId, userId.isPresent(), Thread.currentThread().getName());
            
            // **ENHANCED: Get submission entities instead of DTOs for dimension optimization**
            List<Submission> submissions = submissionService.getApprovedSubmissionEntities(issueId);
            
            if (submissions.isEmpty()) {
                logger.info("No approved submissions found for issue {}", issueId);
                return ResponseEntity.ok(createEmptyOrderResponse(issueId, startTime));
            }
            
            // **OPTIMIZATION: Use the new submission-based ordering service**
            MasonryOrderApiResponse response = masonryOrderService.calculateOptimalOrderingFromSubmissions(issueId, submissions);
            
            long duration = System.currentTimeMillis() - startTime;
            
            // Log comprehensive performance metrics
            if (response.getOrder() != null) {
                logger.info("Masonry ordering API completed: issueId={}, " +
                           "2col_items={}, 4col_items={}, total_duration={}ms, " +
                           "avg_aspect_ratio={:.3f}, wide_images={}, thread={}", 
                           issueId, 
                           response.getOrder().getOrderedIds2col().size(),
                           response.getOrder().getOrderedIds4col().size(),
                           duration,
                           response.getOrder().getAvgAspectRatio(),
                           response.getOrder().getWideImageCount(),
                           Thread.currentThread().getName());
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            logger.error("Error in masonry ordering API: issueId={}, duration={}ms, thread={}", 
                        issueId, duration, Thread.currentThread().getName(), e);
            
            // Return graceful fallback response
            MasonryOrderApiResponse fallbackResponse = createEmptyOrderResponse(issueId, startTime);
            return ResponseEntity.ok(fallbackResponse);
        }
    }

    /**
     * Create an empty ordering response for issues with no submissions or errors
     * 
     * @param issueId The issue ID
     * @param startTime The request start time for duration calculation
     * @return Empty MasonryOrderApiResponse with proper structure
     */
    private MasonryOrderApiResponse createEmptyOrderResponse(Long issueId, long startTime) {
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
            System.currentTimeMillis() - startTime
        );
        
        return new MasonryOrderApiResponse(emptyOrder, cacheInfo);
    }
    
    /**
     * Extract user ID from JWT token if present, but don't fail if missing.
     * This allows the endpoint to work for both authenticated and anonymous users.
     * 
     * @param request The HTTP request containing potential JWT token
     * @return Optional containing user ID if authenticated, empty otherwise
     */
    private Optional<Long> extractOptionalUserId(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                Long userId = jwtUtil.extractUserId(token);
                return Optional.ofNullable(userId);
            }
        } catch (Exception e) {
            // Log but don't fail - this endpoint supports anonymous access
            logger.debug("Could not extract user ID from request: {}", e.getMessage());
        }
        return Optional.empty();
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