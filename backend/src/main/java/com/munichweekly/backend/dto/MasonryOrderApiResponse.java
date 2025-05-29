package com.munichweekly.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * API response DTO for masonry ordering endpoint.
 * Contains pre-calculated ordering for different column configurations.
 */
public class MasonryOrderApiResponse {
    
    private MasonryOrderResult order;
    private OrderCacheInfo cacheInfo;
    
    public MasonryOrderApiResponse() {}
    
    public MasonryOrderApiResponse(MasonryOrderResult order, OrderCacheInfo cacheInfo) {
        this.order = order;
        this.cacheInfo = cacheInfo;
    }
    
    // Getters and setters
    public MasonryOrderResult getOrder() {
        return order;
    }
    
    public void setOrder(MasonryOrderResult order) {
        this.order = order;
    }
    
    public OrderCacheInfo getCacheInfo() {
        return cacheInfo;
    }
    
    public void setCacheInfo(OrderCacheInfo cacheInfo) {
        this.cacheInfo = cacheInfo;
    }
    
    /**
     * The pre-calculated optimal ordering for different column counts
     */
    public static class MasonryOrderResult {
        private List<Long> orderedIds2col;  // 2列布局的最优顺序
        private List<Long> orderedIds4col;  // 4列布局的最优顺序
        private int totalItems;
        private double avgAspectRatio;      // 平均宽高比，供前端参考
        private int wideImageCount;        // 宽图数量
        
        public MasonryOrderResult() {}
        
        public MasonryOrderResult(List<Long> orderedIds2col, List<Long> orderedIds4col, 
                                int totalItems, double avgAspectRatio, int wideImageCount) {
            this.orderedIds2col = orderedIds2col;
            this.orderedIds4col = orderedIds4col;
            this.totalItems = totalItems;
            this.avgAspectRatio = avgAspectRatio;
            this.wideImageCount = wideImageCount;
        }
        
        // Getters and setters
        public List<Long> getOrderedIds2col() {
            return orderedIds2col;
        }
        
        public void setOrderedIds2col(List<Long> orderedIds2col) {
            this.orderedIds2col = orderedIds2col;
        }
        
        public List<Long> getOrderedIds4col() {
            return orderedIds4col;
        }
        
        public void setOrderedIds4col(List<Long> orderedIds4col) {
            this.orderedIds4col = orderedIds4col;
        }
        
        public int getTotalItems() {
            return totalItems;
        }
        
        public void setTotalItems(int totalItems) {
            this.totalItems = totalItems;
        }
        
        public double getAvgAspectRatio() {
            return avgAspectRatio;
        }
        
        public void setAvgAspectRatio(double avgAspectRatio) {
            this.avgAspectRatio = avgAspectRatio;
        }
        
        public int getWideImageCount() {
            return wideImageCount;
        }
        
        public void setWideImageCount(int wideImageCount) {
            this.wideImageCount = wideImageCount;
        }
    }
    
    /**
     * Cache and metadata information for the ordering calculation
     */
    public static class OrderCacheInfo {
        private LocalDateTime timestamp;
        private Long issueId;
        private boolean isFromCache;
        private String dataVersionHash;
        private long calculationTimeMs;
        
        public OrderCacheInfo() {}
        
        public OrderCacheInfo(LocalDateTime timestamp, Long issueId, boolean isFromCache, 
                            String dataVersionHash, long calculationTimeMs) {
            this.timestamp = timestamp;
            this.issueId = issueId;
            this.isFromCache = isFromCache;
            this.dataVersionHash = dataVersionHash;
            this.calculationTimeMs = calculationTimeMs;
        }
        
        // Getters and setters
        public LocalDateTime getTimestamp() {
            return timestamp;
        }
        
        public void setTimestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
        }
        
        public Long getIssueId() {
            return issueId;
        }
        
        public void setIssueId(Long issueId) {
            this.issueId = issueId;
        }
        
        public boolean isFromCache() {
            return isFromCache;
        }
        
        public void setFromCache(boolean isFromCache) {
            this.isFromCache = isFromCache;
        }
        
        public String getDataVersionHash() {
            return dataVersionHash;
        }
        
        public void setDataVersionHash(String dataVersionHash) {
            this.dataVersionHash = dataVersionHash;
        }
        
        public long getCalculationTimeMs() {
            return calculationTimeMs;
        }
        
        public void setCalculationTimeMs(long calculationTimeMs) {
            this.calculationTimeMs = calculationTimeMs;
        }
    }
} 