package com.munichweekly.backend.repository;

import com.munichweekly.backend.model.GalleryIssueConfig;
import com.munichweekly.backend.model.Issue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for GalleryIssueConfig entity.
 * Provides methods for managing gallery issue configurations.
 */
public interface GalleryIssueConfigRepository extends JpaRepository<GalleryIssueConfig, Long> {

    /**
     * Find all published gallery configurations ordered by display order.
     * Used for public gallery display.
     */
    @Query("SELECT gc FROM GalleryIssueConfig gc JOIN FETCH gc.issue WHERE gc.isPublished = true ORDER BY gc.displayOrder ASC")
    List<GalleryIssueConfig> findByIsPublishedTrueOrderByDisplayOrderAsc();

    /**
     * Find all gallery configurations ordered by display order.
     * Used for admin management interface.
     */
    @Query("SELECT gc FROM GalleryIssueConfig gc JOIN FETCH gc.issue ORDER BY gc.displayOrder ASC")
    List<GalleryIssueConfig> findAllByOrderByDisplayOrderAsc();

    /**
     * Find gallery configuration by issue ID.
     */
    Optional<GalleryIssueConfig> findByIssue(Issue issue);

    /**
     * Find gallery configuration by issue ID.
     */
    Optional<GalleryIssueConfig> findByIssueId(Long issueId);

    /**
     * Check if a gallery configuration exists for the given issue.
     */
    boolean existsByIssue(Issue issue);

    /**
     * Check if a gallery configuration exists for the given issue ID.
     */
    boolean existsByIssueId(Long issueId);

    /**
     * Find published gallery configurations with submission count.
     * This query gets the configs first, then we'll get the counts separately to avoid JOIN FETCH + GROUP BY issues.
     */
    @Query("""
        SELECT gc, COUNT(gso.id) as submissionCount
        FROM GalleryIssueConfig gc
        LEFT JOIN gc.submissionOrders gso
        WHERE gc.isPublished = true
        GROUP BY gc.id
        ORDER BY gc.displayOrder ASC
        """)
    List<Object[]> findPublishedConfigsWithSubmissionCount();

    /**
     * Find all gallery configurations with submission count.
     * Used for admin interface to show all configurations with their submission counts.
     */
    @Query("""
        SELECT gc, COUNT(gso.id) as submissionCount
        FROM GalleryIssueConfig gc
        LEFT JOIN gc.submissionOrders gso
        GROUP BY gc.id
        ORDER BY gc.displayOrder ASC
        """)
    List<Object[]> findAllConfigsWithSubmissionCount();

    /**
     * Find the maximum display order among all configurations.
     * Used for assigning display order to new configurations.
     */
    @Query("SELECT COALESCE(MAX(gc.displayOrder), 0) FROM GalleryIssueConfig gc")
    Integer findMaxDisplayOrder();

    /**
     * Find configurations with display order greater than the specified value.
     * Used for reordering configurations when display order changes.
     */
    List<GalleryIssueConfig> findByDisplayOrderGreaterThanOrderByDisplayOrderAsc(Integer displayOrder);

    /**
     * Find configurations with display order between two values.
     * Used for bulk reordering operations.
     */
    List<GalleryIssueConfig> findByDisplayOrderBetweenOrderByDisplayOrderAsc(Integer startOrder, Integer endOrder);

    /**
     * Count published gallery configurations.
     */
    long countByIsPublishedTrue();

    /**
     * Find gallery configurations ready for publication.
     * Configurations are ready if they have a cover image and at least one submission.
     */
    @Query("""
        SELECT gc FROM GalleryIssueConfig gc
        JOIN FETCH gc.issue
        WHERE gc.coverImageUrl IS NOT NULL
        AND gc.coverImageUrl != ''
        AND EXISTS (SELECT 1 FROM gc.submissionOrders gso WHERE gso.galleryConfig = gc)
        ORDER BY gc.displayOrder ASC
        """)
    List<GalleryIssueConfig> findConfigsReadyForPublication();

    /**
     * Find issues that don't have a gallery configuration yet.
     * Used for admin interface to show available issues for gallery configuration.
     */
    @Query("""
        SELECT i FROM Issue i
        WHERE NOT EXISTS (SELECT 1 FROM GalleryIssueConfig gc WHERE gc.issue = i)
        ORDER BY i.submissionStart DESC
        """)
    List<Issue> findIssuesWithoutGalleryConfig();
} 