package com.munichweekly.backend.repository;

import com.munichweekly.backend.model.PromotionImage;
import com.munichweekly.backend.model.PromotionConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * Promotion image Repository
 * Provides data access functionality for promotion images
 */
@Repository
public interface PromotionImageRepository extends JpaRepository<PromotionImage, Long> {

    /**
     * Find all images by promotion configuration, sorted by display order
     * Used for promotion page display
     */
    List<PromotionImage> findByPromotionConfigOrderByDisplayOrderAsc(PromotionConfig promotionConfig);

    /**
     * Find all images by promotion configuration ID, sorted by display order
     * Used for promotion page display (by configuration ID)
     */
    @Query("SELECT pi FROM PromotionImage pi WHERE pi.promotionConfig.id = :configId ORDER BY pi.displayOrder ASC")
    List<PromotionImage> findByPromotionConfigIdOrderByDisplayOrderAsc(Long configId);

    /**
     * Delete all images of specified promotion configuration
     * Used for cascade operations when deleting promotion configuration
     */
    void deleteByPromotionConfig(PromotionConfig promotionConfig);

    /**
     * Count images of specified promotion configuration
     * Used for displaying statistics in admin interface
     */
    long countByPromotionConfig(PromotionConfig promotionConfig);

    /**
     * Get maximum display order in specified promotion configuration
     * Used to automatically set order when adding new images
     */
    @Query("SELECT COALESCE(MAX(pi.displayOrder), 0) FROM PromotionImage pi WHERE pi.promotionConfig = :config")
    Integer findMaxDisplayOrderByPromotionConfig(PromotionConfig config);
} 