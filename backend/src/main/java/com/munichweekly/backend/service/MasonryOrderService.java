package com.munichweekly.backend.service;

import com.munichweekly.backend.dto.MasonryOrderApiResponse;
import com.munichweekly.backend.dto.SubmissionResponseDTO;
import com.munichweekly.backend.model.ImageDimensions;
import com.munichweekly.backend.model.Submission;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Enhanced service for calculating optimal masonry ordering for different column configurations.
 * Uses optimized dimension retrieval with submission entity integration for improved performance.
 * Maintains the same high-quality algorithms while reducing external API calls.
 */
@Service
public class MasonryOrderService {
    
    private static final Logger logger = LoggerFactory.getLogger(MasonryOrderService.class);
    
    private final ImageDimensionService imageDimensionService;
    
    // **MASONRY ALGORITHM CONSTANTS**
    private static final double WIDE_IMAGE_THRESHOLD = 16.0 / 9.0; // 1.778
    private static final double WIDE_IMAGE_BIAS = 0.9; // α parameter for weighted scoring
    private static final boolean ENABLE_WEIGHTED_SCORING = true;
    private static final int MAX_WIDE_STREAK = 1;
    private static final int MIN_NARROW_AFTER_WIDE = 2;
    
    public MasonryOrderService(ImageDimensionService imageDimensionService) {
        this.imageDimensionService = imageDimensionService;
    }
    
    /**
     * Calculate optimal ordering for both 2-column and 4-column layouts with enhanced performance.
     * Uses stored submission dimensions when available to minimize external API calls.
     * This is the new preferred method for submission entities.
     * 
     * @param issueId The issue ID for logging/debugging
     * @param submissions List of submission entities to order (must contain complete submission entities)
     * @return MasonryOrderApiResponse with optimal orderings for both column counts
     */
    public MasonryOrderApiResponse calculateOptimalOrderingFromSubmissions(Long issueId, List<Submission> submissions) {
        logger.info("Starting masonry ordering calculation for issue {} with {} submissions", 
                issueId, submissions.size());
        
        long startTime = System.currentTimeMillis();
        
        if (submissions == null || submissions.isEmpty()) {
            logger.warn("No submissions provided for issue {}", issueId);
            return createEmptyOrderResponse(issueId, startTime);
        }
        
        try {
            // **OPTIMIZATION: Build dimension map with hybrid approach**
            Map<Long, ImageDimensions> dimensionMap = buildOptimizedDimensionMap(submissions);
            
            // Create submission map for efficient lookup
            Map<Long, Submission> submissionMap = submissions.stream()
                    .collect(Collectors.toMap(Submission::getId, s -> s));
            
            // Extract submission IDs for algorithm processing
            List<Long> submissionIds = submissions.stream()
                    .map(Submission::getId)
                .collect(Collectors.toList());
            
            // Calculate optimal ordering for both column configurations
            List<Long> order2Col = calculateOptimalOrder(submissionIds, dimensionMap, submissionMap, 2);
            List<Long> order4Col = calculateOptimalOrder(submissionIds, dimensionMap, submissionMap, 4);
            
            long endTime = System.currentTimeMillis();
            long processingTime = endTime - startTime;
            
            // Log performance metrics
            long storedDimensionsCount = submissions.stream()
                    .mapToLong(s -> s.hasDimensionData() ? 1 : 0)
                    .sum();
            long dynamicFetchCount = submissions.size() - storedDimensionsCount;
            
            // Calculate metadata
            double avgAspectRatio = dimensionMap.values().stream()
                    .mapToDouble(ImageDimensions::getAspectRatio)
            .average()
            .orElse(0.0);
        
            int wideImageCount = (int) dimensionMap.values().stream()
                    .filter(d -> d.getAspectRatio() >= WIDE_IMAGE_THRESHOLD)
            .count();
        
            logger.info("Masonry ordering completed for issue {} in {}ms. " +
                       "Submissions: {}, Stored dimensions: {}, Dynamic fetches: {}, " +
                       "Performance ratio: {:.1f}%",
                    issueId, processingTime, submissions.size(), storedDimensionsCount, 
                    dynamicFetchCount, (storedDimensionsCount * 100.0 / submissions.size()));
            
            // Create order result
            MasonryOrderApiResponse.MasonryOrderResult orderResult = 
                    new MasonryOrderApiResponse.MasonryOrderResult(
                            order2Col, order4Col, submissions.size(), avgAspectRatio, wideImageCount);
            
            // Create cache info
            MasonryOrderApiResponse.OrderCacheInfo cacheInfo = 
                    new MasonryOrderApiResponse.OrderCacheInfo(
                            LocalDateTime.now(), issueId, false, 
                            generateVersionHash(submissions), processingTime);
            
            return new MasonryOrderApiResponse(orderResult, cacheInfo);
            
        } catch (Exception e) {
            logger.error("Error calculating masonry ordering for issue {}", issueId, e);
            
            // **FALLBACK: Return submission IDs in original order**
            List<Long> fallbackOrder = submissions.stream()
                    .map(Submission::getId)
                    .collect(Collectors.toList());
            
            MasonryOrderApiResponse.MasonryOrderResult fallbackResult = 
                    new MasonryOrderApiResponse.MasonryOrderResult(
                            fallbackOrder, fallbackOrder, submissions.size(), 0.0, 0);
            
            MasonryOrderApiResponse.OrderCacheInfo cacheInfo = 
                    new MasonryOrderApiResponse.OrderCacheInfo(
                            LocalDateTime.now(), issueId, false, "fallback", 
                            System.currentTimeMillis() - startTime);
            
            return new MasonryOrderApiResponse(fallbackResult, cacheInfo);
        }
    }
    
    /**
     * Build dimension map using optimized hybrid approach.
     * Prioritizes stored dimensions and falls back to dynamic fetching only when necessary.
     * 
     * @param submissions List of submission entities
     * @return Map of submission ID to ImageDimensions with complete coverage
     */
    private Map<Long, ImageDimensions> buildOptimizedDimensionMap(List<Submission> submissions) {
        Map<Long, ImageDimensions> dimensionMap = new HashMap<>();
        List<Submission> needsDynamicFetch = new ArrayList<>();
        
        // **PHASE 1: Collect stored dimensions (high performance)**
        for (Submission submission : submissions) {
            if (submission.hasDimensionData()) {
                dimensionMap.put(submission.getId(), 
                    new ImageDimensions(submission.getImageWidth(), submission.getImageHeight()));
                logger.debug("Using stored dimensions for submission {}: {}x{}", 
                        submission.getId(), submission.getImageWidth(), submission.getImageHeight());
            } else {
                needsDynamicFetch.add(submission);
                logger.debug("Submission {} requires dynamic dimension fetching", submission.getId());
            }
        }
        
        // **PHASE 2: Dynamic fetch for legacy submissions (when necessary)**
        if (!needsDynamicFetch.isEmpty()) {
            logger.info("Performing dynamic dimension fetching for {} legacy submissions", 
                    needsDynamicFetch.size());
            
            for (Submission submission : needsDynamicFetch) {
                try {
                    ImageDimensions dimensions = imageDimensionService.getSubmissionDimensions(submission);
                    dimensionMap.put(submission.getId(), dimensions);
                    
                    logger.debug("Dynamic fetch successful for submission {}: {}", 
                            submission.getId(), dimensions);
                
            } catch (Exception e) {
                    logger.warn("Failed to fetch dimensions for submission {}, using default: {}", 
                            submission.getId(), e.getMessage());
                    
                    // Use safe fallback dimensions
                    dimensionMap.put(submission.getId(), new ImageDimensions(800, 600));
                }
            }
        }
        
        logger.info("Dimension map built: {} stored, {} dynamic, {} total", 
                submissions.size() - needsDynamicFetch.size(), 
                needsDynamicFetch.size(), 
                dimensionMap.size());
        
        return dimensionMap;
    }
    
    /**
     * Calculate optimal ordering using the enhanced Greedy Best-Fit algorithm
     * 
     * @param submissionIds List of submission IDs to order
     * @param dimensionMap Pre-built map of dimensions for performance
     * @param submissionMap Submission entities for additional data access
     * @param columns Number of columns in the target layout
     * @return Optimally ordered list of submission IDs
     */
    private List<Long> calculateOptimalOrder(List<Long> submissionIds, 
                                           Map<Long, ImageDimensions> dimensionMap,
                                           Map<Long, Submission> submissionMap,
                                           int columns) {
        
        logger.debug("Calculating optimal order for {} columns with {} submissions", 
                columns, submissionIds.size());
        
        if (submissionIds.isEmpty()) {
            return new ArrayList<>();
        }
        
        // **ALGORITHM: Enhanced Greedy Best-Fit with Wide Image Management**
        
        List<Long> ordered = new ArrayList<>();
        Set<Long> remaining = new HashSet<>(submissionIds);
        double[] columnHeights = new double[columns];
        int consecutiveWideCount = 0;
        int itemsSinceLastWide = 0;
        
        while (!remaining.isEmpty()) {
            Long bestItem = null;
            double bestScore = Double.NEGATIVE_INFINITY;
            int bestColumn = 0;
            boolean bestIsWide = false;
            
            // **SELECTION PHASE: Find optimal next item**
            for (Long itemId : remaining) {
                ImageDimensions dimensions = dimensionMap.get(itemId);
                if (dimensions == null) {
                    logger.warn("No dimensions found for submission {}, skipping", itemId);
                    continue;
                }
                
                boolean isWide = dimensions.getAspectRatio() >= WIDE_IMAGE_THRESHOLD;
                
                // **CONSTRAINT CHECK: Wide image placement rules**
                if (isWide && consecutiveWideCount >= MAX_WIDE_STREAK) {
                    continue; // Skip wide images if streak limit reached
                }
                
                if (!isWide && consecutiveWideCount > 0 && itemsSinceLastWide < MIN_NARROW_AFTER_WIDE) {
                    // Prefer narrow images to break wide streaks
                }
                
                // **SCORING: Calculate placement score**
                int targetColumn = findBestColumn(columnHeights, isWide, columns);
                double score = calculatePlacementScore(dimensions, columnHeights, targetColumn, 
                        isWide, consecutiveWideCount, itemsSinceLastWide, columns);
                
                if (score > bestScore) {
                    bestScore = score;
                    bestItem = itemId;
                    bestColumn = targetColumn;
                    bestIsWide = isWide;
                }
            }
            
            // **PLACEMENT: Add best item to ordering**
            if (bestItem != null) {
                ordered.add(bestItem);
                remaining.remove(bestItem);
                
                // Update column heights
                ImageDimensions dimensions = dimensionMap.get(bestItem);
                updateColumnHeights(columnHeights, dimensions, bestColumn, bestIsWide, columns);
                
                // Update streak tracking
                if (bestIsWide) {
                    consecutiveWideCount++;
                    itemsSinceLastWide = 0;
                } else {
                    consecutiveWideCount = 0;
                    itemsSinceLastWide++;
                }
                
                logger.debug("Placed item {} ({}x{}, wide={}) in column {}, score={:.3f}", 
                        bestItem, dimensions.getWidth(), dimensions.getHeight(), 
                        bestIsWide, bestColumn, bestScore);
                
            } else {
                // **FALLBACK: No valid item found, take first remaining**
                bestItem = remaining.iterator().next();
                ordered.add(bestItem);
                remaining.remove(bestItem);
                consecutiveWideCount = 0;
                itemsSinceLastWide++;
                
                logger.warn("No optimal item found, using fallback item {}", bestItem);
            }
        }
        
        logger.debug("Ordering calculation completed for {} columns. Final heights: {}", 
                columns, Arrays.toString(columnHeights));
        
        return ordered;
    }
    
    /**
     * Find the best column for placing an item based on current heights
     */
    private int findBestColumn(double[] columnHeights, boolean isWide, int totalColumns) {
        if (isWide && totalColumns >= 2) {
            // For wide images, find the pair of adjacent columns with minimum combined height
            int bestColumn = 0;
            double minCombinedHeight = Double.MAX_VALUE;
            
            for (int i = 0; i < totalColumns - 1; i++) {
                double combinedHeight = Math.max(columnHeights[i], columnHeights[i + 1]);
                if (combinedHeight < minCombinedHeight) {
                    minCombinedHeight = combinedHeight;
                    bestColumn = i;
                }
            }
            return bestColumn;
        } else {
            // For narrow images, find the shortest column
            int shortestColumn = 0;
            for (int i = 1; i < columnHeights.length; i++) {
                if (columnHeights[i] < columnHeights[shortestColumn]) {
                    shortestColumn = i;
                }
            }
            return shortestColumn;
        }
    }
    
    /**
     * Calculate placement score for an item in a specific position
     */
    private double calculatePlacementScore(ImageDimensions dimensions, double[] columnHeights, 
                                         int targetColumn, boolean isWide, 
                                         int consecutiveWideCount, int itemsSinceLastWide, 
                                         int totalColumns) {
        
        double score = 0.0;
        
        // **BASE SCORE: Height balancing**
        if (isWide && totalColumns >= 2) {
            double maxHeight = Math.max(columnHeights[targetColumn], columnHeights[targetColumn + 1]);
            score -= maxHeight; // Prefer shorter combined columns
        } else {
            score -= columnHeights[targetColumn]; // Prefer shorter columns
        }
        
        // **WEIGHTED SCORING: Apply bias for wide images if enabled**
        if (ENABLE_WEIGHTED_SCORING && isWide) {
            score *= WIDE_IMAGE_BIAS;
        }
        
        // **DIVERSITY BONUS: Encourage breaking wide streaks**
        if (!isWide && consecutiveWideCount > 0) {
            score += 50.0; // Bonus for breaking wide streaks
        }
        
        // **ASPECT RATIO BONUS: Prefer images that fit well**
        double aspectRatio = dimensions.getAspectRatio();
        if (isWide && aspectRatio >= 1.5) {
            score += 20.0; // Bonus for genuinely wide images
        }
        
        return score;
    }
    
    /**
     * Update column heights after placing an item
     */
    private void updateColumnHeights(double[] columnHeights, ImageDimensions dimensions, 
                                   int targetColumn, boolean isWide, int totalColumns) {
        
        // Calculate item height assuming a fixed width (normalized to 280px for consistency)
        double itemHeight = 280.0 / dimensions.getAspectRatio();
        
        if (isWide && totalColumns >= 2 && targetColumn < totalColumns - 1) {
            // Wide image spans two columns
            double maxHeight = Math.max(columnHeights[targetColumn], columnHeights[targetColumn + 1]);
            columnHeights[targetColumn] = maxHeight + itemHeight;
            columnHeights[targetColumn + 1] = maxHeight + itemHeight;
        } else {
            // Normal image occupies one column
            columnHeights[targetColumn] += itemHeight;
        }
    }
    
    /**
     * Create an empty ordering response for issues with no submissions
     */
    private MasonryOrderApiResponse createEmptyOrderResponse(Long issueId, long startTime) {
        MasonryOrderApiResponse.MasonryOrderResult emptyOrder = 
                new MasonryOrderApiResponse.MasonryOrderResult(
                        new ArrayList<>(), new ArrayList<>(), 0, 0.0, 0);
        
        MasonryOrderApiResponse.OrderCacheInfo cacheInfo = 
                new MasonryOrderApiResponse.OrderCacheInfo(
                        LocalDateTime.now(), issueId, false, "empty",
                        System.currentTimeMillis() - startTime);
        
        return new MasonryOrderApiResponse(emptyOrder, cacheInfo);
    }
    
    /**
     * Generate a version hash for cache invalidation based on submission data
     */
    private String generateVersionHash(List<Submission> submissions) {
        if (submissions == null || submissions.isEmpty()) {
            return "empty";
        }
        
        // Create a hash based on submission IDs and their last modified times
        StringBuilder hashBuilder = new StringBuilder();
        submissions.forEach(s -> {
            hashBuilder.append(s.getId()).append(":")
                      .append(s.getSubmittedAt() != null ? s.getSubmittedAt().hashCode() : 0)
                      .append(";");
        });
        
        return String.valueOf(hashBuilder.toString().hashCode());
    }
    
    /**
     * Legacy method for backward compatibility.
     * Use calculateOptimalOrderingFromSubmissions(Long, List<Submission>) instead for better performance.
     */
    @Deprecated
    public MasonryOrderApiResponse.MasonryOrderResult calculateOptimalOrdering(Long issueId, List<SubmissionResponseDTO> submissionDTOs) {
        logger.warn("Using deprecated calculateOptimalOrdering method with DTOs. " +
                   "Consider upgrading to use Submission entities for better performance.");
        
        if (submissionDTOs == null || submissionDTOs.isEmpty()) {
            return new MasonryOrderApiResponse.MasonryOrderResult(
                    new ArrayList<>(), new ArrayList<>(), 0, 0.0, 0);
        }
        
        // Convert DTOs to dimension map (legacy approach)
        Map<Long, ImageDimensions> dimensionMap = new HashMap<>();
        List<Long> submissionIds = new ArrayList<>();
        
        for (SubmissionResponseDTO dto : submissionDTOs) {
            try {
                ImageDimensions dimensions = imageDimensionService.getImageDimensions(dto.getImageUrl());
                dimensionMap.put(dto.getId(), dimensions);
                submissionIds.add(dto.getId());
            } catch (Exception e) {
                logger.warn("Failed to get dimensions for submission DTO {}: {}", 
                        dto.getId(), e.getMessage());
                dimensionMap.put(dto.getId(), new ImageDimensions(800, 600));
                submissionIds.add(dto.getId());
            }
        }
        
        // Use legacy algorithm path
        Map<Long, Submission> submissionMap = new HashMap<>(); // Empty for DTO-based calls
        List<Long> order2Col = calculateOptimalOrder(submissionIds, dimensionMap, submissionMap, 2);
        List<Long> order4Col = calculateOptimalOrder(submissionIds, dimensionMap, submissionMap, 4);
        
        // Calculate metadata
        double avgAspectRatio = dimensionMap.values().stream()
                .mapToDouble(ImageDimensions::getAspectRatio)
                .average()
                .orElse(0.0);
        
        int wideImageCount = (int) dimensionMap.values().stream()
                .filter(d -> d.getAspectRatio() >= WIDE_IMAGE_THRESHOLD)
                .count();
        
        return new MasonryOrderApiResponse.MasonryOrderResult(
                order2Col, order4Col, submissionDTOs.size(), avgAspectRatio, wideImageCount);
    }
} 