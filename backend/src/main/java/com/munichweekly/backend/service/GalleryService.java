package com.munichweekly.backend.service;

import com.munichweekly.backend.dto.FeaturedSubmissionDto;
import com.munichweekly.backend.dto.GalleryFeaturedConfigDto;
import com.munichweekly.backend.model.GalleryFeaturedConfig;
import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.repository.GalleryFeaturedConfigRepository;
import com.munichweekly.backend.repository.SubmissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.logging.Logger;
import java.util.stream.Collectors;

/**
 * Gallery精选服务类
 * 提供Gallery精选功能的业务逻辑
 */
@Service
public class GalleryService {

    private static final Logger logger = Logger.getLogger(GalleryService.class.getName());

    private final GalleryFeaturedConfigRepository configRepository;
    private final SubmissionRepository submissionRepository;

    @Autowired
    public GalleryService(GalleryFeaturedConfigRepository configRepository,
                         SubmissionRepository submissionRepository) {
        this.configRepository = configRepository;
        this.submissionRepository = submissionRepository;
    }

    /**
     * Get featured submissions list
     *
     * @return Featured submissions list
     */
    public List<FeaturedSubmissionDto> getFeaturedSubmissions() {
        logger.info("Retrieving featured submissions list");

        try {
            // Get active configuration
            Optional<GalleryFeaturedConfig> configOpt = configRepository.findLatestActiveConfig();
            if (configOpt.isEmpty()) {
                logger.info("No active featured configuration found");
                return Collections.emptyList();
            }

            GalleryFeaturedConfig config = configOpt.get();
            Integer[] submissionIds = config.getSubmissionIds();
            Integer[] displayOrder = config.getDisplayOrder();

            if (submissionIds == null || submissionIds.length == 0) {
                logger.info("Featured configuration is empty");
                return Collections.emptyList();
            }

            // Get submission entities
            List<Long> longIds = Arrays.stream(submissionIds)
                    .map(Long::valueOf)
                    .collect(Collectors.toList());

            List<Submission> submissions = submissionRepository.findAllById(longIds);
            
            // Filter out deleted submissions
            Map<Long, Submission> submissionMap = submissions.stream()
                    .collect(Collectors.toMap(Submission::getId, s -> s));

            // Create DTO list in configured order
            List<FeaturedSubmissionDto> result = new ArrayList<>();
            for (int i = 0; i < submissionIds.length; i++) {
                Long submissionId = Long.valueOf(submissionIds[i]);
                Submission submission = submissionMap.get(submissionId);
                
                if (submission != null) {
                    Integer order = (displayOrder != null && i < displayOrder.length) 
                            ? displayOrder[i] : i + 1;
                    result.add(FeaturedSubmissionDto.fromSubmission(submission, order));
                } else {
                    logger.warning("Submission ID " + submissionId + " does not exist, may have been deleted");
                }
            }

            logger.info("Successfully retrieved " + result.size() + " featured submissions");
            return result;

        } catch (Exception e) {
            logger.severe("Error retrieving featured submissions: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Get currently active featured configuration (Admin API)
     *
     * @return Featured configuration DTO
     */
    public Optional<GalleryFeaturedConfigDto> getActiveConfig() {
        logger.info("Retrieving active featured configuration");

        Optional<GalleryFeaturedConfig> configOpt = configRepository.findLatestActiveConfig();
        return configOpt.map(GalleryFeaturedConfigDto::fromEntity);
    }

    /**
     * Get all featured configurations (Admin API)
     *
     * @return All configuration list
     */
    public List<GalleryFeaturedConfigDto> getAllConfigs() {
        logger.info("Retrieving all featured configurations");

        List<GalleryFeaturedConfig> configs = configRepository.findAllOrderByUpdatedAtDesc();
        return configs.stream()
                .map(GalleryFeaturedConfigDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Create or update featured configuration (Admin API)
     *
     * @param configDto Configuration DTO
     * @param userId Operating user ID
     * @return Saved configuration DTO
     */
    @Transactional
    public GalleryFeaturedConfigDto saveConfig(GalleryFeaturedConfigDto configDto, Long userId) {
        logger.info("Saving featured configuration: " + configDto.toString());

        try {
            // Validate data
            if (!configDto.isArrayLengthValid()) {
                throw new IllegalArgumentException("Submission IDs and Display Order arrays have inconsistent lengths");
            }

            // Validate if submission IDs exist
            if (configDto.getSubmissionIds() != null && configDto.getSubmissionIds().length > 0) {
                validateSubmissionIds(configDto.getSubmissionIds());
            }

            GalleryFeaturedConfig config;

            if (configDto.getId() != null) {
                // Update existing configuration
                config = configRepository.findById(configDto.getId())
                        .orElseThrow(() -> new IllegalArgumentException("Configuration does not exist: " + configDto.getId()));
                
                // Update fields
                config.setSubmissionIds(configDto.getSubmissionIds());
                config.setDisplayOrder(configDto.getDisplayOrder());
                config.setAutoplayInterval(configDto.getAutoplayInterval());
                config.setConfigTitle(configDto.getConfigTitle());
                config.setConfigDescription(configDto.getConfigDescription());
                
                // If setting as active, need to deactivate other configurations
                if (Boolean.TRUE.equals(configDto.getIsActive()) && !Boolean.TRUE.equals(config.getIsActive())) {
                    deactivateOtherConfigs(config.getId());
                }
                config.setIsActive(configDto.getIsActive());

            } else {
                // Create new configuration
                config = configDto.toEntity();
                config.setCreatedByUserId(userId);
                
                // If setting as active, need to deactivate other configurations
                if (Boolean.TRUE.equals(configDto.getIsActive())) {
                    deactivateOtherConfigs(null);
                }
            }

            GalleryFeaturedConfig savedConfig = configRepository.save(config);
            logger.info("Successfully saved featured configuration ID: " + savedConfig.getId());

            return GalleryFeaturedConfigDto.fromEntity(savedConfig);

        } catch (Exception e) {
            logger.severe("Error saving featured configuration: " + e.getMessage());
            throw new RuntimeException("Failed to save featured configuration: " + e.getMessage(), e);
        }
    }

    /**
     * Preview submission by ID (Admin API)
     *
     * @param submissionId Submission ID
     * @return Submission DTO
     */
    public Optional<FeaturedSubmissionDto> previewSubmission(Long submissionId) {
        logger.info("Previewing submission ID: " + submissionId);

        Optional<Submission> submissionOpt = submissionRepository.findById(submissionId);
        return submissionOpt.map(FeaturedSubmissionDto::fromSubmission);
    }

    /**
     * Delete featured configuration (Admin API)
     *
     * @param configId Configuration ID
     */
    @Transactional
    public void deleteConfig(Long configId) {
        logger.info("Deleting featured configuration ID: " + configId);

        if (!configRepository.existsById(configId)) {
            throw new IllegalArgumentException("Configuration does not exist: " + configId);
        }

        configRepository.deleteById(configId);
        logger.info("Successfully deleted featured configuration ID: " + configId);
    }

    /**
     * Check if submission is featured
     *
     * @param submissionId Submission ID
     * @return Whether it is featured
     */
    public boolean isSubmissionFeatured(Long submissionId) {
        return configRepository.findActiveConfigContainingSubmissionId(submissionId.intValue()).isPresent();
    }

    /**
     * Get featured statistics
     *
     * @return Statistics map
     */
    public Map<String, Object> getFeaturedStats() {
        Map<String, Object> stats = new HashMap<>();
        
        Integer totalFeatured = configRepository.countFeaturedSubmissionsInActiveConfig();
        stats.put("totalFeaturedSubmissions", totalFeatured != null ? totalFeatured : 0);
        
        boolean hasActiveConfig = configRepository.existsActiveConfig();
        stats.put("hasActiveConfig", hasActiveConfig);
        
        long totalConfigs = configRepository.count();
        stats.put("totalConfigs", totalConfigs);
        
        return stats;
    }

    // Private methods

    /**
     * Validate if submission IDs exist
     */
    private void validateSubmissionIds(Integer[] submissionIds) {
        List<Long> longIds = Arrays.stream(submissionIds)
                .map(Long::valueOf)
                .collect(Collectors.toList());

        List<Long> existingIds = submissionRepository.findAllById(longIds)
                .stream()
                .map(Submission::getId)
                .collect(Collectors.toList());

        List<Long> missingIds = longIds.stream()
                .filter(id -> !existingIds.contains(id))
                .collect(Collectors.toList());

        if (!missingIds.isEmpty()) {
            throw new IllegalArgumentException("The following submission IDs do not exist: " + missingIds);
        }
    }

    /**
     * Deactivate other configurations
     */
    private void deactivateOtherConfigs(Long excludeId) {
        if (excludeId != null) {
            configRepository.deactivateOtherConfigs(excludeId);
        } else {
            configRepository.deactivateAllConfigs();
        }
    }
} 