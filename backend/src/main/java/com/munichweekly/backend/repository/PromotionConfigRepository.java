package com.munichweekly.backend.repository;

import com.munichweekly.backend.model.PromotionConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * Promotion configuration Repository
 * Provides data access functionality for promotion configuration
 */
@Repository
public interface PromotionConfigRepository extends JpaRepository<PromotionConfig, Long> {

    /**
     * Find enabled promotion configuration
     * Used to get currently active promotion information
     */
    @Query("SELECT pc FROM PromotionConfig pc WHERE pc.isEnabled = true")
    Optional<PromotionConfig> findEnabledConfig();

    /**
     * Find promotion configuration by page URL
     * Used to validate URL when accessing promotion page
     */
    Optional<PromotionConfig> findByPageUrl(String pageUrl);

    /**
     * Check if configuration with specified page URL exists (excluding specified ID)
     * Used to check URL uniqueness when updating
     */
    @Query("SELECT COUNT(pc) > 0 FROM PromotionConfig pc WHERE pc.pageUrl = :pageUrl AND pc.id != :excludeId")
    boolean existsByPageUrlAndIdNot(String pageUrl, Long excludeId);

    /**
     * Check if configuration with specified page URL exists
     * Used to check URL uniqueness when creating new
     */
    boolean existsByPageUrl(String pageUrl);
} 