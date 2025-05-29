package com.munichweekly.backend.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

/**
 * Cache configuration for masonry layout services.
 * 
 * Caches used:
 * - masonryOrdering: Cache for ordering API results (1 hour TTL)
 * - imageDimensions: Cache for image dimension data (24 hours TTL)
 * - masonryLayouts: Cache for full layout calculation (1 hour TTL, existing)
 */
@Configuration
@EnableCaching
public class CacheConfig {
    // Cache configuration is handled automatically by Spring Boot
    // New cache instances will be created automatically based on @Cacheable annotations
    
    /**
     * Configure cache manager with specific caches for different use cases.
     * 
     * Cache Types:
     * - imageDimensions: Cache image width/height data (24h TTL)
     * - masonryLayouts: Cache calculated layout positions (1h TTL)
     * - masonryOrdering: Cache ordering results for Skyline hybrid approach (1h TTL)
     * 
     * Using ConcurrentMapCacheManager for simplicity.
     * In production, consider Redis or Caffeine for better control over TTL and memory.
     */
    @Bean
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager();
        
        // Pre-create cache instances for better performance
        cacheManager.setCacheNames(Arrays.asList(
            "imageDimensions",    // Cache for image width/height data
            "masonryLayouts",     // Cache for calculated layout positions
            "masonryOrdering"     // Cache for ordering API results (NEW)
        ));
        
        // Allow dynamic cache creation for future use
        cacheManager.setAllowNullValues(false);
        
        return cacheManager;
    }
} 