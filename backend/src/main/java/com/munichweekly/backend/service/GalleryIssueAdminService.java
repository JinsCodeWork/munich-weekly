package com.munichweekly.backend.service;

import com.munichweekly.backend.dto.*;
import com.munichweekly.backend.model.*;
import com.munichweekly.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.*;
import java.util.logging.Logger;
import java.util.stream.Collectors;

/**
 * Service for admin management of Gallery Issue configurations.
 * Handles CRUD operations and admin-specific functionality.
 * Separated from public GalleryIssueService for better separation of concerns.
 */
@Service
public class GalleryIssueAdminService {

    private static final Logger logger = Logger.getLogger(GalleryIssueAdminService.class.getName());

    private final GalleryIssueConfigRepository galleryConfigRepository;
    private final GallerySubmissionOrderRepository submissionOrderRepository;
    private final IssueRepository issueRepository;
    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;

    @Autowired
    public GalleryIssueAdminService(
            GalleryIssueConfigRepository galleryConfigRepository,
            GallerySubmissionOrderRepository submissionOrderRepository,
            IssueRepository issueRepository,
            SubmissionRepository submissionRepository,
            UserRepository userRepository,
            StorageService storageService) {
        this.galleryConfigRepository = galleryConfigRepository;
        this.submissionOrderRepository = submissionOrderRepository;
        this.issueRepository = issueRepository;
        this.submissionRepository = submissionRepository;
        this.userRepository = userRepository;
        this.storageService = storageService;
    }

    /**
     * Get all gallery configurations for admin management.
     */
    @Transactional(readOnly = true)
    public List<GalleryIssueConfigResponseDTO> getAllGalleryConfigurations() {
        logger.info("Retrieving all gallery configurations for admin");

        try {
            List<Object[]> configsWithCount = galleryConfigRepository.findAllConfigsWithSubmissionCount();
            
            List<GalleryIssueConfigResponseDTO> result = new ArrayList<>();
            for (Object[] row : configsWithCount) {
                GalleryIssueConfig config = (GalleryIssueConfig) row[0];
                Long submissionCount = (row[1] != null) ? (Long) row[1] : 0L;
                result.add(new GalleryIssueConfigResponseDTO(config, submissionCount));
            }

            logger.info("Successfully retrieved " + result.size() + " gallery configurations");
            return result;

        } catch (Exception e) {
            logger.severe("Error retrieving gallery configurations: " + e.getMessage());
            throw new RuntimeException("Failed to retrieve gallery configurations", e);
        }
    }

    /**
     * Create a new gallery issue configuration using Issue ID.
     */
    @Transactional
    public GalleryIssueConfigResponseDTO createGalleryConfiguration(
            GalleryIssueConfigRequestDTO requestDTO, Long userId) {
        logger.info("Creating gallery configuration for issue ID: " + requestDTO.getIssueId());

        try {
            // Validate issue exists
            Issue issue = issueRepository.findById(requestDTO.getIssueId())
                    .orElseThrow(() -> new IllegalArgumentException("Issue not found: " + requestDTO.getIssueId()));

            // Check if configuration already exists for this issue
            if (galleryConfigRepository.existsByIssueId(requestDTO.getIssueId())) {
                throw new IllegalArgumentException("Gallery configuration already exists for issue: " + requestDTO.getIssueId());
            }

            // Get user
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

            // Auto-assign display order based on Issue ID (descending)
            // Higher Issue IDs (newer issues) get lower display order (appear first)
            Integer displayOrder = calculateDisplayOrderByIssueId(issue.getId());

            // Create configuration
            GalleryIssueConfig config = new GalleryIssueConfig(
                    issue,
                    requestDTO.getCoverImageUrl(),
                    requestDTO.getIsPublished(),
                    displayOrder,
                    user
            );

            if (requestDTO.getConfigTitle() != null) {
                config.setConfigTitle(requestDTO.getConfigTitle());
            }
            if (requestDTO.getConfigDescription() != null) {
                config.setConfigDescription(requestDTO.getConfigDescription());
            }

            GalleryIssueConfig savedConfig = galleryConfigRepository.save(config);

            // Create submission orders if provided, or auto-add all selected submissions
            if (requestDTO.getSubmissionOrders() != null && !requestDTO.getSubmissionOrders().isEmpty()) {
                createSubmissionOrders(savedConfig, requestDTO.getSubmissionOrders());
            } else {
                // Auto-add all selected submissions from the issue
                autoAddSelectedSubmissions(savedConfig);
            }

            logger.info("Successfully created gallery configuration ID: " + savedConfig.getId());
            return new GalleryIssueConfigResponseDTO(savedConfig);

        } catch (Exception e) {
            logger.severe("Error creating gallery configuration: " + e.getMessage());
            throw new RuntimeException("Failed to create gallery configuration", e);
        }
    }

    /**
     * Update gallery issue configuration using Issue ID.
     */
    @Transactional
    public GalleryIssueConfigResponseDTO updateGalleryConfigurationByIssueId(
            Long issueId, GalleryIssueConfigRequestDTO requestDTO) {
        logger.info("Updating gallery configuration for issue ID: " + issueId);

        try {
            GalleryIssueConfig config = galleryConfigRepository.findByIssueId(issueId)
                    .orElseThrow(() -> new IllegalArgumentException("Gallery configuration not found for issue: " + issueId));

            // Update basic fields
            if (requestDTO.getCoverImageUrl() != null) {
                config.setCoverImageUrl(requestDTO.getCoverImageUrl());
            }
            if (requestDTO.getIsPublished() != null) {
                config.setIsPublished(requestDTO.getIsPublished());
            }
            if (requestDTO.getConfigTitle() != null) {
                config.setConfigTitle(requestDTO.getConfigTitle());
            }
            if (requestDTO.getConfigDescription() != null) {
                config.setConfigDescription(requestDTO.getConfigDescription());
            }

            GalleryIssueConfig savedConfig = galleryConfigRepository.save(config);

            // Update submission orders if provided
            if (requestDTO.getSubmissionOrders() != null) {
                updateSubmissionOrders(savedConfig, requestDTO.getSubmissionOrders());
            }

            logger.info("Successfully updated gallery configuration for issue ID: " + issueId);
            return new GalleryIssueConfigResponseDTO(savedConfig);

        } catch (Exception e) {
            logger.severe("Error updating gallery configuration: " + e.getMessage());
            throw new RuntimeException("Failed to update gallery configuration", e);
        }
    }

    /**
     * Delete gallery issue configuration using Issue ID.
     */
    @Transactional
    public void deleteGalleryConfigurationByIssueId(Long issueId) {
        logger.info("Deleting gallery configuration for issue ID: " + issueId);

        try {
            GalleryIssueConfig config = galleryConfigRepository.findByIssueId(issueId)
                    .orElseThrow(() -> new IllegalArgumentException("Gallery configuration not found for issue: " + issueId));

            galleryConfigRepository.delete(config);
            logger.info("Successfully deleted gallery configuration for issue ID: " + issueId);

        } catch (Exception e) {
            logger.severe("Error deleting gallery configuration: " + e.getMessage());
            throw new RuntimeException("Failed to delete gallery configuration", e);
        }
    }

    /**
     * Update submission order using Issue ID instead of Config ID.
     */
    @Transactional
    public void updateSubmissionOrderByIssueId(Long issueId, List<GalleryIssueConfigRequestDTO.SubmissionOrderRequestDTO> orderRequests) {
        logger.info("Updating submission order for issue ID: " + issueId);

        try {
            GalleryIssueConfig config = galleryConfigRepository.findByIssueId(issueId)
                    .orElseThrow(() -> new IllegalArgumentException("Gallery config not found for issue: " + issueId));

            logger.info("Found config: " + config.getId() + ", issue: " + config.getIssue().getTitle());
            updateSubmissionOrders(config, orderRequests);

            logger.info("Successfully updated submission order for issue ID: " + issueId);

        } catch (Exception e) {
            logger.severe("Failed to update submission order for issue ID " + issueId + ": " + e.getMessage());
            throw new RuntimeException("Failed to update submission order", e);
        }
    }

    /**
     * Get available 'selected' submissions for an issue.
     */
    public List<SubmissionResponseDTO> getAvailableSelectedSubmissions(Long issueId) {
        logger.info("Retrieving available selected submissions for issue ID: " + issueId);

        try {
            // Get gallery config for this issue
            Optional<GalleryIssueConfig> configOpt = galleryConfigRepository.findByIssueId(issueId);
            Long configId = configOpt.map(GalleryIssueConfig::getId).orElse(null);

            List<Submission> submissions = submissionOrderRepository
                    .findAvailableSelectedSubmissions(issueId, configId);

            List<SubmissionResponseDTO> result = submissions.stream()
                    .map(s -> new SubmissionResponseDTO(s, 0L)) // Vote count not needed here
                    .collect(Collectors.toList());

            logger.info("Successfully retrieved " + result.size() + " available selected submissions");
            return result;

        } catch (Exception e) {
            logger.severe("Error retrieving available selected submissions: " + e.getMessage());
            throw new RuntimeException("Failed to retrieve available selected submissions", e);
        }
    }

    /**
     * Get issues without gallery configuration.
     */
    public List<Issue> getIssuesWithoutGalleryConfig() {
        logger.info("Retrieving issues without gallery configuration");

        try {
            List<Issue> issues = galleryConfigRepository.findIssuesWithoutGalleryConfig();
            logger.info("Successfully retrieved " + issues.size() + " issues without gallery config");
            return issues;

        } catch (Exception e) {
            logger.severe("Error retrieving issues without gallery config: " + e.getMessage());
            throw new RuntimeException("Failed to retrieve issues without gallery config", e);
        }
    }

    // Private helper methods - moved from main service

    private void createSubmissionOrders(GalleryIssueConfig config, 
                                      List<GalleryIssueConfigRequestDTO.SubmissionOrderRequestDTO> orderRequests) {
        logger.info("createSubmissionOrders called for config ID: " + config.getId() + " with " + orderRequests.size() + " requests");
        
        for (int i = 0; i < orderRequests.size(); i++) {
            GalleryIssueConfigRequestDTO.SubmissionOrderRequestDTO orderRequest = orderRequests.get(i);
            logger.info("Processing order request " + (i+1) + "/" + orderRequests.size() + ": submissionId=" + orderRequest.getSubmissionId() + ", displayOrder=" + orderRequest.getDisplayOrder());
            
            Submission submission = submissionRepository.findById(orderRequest.getSubmissionId())
                    .orElseThrow(() -> new IllegalArgumentException("Submission not found: " + orderRequest.getSubmissionId()));

            logger.info("Found submission: " + submission.getId() + ", status: " + submission.getStatus() + ", issue: " + submission.getIssue().getId());

            // Validate submission is selected and belongs to the same issue
            validateSubmissionForGallery(submission, config);

            logger.info("Validation passed, creating GallerySubmissionOrder...");
            GallerySubmissionOrder order = new GallerySubmissionOrder(
                    config, submission, orderRequest.getDisplayOrder());
            submissionOrderRepository.save(order);
            logger.info("Successfully saved order with ID: " + order.getId() + " for submission: " + submission.getId() + " with display order: " + orderRequest.getDisplayOrder());
        }
    }

    private void updateSubmissionOrders(GalleryIssueConfig config, 
                                      List<GalleryIssueConfigRequestDTO.SubmissionOrderRequestDTO> orderRequests) {
        logger.info("Atomically updating submission orders for config ID: " + config.getId() + " with " + orderRequests.size() + " orders");

        // Step 1: Fetch existing orders and map them by submission ID for efficient lookup.
        Map<Long, GallerySubmissionOrder> existingOrdersMap = submissionOrderRepository
                .findByGalleryConfigIdOrderByDisplayOrderAsc(config.getId())
                .stream()
                .collect(Collectors.toMap(
                    order -> order.getSubmission().getId(),
                    order -> order
                ));
        logger.info("Found " + existingOrdersMap.size() + " existing orders to update.");

        List<GallerySubmissionOrder> ordersToSave = new ArrayList<>();
        Set<Long> processedSubmissionIds = new HashSet<>();

        // Step 2: Iterate through the new order requests, update existing entities, or create new ones.
        for (GalleryIssueConfigRequestDTO.SubmissionOrderRequestDTO request : orderRequests) {
            processedSubmissionIds.add(request.getSubmissionId());
            GallerySubmissionOrder order = existingOrdersMap.get(request.getSubmissionId());

            if (order != null) {
                // This submission already has an order record; update its displayOrder.
                if (order.getDisplayOrder() != request.getDisplayOrder()) {
                    logger.info("Updating displayOrder for submission " + request.getSubmissionId() + " from " + order.getDisplayOrder() + " to " + request.getDisplayOrder());
                    order.setDisplayOrder(request.getDisplayOrder());
                    ordersToSave.add(order);
                }
            } else {
                // This is a new submission being added to the gallery config.
                logger.info("Creating new order for submission " + request.getSubmissionId() + " with displayOrder " + request.getDisplayOrder());
                Submission submission = submissionRepository.findById(request.getSubmissionId())
                        .orElseThrow(() -> new IllegalArgumentException("Submission not found: " + request.getSubmissionId()));
                
                // Perform validation for the new submission
                validateSubmissionForGallery(submission, config);

                ordersToSave.add(new GallerySubmissionOrder(config, submission, request.getDisplayOrder()));
            }
        }
        
        // Step 3: Identify and collect orders that need to be deleted.
        List<GallerySubmissionOrder> ordersToDelete = existingOrdersMap.values().stream()
            .filter(order -> !processedSubmissionIds.contains(order.getSubmission().getId()))
            .collect(Collectors.toList());

        // Step 4: Perform database operations.
        if (!ordersToDelete.isEmpty()) {
            logger.info("Deleting " + ordersToDelete.size() + " orders for submissions no longer in the list.");
            submissionOrderRepository.deleteAll(ordersToDelete);
        }

        if (!ordersToSave.isEmpty()) {
            logger.info("Saving " + ordersToSave.size() + " updated or new submission orders.");
            submissionOrderRepository.saveAll(ordersToSave);
        } else {
            logger.info("No changes in submission order detected.");
        }
        
        logger.info("Submission orders processed successfully for config ID: " + config.getId());
    }

    private void validateSubmissionForGallery(Submission submission, GalleryIssueConfig config) {
        if (!"selected".equals(submission.getStatus())) {
            logger.warning("Submission validation failed - status: " + submission.getStatus() + " (expected: selected)");
            throw new IllegalArgumentException("Submission must have 'selected' status: " + submission.getId());
        }
        if (!submission.getIssue().getId().equals(config.getIssue().getId())) {
            logger.warning("Submission validation failed - submission issue: " + submission.getIssue().getId() + ", config issue: " + config.getIssue().getId());
            throw new IllegalArgumentException("Submission does not belong to the configured issue: " + submission.getId());
        }
    }

    /**
     * Automatically add all selected submissions from the issue to the gallery configuration.
     */
    private void autoAddSelectedSubmissions(GalleryIssueConfig config) {
        logger.info("Auto-adding selected submissions for gallery config ID: " + config.getId());
        
        try {
            // Find all selected submissions for this issue
            List<Submission> selectedSubmissions = submissionRepository
                    .findByIssueAndStatus(config.getIssue(), "selected");
            
            if (selectedSubmissions.isEmpty()) {
                logger.info("No selected submissions found for issue ID: " + config.getIssue().getId());
                return;
            }
            
            logger.info("Found " + selectedSubmissions.size() + " selected submissions to add");
            
            // Create submission orders for all selected submissions
            for (int i = 0; i < selectedSubmissions.size(); i++) {
                Submission submission = selectedSubmissions.get(i);
                int displayOrder = i + 1;
                
                GallerySubmissionOrder order = new GallerySubmissionOrder(config, submission, displayOrder);
                submissionOrderRepository.save(order);
                
                logger.info("Added submission ID " + submission.getId() + " with display order " + displayOrder);
            }
            
            logger.info("Successfully auto-added " + selectedSubmissions.size() + " selected submissions");
            
        } catch (Exception e) {
            logger.severe("Error auto-adding selected submissions: " + e.getMessage());
            throw new RuntimeException("Failed to auto-add selected submissions", e);
        }
    }

    /**
     * Calculate display order based on Issue ID to achieve descending order.
     * Higher Issue IDs (newer issues) get lower display order numbers (appear first).
     * 
     * Formula: display_order = (MAX_ISSUE_ID - current_issue_id + 1)
     * This ensures that newer issues (higher IDs) always appear before older issues.
     */
    private Integer calculateDisplayOrderByIssueId(Long issueId) {
        logger.info("Calculating display order for issue ID: " + issueId);
        
        try {
            // Get all existing gallery configurations to understand current display orders
            List<GalleryIssueConfig> allConfigs = galleryConfigRepository.findAll();
            
            if (allConfigs.isEmpty()) {
                // First gallery configuration, start with order 1
                logger.info("First gallery config, assigning display order 1");
                return 1;
            }
            
            // Sort existing configs by Issue ID descending to find where new issue should be inserted
            allConfigs.sort((a, b) -> b.getIssue().getId().compareTo(a.getIssue().getId()));
            
            // Find the correct position for the new issue ID
            int position = 1;
            for (GalleryIssueConfig config : allConfigs) {
                if (issueId > config.getIssue().getId()) {
                    // New issue has higher ID, should come before this config
                    break;
                }
                position++;
            }
            
            logger.info("New issue ID " + issueId + " should be at position " + position);
            
            // Shift existing display orders if necessary
            if (position <= allConfigs.size()) {
                // Need to shift existing configs
                shiftDisplayOrdersFromPosition(position);
            }
            
            return position;
            
        } catch (Exception e) {
            logger.severe("Error calculating display order: " + e.getMessage());
            // Fallback to simple max + 1 approach
            return galleryConfigRepository.findMaxDisplayOrder() + 1;
        }
    }
    
    /**
     * Shift display orders of existing configurations to make room for new issue.
     */
    private void shiftDisplayOrdersFromPosition(int fromPosition) {
        logger.info("Shifting display orders from position: " + fromPosition);
        
        try {
                         List<GalleryIssueConfig> configsToShift = galleryConfigRepository
                    .findByDisplayOrderGreaterThanOrderByDisplayOrderAsc(fromPosition - 1);
            
            for (GalleryIssueConfig config : configsToShift) {
                config.setDisplayOrder(config.getDisplayOrder() + 1);
                galleryConfigRepository.save(config);
                logger.info("Shifted config ID " + config.getId() + " to display order " + config.getDisplayOrder());
            }
            
            logger.info("Successfully shifted " + configsToShift.size() + " configurations");
            
        } catch (Exception e) {
            logger.severe("Error shifting display orders: " + e.getMessage());
            throw new RuntimeException("Failed to shift display orders", e);
        }
    }

    /**
     * Upload cover image for gallery configuration by Issue ID.
     * Stores the image in the issue's cover folder structure and updates the configuration.
     */
    @Transactional
    public String uploadCoverImageByIssueId(Long issueId, MultipartFile file) throws IOException {
        logger.info("Uploading cover image for issue ID: " + issueId);

        try {
            // Validate issue exists
            issueRepository.findById(issueId)
                    .orElseThrow(() -> new IllegalArgumentException("Issue not found: " + issueId));

            // Get or create gallery configuration
            GalleryIssueConfig config = galleryConfigRepository.findByIssueId(issueId)
                    .orElseThrow(() -> new IllegalArgumentException("Gallery configuration not found for issue: " + issueId));

            // Validate file
            if (file == null || file.isEmpty()) {
                throw new IllegalArgumentException("File is required");
            }

            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.trim().isEmpty()) {
                throw new IllegalArgumentException("Invalid file name");
            }

            // Get file extension
            String extension = "";
            if (originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
            }

            // Validate file type
            List<String> allowedExtensions = Arrays.asList("jpg", "jpeg", "png");
            if (!allowedExtensions.contains(extension)) {
                throw new IllegalArgumentException("Only JPG, JPEG, and PNG files are allowed");
            }

            // Store cover image using StorageService
            // Use special identifiers for cover images to create appropriate path structure
            String coverSubmissionId = "cover"; // This will create path: uploads/issues/{issueId}/submissions/admin_cover_{timestamp}.{ext}
            String coverUserId = "admin";
            String imageUrl = storageService.storeFile(file, issueId.toString(), coverUserId, coverSubmissionId);

            // Update configuration with cover image URL
            config.setCoverImageUrl(imageUrl);
            galleryConfigRepository.save(config);

            logger.info("Successfully uploaded cover image for issue ID: " + issueId + ", URL: " + imageUrl);
            return imageUrl;

        } catch (IOException e) {
            logger.severe("IO error uploading cover image for issue ID " + issueId + ": " + e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.severe("Error uploading cover image for issue ID " + issueId + ": " + e.getMessage());
            throw new RuntimeException("Failed to upload cover image", e);
        }
    }
} 