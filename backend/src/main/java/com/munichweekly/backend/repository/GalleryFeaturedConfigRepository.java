package com.munichweekly.backend.repository;

import com.munichweekly.backend.model.GalleryFeaturedConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Gallery featured configuration repository
 * Provides data access functionality for Gallery featured configurations
 */
@Repository
public interface GalleryFeaturedConfigRepository extends JpaRepository<GalleryFeaturedConfig, Long> {

    /**
     * Find currently active configuration
     * Used to get featured configuration for frontend display
     * 
     * @return Active configuration, or empty if none exists
     */
    @Query("SELECT gfc FROM GalleryFeaturedConfig gfc WHERE gfc.isActive = true ORDER BY gfc.updatedAt DESC")
    Optional<GalleryFeaturedConfig> findActiveConfig();

    /**
     * Find latest active configuration (limit 1)
     * Ensures only one active configuration is returned
     * 
     * @return Latest active configuration
     */
    @Query(value = "SELECT * FROM gallery_featured_config WHERE is_active = true ORDER BY updated_at DESC LIMIT 1", 
           nativeQuery = true)
    Optional<GalleryFeaturedConfig> findLatestActiveConfig();

    /**
     * Find all configurations (for admin use)
     * Ordered by update time in descending order
     * 
     * @return List of all configurations
     */
    @Query("SELECT gfc FROM GalleryFeaturedConfig gfc ORDER BY gfc.updatedAt DESC")
    List<GalleryFeaturedConfig> findAllOrderByUpdatedAtDesc();

    /**
     * Find configurations created by specified user
     * Used for admin to view their own created configurations
     * 
     * @param userId User ID
     * @return List of configurations created by this user
     */
    @Query("SELECT gfc FROM GalleryFeaturedConfig gfc WHERE gfc.createdByUserId = :userId ORDER BY gfc.updatedAt DESC")
    List<GalleryFeaturedConfig> findByCreatedByUserIdOrderByUpdatedAtDesc(@Param("userId") Long userId);

    /**
     * Check if other active configurations exist (excluding specified ID)
     * Used to ensure only one active configuration at a time
     * 
     * @param excludeId Configuration ID to exclude
     * @return Whether other active configurations exist
     */
    @Query("SELECT COUNT(gfc) > 0 FROM GalleryFeaturedConfig gfc WHERE gfc.isActive = true AND gfc.id != :excludeId")
    boolean existsActiveConfigExcluding(@Param("excludeId") Long excludeId);

    /**
     * Check if active configuration exists
     * 
     * @return Whether active configuration exists
     */
    @Query("SELECT COUNT(gfc) > 0 FROM GalleryFeaturedConfig gfc WHERE gfc.isActive = true")
    boolean existsActiveConfig();

    /**
     * Find configurations containing specific submission ID
     * Used to check if a submission has been added to featured
     * 
     * @param submissionId Submission ID
     * @return List of configurations containing this submission
     */
    @Query(value = "SELECT * FROM gallery_featured_config WHERE :submissionId = ANY(submission_ids)", 
           nativeQuery = true)
    List<GalleryFeaturedConfig> findConfigsContainingSubmissionId(@Param("submissionId") Integer submissionId);

    /**
     * Find active configuration containing specific submission ID
     * Used to check if a submission is in current active featured
     * 
     * @param submissionId Submission ID
     * @return Active configuration containing this submission
     */
    @Query(value = "SELECT * FROM gallery_featured_config WHERE is_active = true AND :submissionId = ANY(submission_ids) ORDER BY updated_at DESC LIMIT 1", 
           nativeQuery = true)
    Optional<GalleryFeaturedConfig> findActiveConfigContainingSubmissionId(@Param("submissionId") Integer submissionId);

    /**
     * Count total featured submissions in active configuration
     * Used for displaying statistics
     * 
     * @return Total number of featured submissions
     */
    @Query(value = "SELECT COALESCE(array_length(submission_ids, 1), 0) FROM gallery_featured_config WHERE is_active = true ORDER BY updated_at DESC LIMIT 1", 
           nativeQuery = true)
    Integer countFeaturedSubmissionsInActiveConfig();

    /**
     * Deactivate all other configurations (excluding specified ID)
     * Used to ensure only one active configuration at a time
     * 
     * @param excludeId Configuration ID to keep active
     * @return Number of affected rows
     */
    @Modifying
    @Query("UPDATE GalleryFeaturedConfig gfc SET gfc.isActive = false WHERE gfc.id != :excludeId AND gfc.isActive = true")
    int deactivateOtherConfigs(@Param("excludeId") Long excludeId);

    /**
     * Deactivate all configurations
     * Used to reset all configuration states
     * 
     * @return Number of affected rows
     */
    @Modifying
    @Query("UPDATE GalleryFeaturedConfig gfc SET gfc.isActive = false WHERE gfc.isActive = true")
    int deactivateAllConfigs();
} 