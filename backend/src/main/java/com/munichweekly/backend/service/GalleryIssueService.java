package com.munichweekly.backend.service;

import com.munichweekly.backend.dto.*;
import com.munichweekly.backend.model.*;
import com.munichweekly.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.logging.Logger;
import java.util.stream.Collectors;

/**
 * Service for managing Gallery Issue configurations and submission ordering.
 * Handles CRUD operations for gallery configurations and submission display management.
 */
@Service
public class GalleryIssueService {

    private static final Logger logger = Logger.getLogger(GalleryIssueService.class.getName());

    private final GalleryIssueConfigRepository galleryConfigRepository;
    private final GallerySubmissionOrderRepository submissionOrderRepository;
    private final IssueRepository issueRepository;

    @Autowired
    public GalleryIssueService(
            GalleryIssueConfigRepository galleryConfigRepository,
            GallerySubmissionOrderRepository submissionOrderRepository,
            IssueRepository issueRepository) {
        this.galleryConfigRepository = galleryConfigRepository;
        this.submissionOrderRepository = submissionOrderRepository;
        this.issueRepository = issueRepository;
    }

    // Public API Methods

    /**
     * Get all published gallery issue configurations.
     * Used for public gallery display.
     */
    public List<GalleryIssueConfigResponseDTO> getPublishedGalleryIssues() {
        logger.info("Retrieving published gallery issues");

        try {
            // Use simple approach: first get configs with counts, then manually handle Issue loading
            List<Object[]> configsWithCount = galleryConfigRepository.findPublishedConfigsWithSubmissionCount();
            
            List<GalleryIssueConfigResponseDTO> result = new ArrayList<>();
            for (Object[] row : configsWithCount) {
                GalleryIssueConfig config = (GalleryIssueConfig) row[0];
                Long submissionCount = (row[1] != null) ? ((Number) row[1]).longValue() : 0L;
                
                // Load the Issue association manually to avoid lazy loading issues
                Issue issue = issueRepository.findById(config.getIssue().getId()).orElse(null);
                if (issue != null) {
                    // Create DTO without triggering lazy loading
                    GalleryIssueConfigResponseDTO dto = new GalleryIssueConfigResponseDTO();
                    dto.setId(config.getId());
                    dto.setIssueId(issue.getId());
                    dto.setCoverImageUrl(config.getCoverImageUrl());
                    dto.setIsPublished(config.getIsPublished());
                    dto.setDisplayOrder(config.getDisplayOrder());
                    dto.setConfigTitle(config.getConfigTitle());
                    dto.setConfigDescription(config.getConfigDescription());
                    dto.setCreatedAt(config.getCreatedAt());
                    dto.setUpdatedAt(config.getUpdatedAt());
                    dto.setSubmissionCount((int) submissionCount.longValue());
                    
                    // Create issue DTO manually
                    GalleryIssueConfigResponseDTO.IssueBasicDTO issueDTO = new GalleryIssueConfigResponseDTO.IssueBasicDTO();
                    issueDTO.setId(issue.getId());
                    issueDTO.setTitle(issue.getTitle());
                    issueDTO.setDescription(issue.getDescription());
                    issueDTO.setSubmissionStart(issue.getSubmissionStart());
                    issueDTO.setSubmissionEnd(issue.getSubmissionEnd());
                    issueDTO.setVotingStart(issue.getVotingStart());
                    issueDTO.setVotingEnd(issue.getVotingEnd());
                    dto.setIssue(issueDTO);
                    
                    result.add(dto);
                }
            }

            logger.info("Successfully retrieved " + result.size() + " published gallery issues");
            return result;

        } catch (Exception e) {
            logger.severe("Error retrieving published gallery issues: " + e.getMessage());
            throw new RuntimeException("Failed to retrieve published gallery issues", e);
        }
    }

    /**
     * Get gallery issue configuration by issue ID.
     * Returns detailed configuration with submission orders.
     * This is the ONLY method for retrieving gallery config - we use issueId consistently.
     */
    public GalleryIssueConfigResponseDTO getGalleryIssueByIssueId(Long issueId) {
        logger.info("Retrieving gallery issue by issue ID: " + issueId);

        try {
            GalleryIssueConfig config = galleryConfigRepository.findByIssueId(issueId)
                    .orElseThrow(() -> new IllegalArgumentException("Gallery issue configuration not found for issue: " + issueId));

            return buildGalleryIssueConfigDTO(config);

        } catch (Exception e) {
            logger.severe("Error retrieving gallery issue by issue ID: " + e.getMessage());
            throw new RuntimeException("Failed to retrieve gallery issue", e);
        }
    }

    /**
     * Helper method to build GalleryIssueConfigResponseDTO from config entity.
     */
    private GalleryIssueConfigResponseDTO buildGalleryIssueConfigDTO(GalleryIssueConfig config) {
        // Load the Issue association manually to avoid lazy loading issues
        Issue issue = issueRepository.findById(config.getIssue().getId()).orElse(null);
        if (issue == null) {
            throw new IllegalArgumentException("Associated issue not found for gallery config: " + config.getId());
        }

        // Create DTO without triggering lazy loading
        GalleryIssueConfigResponseDTO dto = new GalleryIssueConfigResponseDTO();
        dto.setId(config.getId());
        dto.setIssueId(issue.getId());
        dto.setCoverImageUrl(config.getCoverImageUrl());
        dto.setIsPublished(config.getIsPublished());
        dto.setDisplayOrder(config.getDisplayOrder());
        dto.setConfigTitle(config.getConfigTitle());
        dto.setConfigDescription(config.getConfigDescription());
        dto.setCreatedAt(config.getCreatedAt());
        dto.setUpdatedAt(config.getUpdatedAt());
        
        // Create issue DTO manually
        GalleryIssueConfigResponseDTO.IssueBasicDTO issueDTO = new GalleryIssueConfigResponseDTO.IssueBasicDTO();
        issueDTO.setId(issue.getId());
        issueDTO.setTitle(issue.getTitle());
        issueDTO.setDescription(issue.getDescription());
        issueDTO.setSubmissionStart(issue.getSubmissionStart());
        issueDTO.setSubmissionEnd(issue.getSubmissionEnd());
        issueDTO.setVotingStart(issue.getVotingStart());
        issueDTO.setVotingEnd(issue.getVotingEnd());
        dto.setIssue(issueDTO);
        
        // Load submission orders with details
        List<GallerySubmissionOrder> orders = submissionOrderRepository
                .findByGalleryConfigIdWithSubmissionDetails(config.getId());
        dto.setSubmissionOrdersFromEntities(orders);

        logger.info("Successfully built gallery issue DTO for config ID: " + config.getId() + ", issue ID: " + issue.getId());
        return dto;
    }

    /**
     * Get ordered submissions for a gallery issue.
     * Used for public display of submissions within an issue.
     */
    public List<GallerySubmissionOrderResponseDTO> getGalleryIssueSubmissions(Long issueId) {
        logger.info("Retrieving submissions for issue ID: " + issueId);

        try {
            // Find gallery config by issue ID 
            GalleryIssueConfig config = galleryConfigRepository.findByIssueId(issueId)
                    .orElseThrow(() -> new IllegalArgumentException("Gallery issue configuration not found for issue: " + issueId));

            // Note: Removed published check to allow admin management of unpublished galleries
            // if (!config.getIsPublished()) {
            //     throw new IllegalArgumentException("Gallery issue is not published for issue: " + issueId);
            // }

            List<GallerySubmissionOrder> orders = submissionOrderRepository
                    .findByGalleryConfigIdWithSubmissionDetails(config.getId());

            List<GallerySubmissionOrderResponseDTO> result = orders.stream()
                    .map(GallerySubmissionOrderResponseDTO::new)
                    .collect(Collectors.toList());

            logger.info("Successfully retrieved " + result.size() + " submissions for issue ID: " + issueId);
            return result;

        } catch (Exception e) {
            logger.severe("Error retrieving gallery issue submissions: " + e.getMessage());
            throw new RuntimeException("Failed to retrieve gallery issue submissions", e);
        }
    }

    // ========================================================================================
    // Note: Admin methods have been moved to GalleryIssueAdminService for better separation
    // ========================================================================================
} 