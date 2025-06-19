package com.munichweekly.backend.repository;

import com.munichweekly.backend.model.GallerySubmissionOrder;
import com.munichweekly.backend.model.GalleryIssueConfig;
import com.munichweekly.backend.model.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for GallerySubmissionOrder entity.
 * Provides methods for managing submission ordering within gallery configurations.
 */
public interface GallerySubmissionOrderRepository extends JpaRepository<GallerySubmissionOrder, Long> {

    /**
     * Find all submission orders for a gallery configuration, ordered by display order.
     */
    List<GallerySubmissionOrder> findByGalleryConfigOrderByDisplayOrderAsc(GalleryIssueConfig galleryConfig);

    /**
     * Find all submission orders for a gallery configuration by ID, ordered by display order.
     */
    List<GallerySubmissionOrder> findByGalleryConfigIdOrderByDisplayOrderAsc(Long galleryConfigId);

    /**
     * Find submission order by gallery config and submission.
     */
    Optional<GallerySubmissionOrder> findByGalleryConfigAndSubmission(GalleryIssueConfig galleryConfig, Submission submission);

    /**
     * Find submission order by gallery config ID and submission ID.
     */
    Optional<GallerySubmissionOrder> findByGalleryConfigIdAndSubmissionId(Long galleryConfigId, Long submissionId);

    /**
     * Check if a submission order exists for the given gallery config and submission.
     */
    boolean existsByGalleryConfigAndSubmission(GalleryIssueConfig galleryConfig, Submission submission);

    /**
     * Check if a submission order exists for the given gallery config ID and submission ID.
     */
    boolean existsByGalleryConfigIdAndSubmissionId(Long galleryConfigId, Long submissionId);

    /**
     * Find submission order by gallery config and display order.
     */
    Optional<GallerySubmissionOrder> findByGalleryConfigAndDisplayOrder(GalleryIssueConfig galleryConfig, Integer displayOrder);

    /**
     * Find submission order by gallery config ID and display order.
     */
    Optional<GallerySubmissionOrder> findByGalleryConfigIdAndDisplayOrder(Long galleryConfigId, Integer displayOrder);

    /**
     * Find the maximum display order for a gallery configuration.
     */
    @Query("SELECT COALESCE(MAX(gso.displayOrder), 0) FROM GallerySubmissionOrder gso WHERE gso.galleryConfig.id = :galleryConfigId")
    Integer findMaxDisplayOrderByGalleryConfigId(@Param("galleryConfigId") Long galleryConfigId);

    /**
     * Find submission orders with display order greater than the specified value for a gallery config.
     * Used for reordering operations.
     */
    List<GallerySubmissionOrder> findByGalleryConfigAndDisplayOrderGreaterThanOrderByDisplayOrderAsc(
            GalleryIssueConfig galleryConfig, Integer displayOrder);

    /**
     * Find submission orders with display order greater than or equal to the specified value for a gallery config.
     */
    List<GallerySubmissionOrder> findByGalleryConfigAndDisplayOrderGreaterThanEqualOrderByDisplayOrderAsc(
            GalleryIssueConfig galleryConfig, Integer displayOrder);

    /**
     * Count submission orders for a gallery configuration.
     */
    long countByGalleryConfig(GalleryIssueConfig galleryConfig);

    /**
     * Count submission orders for a gallery configuration by ID.
     */
    long countByGalleryConfigId(Long galleryConfigId);

    /**
     * Delete all submission orders for a gallery configuration.
     */
    @Modifying
    @Transactional
    void deleteByGalleryConfig(GalleryIssueConfig galleryConfig);

    /**
     * Delete all submission orders for a gallery configuration by ID.
     */
    @Modifying
    @Query("DELETE FROM GallerySubmissionOrder gso WHERE gso.galleryConfig.id = :galleryConfigId")
    void deleteByGalleryConfigId(@Param("galleryConfigId") Long galleryConfigId);

    /**
     * Find submission orders with their submission details for a gallery configuration.
     * Fetches submission and user data to avoid N+1 queries.
     */
    @Query("""
        SELECT gso FROM GallerySubmissionOrder gso
        JOIN FETCH gso.submission s
        JOIN FETCH s.user u
        WHERE gso.galleryConfig.id = :galleryConfigId
        ORDER BY gso.displayOrder ASC
        """)
    List<GallerySubmissionOrder> findByGalleryConfigIdWithSubmissionDetails(@Param("galleryConfigId") Long galleryConfigId);

    /**
     * Find available selected submissions for a gallery configuration.
     * Returns submissions with status 'selected' that are not already in the gallery configuration.
     */
    @Query("""
        SELECT s FROM Submission s
        JOIN FETCH s.user u
        WHERE s.issue.id = :issueId
        AND s.status = 'selected'
        AND NOT EXISTS (
            SELECT 1 FROM GallerySubmissionOrder gso
            WHERE gso.submission = s
            AND gso.galleryConfig.id = :galleryConfigId
        )
        ORDER BY s.submittedAt ASC
        """)
    List<Submission> findAvailableSelectedSubmissions(@Param("issueId") Long issueId, @Param("galleryConfigId") Long galleryConfigId);

    /**
     * Update display orders for batch reordering.
     * Shifts display orders by the specified offset for orders greater than or equal to the start order.
     */
    @Modifying
    @Transactional
    @Query("""
        UPDATE GallerySubmissionOrder gso
        SET gso.displayOrder = gso.displayOrder + :offset
        WHERE gso.galleryConfig.id = :galleryConfigId
        AND gso.displayOrder >= :startOrder
        """)
    int updateDisplayOrdersWithOffset(@Param("galleryConfigId") Long galleryConfigId, 
                                     @Param("startOrder") Integer startOrder, 
                                     @Param("offset") Integer offset);
} 