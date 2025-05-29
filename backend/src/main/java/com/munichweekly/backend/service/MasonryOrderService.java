package com.munichweekly.backend.service;

import com.munichweekly.backend.dto.MasonryOrderApiResponse;
import com.munichweekly.backend.dto.SubmissionResponseDTO;
import com.munichweekly.backend.model.ImageDimensions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for calculating optimal masonry ordering for different column configurations.
 * Uses the same high-quality algorithms as the original layout service but only returns ordering.
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
     * Calculate optimal ordering for both 2-column and 4-column layouts
     * 
     * @param issueId The issue ID for logging/debugging
     * @param submissions List of submissions to order
     * @return MasonryOrderResult with optimal orderings for both column counts
     */
    public MasonryOrderApiResponse.MasonryOrderResult calculateOptimalOrdering(
        Long issueId, 
        List<SubmissionResponseDTO> submissions
    ) {
        long startTime = System.currentTimeMillis();
        
        logger.info("🎯 MASONRY排序算法开始: issueId={}, submissions={}", 
                   issueId, submissions != null ? submissions.size() : 0);
        
        if (submissions == null || submissions.isEmpty()) {
            logger.info("📋 排序计算完成: 空投稿列表");
            return new MasonryOrderApiResponse.MasonryOrderResult(
                new ArrayList<>(), new ArrayList<>(), 0, 0.0, 0
            );
        }
        
        // **STEP 1: Prepare items with image dimensions**
        List<PreparedItem> preparedItems = prepareItems(submissions);
        
        if (preparedItems.isEmpty()) {
            logger.warn("⚠️ 所有图片预处理失败，返回原始顺序");
            List<Long> originalOrder = submissions.stream()
                .map(SubmissionResponseDTO::getId)
                .collect(Collectors.toList());
            return new MasonryOrderApiResponse.MasonryOrderResult(
                originalOrder, originalOrder, submissions.size(), 0.0, 0
            );
        }
        
        // **STEP 2: Calculate optimal ordering for 2 columns**
        List<Long> orderedIds2col = calculateOptimalOrderingForColumns(preparedItems, 2);
        
        // **STEP 3: Calculate optimal ordering for 4 columns**
        List<Long> orderedIds4col = calculateOptimalOrderingForColumns(preparedItems, 4);
        
        // **STEP 4: Calculate metadata**
        double avgAspectRatio = preparedItems.stream()
            .mapToDouble(PreparedItem::getAspectRatio)
            .average()
            .orElse(0.0);
        
        int wideImageCount = (int) preparedItems.stream()
            .filter(PreparedItem::isWide)
            .count();
        
        long duration = System.currentTimeMillis() - startTime;
        logger.info("✅ MASONRY排序完成: 耗时{}ms, 2列顺序={}, 4列顺序={}, 宽图={}/{}", 
                   duration, orderedIds2col.size(), orderedIds4col.size(), wideImageCount, preparedItems.size());
        
        return new MasonryOrderApiResponse.MasonryOrderResult(
            orderedIds2col, orderedIds4col, preparedItems.size(), avgAspectRatio, wideImageCount
        );
    }
    
    /**
     * Prepare items with image dimensions and basic layout info
     */
    private List<PreparedItem> prepareItems(List<SubmissionResponseDTO> submissions) {
        List<PreparedItem> results = new ArrayList<>();
        int successCount = 0;
        
        for (int i = 0; i < submissions.size(); i++) {
            SubmissionResponseDTO submission = submissions.get(i);
            
            try {
                // Get image dimensions
                ImageDimensions dimensions = imageDimensionService.getImageDimensions(submission.getImageUrl());
                
                double aspectRatio = dimensions.getAspectRatio();
                boolean isWide = aspectRatio >= WIDE_IMAGE_THRESHOLD;
                
                PreparedItem item = new PreparedItem(
                    submission.getId(),
                    submission,
                    aspectRatio,
                    isWide
                );
                results.add(item);
                successCount++;
                
                logger.debug("📋 物品[{}] ID={}: 宽比={:.2f} {}", 
                           i, submission.getId(), aspectRatio, isWide ? "📐宽图" : "📏普通");
                
            } catch (Exception e) {
                logger.warn("⚠️ 图片预处理失败 [{}] ID={}: {}", i, submission.getId(), e.getMessage());
                
                // Create fallback item with default aspect ratio
                PreparedItem item = new PreparedItem(
                    submission.getId(),
                    submission,
                    4.0 / 3.0, // Default 4:3 aspect ratio
                    false
                );
                results.add(item);
            }
        }
        
        logger.info("📦 物品预处理完成: {} -> {} 个有效物品", submissions.size(), successCount);
        return results;
    }
    
    /**
     * Calculate optimal ordering for a specific column count using Greedy Best-Fit algorithm
     */
    private List<Long> calculateOptimalOrderingForColumns(List<PreparedItem> preparedItems, int columnCount) {
        
        logger.info("🚀 开始{}列排序算法: {} 个物品", columnCount, preparedItems.size());
        
        // Initialize column heights (virtual)
        int[] heights = new int[columnCount];
        List<Long> orderedIds = new ArrayList<>();
        
        // Create a pool of remaining items to place
        List<PreparedItem> pool = new ArrayList<>(preparedItems);
        
        // **WIDE IMAGE STREAK LIMITING**
        int wideStreak = 0;
        int narrowStreak = 0;
        
        // **GREEDY BEST-FIT MAIN LOOP**
        while (!pool.isEmpty()) {
            
            // **CANDIDATE FILTERING WITH WIDE IMAGE LIMITING**
            List<PreparedItem> candidates = getCandidates(pool, wideStreak, narrowStreak);
            
            // **BEST-FIT ALGORITHM** - Find optimal position for remaining candidates
            BestChoice bestChoice = findBestPosition(candidates, pool, heights, columnCount);
            
            if (bestChoice.getItem() != null) {
                PreparedItem item = bestChoice.getItem();
                
                logger.debug("📍 选择放置[{}列]: ID={}, 位置=列{}-{}, Y={}, 分数={:.2f} {}", 
                           columnCount, item.getSubmissionId(), bestChoice.getColumnStart(), 
                           bestChoice.getColumnStart() + bestChoice.getSpan() - 1,
                           bestChoice.getY(), bestChoice.getScore(),
                           item.isWide() ? "📐宽图" : "📏普通");
                
                // Remove the chosen item from the pool
                pool.remove(bestChoice.getPoolIndex());
                
                // Add to ordered list
                orderedIds.add(item.getSubmissionId());
                
                // Update virtual heights (using standard heights for consistency)
                int newHeight = bestChoice.getY() + 300 + 20; // Standard item height + gap
                for (int i = bestChoice.getColumnStart(); i < bestChoice.getColumnStart() + bestChoice.getSpan(); i++) {
                    heights[i] = newHeight;
                }
                
                // **UPDATE STREAK COUNTERS**
                if (item.isWide()) {
                    wideStreak += 1;
                    narrowStreak = 0;
                } else {
                    narrowStreak += 1;
                    if (narrowStreak >= MIN_NARROW_AFTER_WIDE) {
                        wideStreak = 0;
                    }
                }
            } else {
                // Safety break if no valid placement found
                logger.warn("⚠️ {}列算法异常: 无法为剩余 {} 个物品找到有效位置", columnCount, pool.size());
                // Add remaining items in original order
                pool.forEach(item -> orderedIds.add(item.getSubmissionId()));
                break;
            }
        }
        
        logger.info("📊 {}列算法完成: 排序了 {} 个物品", columnCount, orderedIds.size());
        return orderedIds;
    }
    
    /**
     * Get candidate items for placement, applying wide image streak limiting
     */
    private List<PreparedItem> getCandidates(List<PreparedItem> pool, int wideStreak, int narrowStreak) {
        if (wideStreak >= MAX_WIDE_STREAK && narrowStreak < MIN_NARROW_AFTER_WIDE) {
            List<PreparedItem> narrowCandidates = pool.stream()
                .filter(item -> !item.isWide())
                .collect(Collectors.toList());
            
            if (!narrowCandidates.isEmpty()) {
                return narrowCandidates;
            }
        }
        
        return pool; // Return all items if no filtering needed
    }
    
    /**
     * Find the best position for candidates using weighted scoring algorithm
     */
    private BestChoice findBestPosition(List<PreparedItem> candidates, List<PreparedItem> pool, 
                                      int[] heights, int columnCount) {
        BestChoice bestChoice = new BestChoice();
        
        for (PreparedItem item : candidates) {
            int span = item.isWide() ? Math.min(2, columnCount) : 1;
            int poolIndex = pool.indexOf(item);
            
            // Try placing this item in each possible column position
            for (int columnStart = 0; columnStart <= columnCount - span; columnStart++) {
                // Find the maximum height among the columns this item would span
                int y = 0;
                for (int i = columnStart; i < columnStart + span; i++) {
                    y = Math.max(y, heights[i]);
                }
                
                // Calculate score based on algorithm choice
                double score = ENABLE_WEIGHTED_SCORING ? 
                    y / Math.pow(span, WIDE_IMAGE_BIAS) : y;
                
                // Update best choice if this position is better
                if (score < bestChoice.getScore()) {
                    bestChoice.setItem(item);
                    bestChoice.setPoolIndex(poolIndex);
                    bestChoice.setColumnStart(columnStart);
                    bestChoice.setSpan(span);
                    bestChoice.setY(y);
                    bestChoice.setScore(score);
                }
            }
        }
        
        return bestChoice;
    }
    
    /**
     * Internal class to represent a prepared item for ordering calculation
     */
    private static class PreparedItem {
        private final Long submissionId;
        private final SubmissionResponseDTO submission;
        private final double aspectRatio;
        private final boolean isWide;
        
        public PreparedItem(Long submissionId, SubmissionResponseDTO submission, 
                          double aspectRatio, boolean isWide) {
            this.submissionId = submissionId;
            this.submission = submission;
            this.aspectRatio = aspectRatio;
            this.isWide = isWide;
        }
        
        // Getters
        public Long getSubmissionId() { return submissionId; }
        public SubmissionResponseDTO getSubmission() { return submission; }
        public double getAspectRatio() { return aspectRatio; }
        public boolean isWide() { return isWide; }
    }
    
    /**
     * Internal class to track the best placement choice during algorithm execution
     */
    private static class BestChoice {
        private PreparedItem item;
        private int poolIndex = -1;
        private int columnStart = 0;
        private int span = 1;
        private int y = 0;
        private double score = Double.MAX_VALUE;
        
        // Getters and setters
        public PreparedItem getItem() { return item; }
        public void setItem(PreparedItem item) { this.item = item; }
        public int getPoolIndex() { return poolIndex; }
        public void setPoolIndex(int poolIndex) { this.poolIndex = poolIndex; }
        public int getColumnStart() { return columnStart; }
        public void setColumnStart(int columnStart) { this.columnStart = columnStart; }
        public int getSpan() { return span; }
        public void setSpan(int span) { this.span = span; }
        public int getY() { return y; }
        public void setY(int y) { this.y = y; }
        public double getScore() { return score; }
        public void setScore(double score) { this.score = score; }
    }
} 