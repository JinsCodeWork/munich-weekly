package com.munichweekly.backend.service;

import com.munichweekly.backend.dto.AdminSubmissionResponseDTO;
import com.munichweekly.backend.dto.MySubmissionResponseDTO;
import com.munichweekly.backend.dto.SubmissionRequestDTO;
import com.munichweekly.backend.dto.SubmissionResponseDTO;
import com.munichweekly.backend.model.*;
import com.munichweekly.backend.repository.*;
import com.munichweekly.backend.security.CurrentUserUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Service
public class SubmissionService {

    private static final Logger logger = Logger.getLogger(SubmissionService.class.getName());
    
    private final SubmissionRepository submissionRepository;
    private final IssueRepository issueRepository;
    private final UserRepository userRepository;
    private final VoteRepository voteRepository;
    private final StorageService storageService;
    private final FileDownloadService fileDownloadService;
    private final ImageDimensionService imageDimensionService;
    private static final int MAX_SUBMISSIONS_PER_ISSUE = 4;

    public SubmissionService(SubmissionRepository submissionRepository,
                             IssueRepository issueRepository,
                             UserRepository userRepository,
                             VoteRepository voteRepository,
                             StorageService storageService,
                             FileDownloadService fileDownloadService,
                             ImageDimensionService imageDimensionService) {
        this.submissionRepository = submissionRepository;
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
        this.voteRepository = voteRepository;
        this.storageService = storageService;
        this.fileDownloadService = fileDownloadService;
        this.imageDimensionService = imageDimensionService;
    }

    /**
     * Submit a new submission with enhanced tracking for later dimension optimization.
     * Note: Image URL and dimensions are captured during the upload process,
     * not during initial submission creation.
     */
    public Submission submit(Long userId, SubmissionRequestDTO dto) {
        // Find user and issue
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Issue issue = issueRepository.findById(dto.getIssueId())
                .orElseThrow(() -> new IllegalArgumentException("Issue not found"));

        // Check submission timing
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(issue.getSubmissionStart()) || now.isAfter(issue.getSubmissionEnd())) {
            throw new IllegalStateException("Not in valid date range");
        }

        // Check if user has reached the submission limit for this issue
        List<Submission> existingSubmissions = submissionRepository.findByUserIdAndIssue(userId, issue);
        if (existingSubmissions.size() >= MAX_SUBMISSIONS_PER_ISSUE) {
            throw new IllegalArgumentException(
                    "You can only submit a maximum of " + MAX_SUBMISSIONS_PER_ISSUE + " images per issue."
            );
        }

        // Validate description length
        if (dto.getDescription() != null && dto.getDescription().length() > 200) {
            throw new IllegalArgumentException("Description must be 200 characters or less");
        }

        // Create submission entity (imageUrl will be set during upload)
        Submission submission = new Submission(user, issue, null, dto.getDescription());
        submission.setStatus("pending");

        logger.info("Created new submission for user " + userId + " in issue " + dto.getIssueId() + 
                   " (dimensions will be captured during upload)");

        return submissionRepository.save(submission);
    }
    
    /**
     * Update submission with image URL and capture dimensions for layout optimization.
     * This method should be called after successful image upload to store both
     * the image URL and its dimensions for improved masonry layout performance.
     * 
     * @param submissionId The submission ID to update
     * @param imageUrl The uploaded image URL
     */
    public void updateSubmissionWithImageUrl(Long submissionId, String imageUrl) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found"));
        
        // Set the image URL
        submission.setImageUrl(imageUrl);
        
        // **ENHANCEMENT: Capture image dimensions for layout optimization**
        try {
            if (imageUrl != null && !imageUrl.trim().isEmpty()) {
                ImageDimensions dimensions = imageDimensionService.fetchImageDimensionsForUpload(imageUrl);
                
                if (dimensions != null) {
                    // Store dimensions in the submission entity for future layout optimization
                    submission.setImageDimensions(dimensions.getWidth(), dimensions.getHeight());
                    
                    logger.info("Successfully captured image dimensions for submission " + submissionId + ": " +
                               dimensions.getWidth() + "x" + dimensions.getHeight() + 
                               " (aspect ratio: " + String.format("%.3f", dimensions.getAspectRatio()) + ")");
                } else {
                    logger.warning("Could not determine image dimensions for submission " + submissionId + 
                                 " with URL: " + imageUrl);
                }
            }
        } catch (Exception e) {
            // Log but don't fail submission - dimension data is optional for backward compatibility
            logger.warning("Failed to capture image dimensions for submission " + submissionId + ": " + e.getMessage());
        }
        
        submissionRepository.save(submission);
    }

    public List<SubmissionResponseDTO> listApprovedByIssue(Long issueId) {
        // 1. 检查期刊是否存在
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue not found"));

        // 2. 查询所有"审核通过"和"精选"的投稿（包含approved和selected状态）
        List<Submission> submissions = submissionRepository.findByIssueAndApprovedOrSelected(issue);

        // 3. 查询投票统计（返回 List<Object[]>: [submissionId, voteCount]）
        List<Object[]> voteCounts = voteRepository.countVotesByIssue(issueId);

        // 4. 转换为 Map<submissionId, voteCount>
        Map<Long, Long> voteCountMap = voteCounts.stream()
                .collect(Collectors.toMap(
                        obj -> (Long) obj[0],
                        obj -> (Long) obj[1]
                ));

        // 5. 构造响应 DTO，附带每个投稿的票数
        return submissions.stream()
                .map(submission -> new SubmissionResponseDTO(
                        submission,
                        voteCountMap.getOrDefault(submission.getId(), 0L) // 默认0票
                ))
                .collect(Collectors.toList());
    }

    public Submission approveSubmission(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found"));

        submission.setStatus("approved");
        submission.setReviewedAt(LocalDateTime.now());
        return submissionRepository.save(submission);
    }

    public Submission rejectSubmission(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found"));

        submission.setStatus("rejected");
        submission.setReviewedAt(LocalDateTime.now());
        return submissionRepository.save(submission);
    }

    /**
     * Select a submission as featured and set its status to "selected"
     * This will also update the reviewed time
     * Multiple submissions can be selected for the same issue
     */
    @Transactional
    public Submission selectSubmission(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found"));
        
        // Set this submission as selected
        submission.setStatus("selected");
        submission.setReviewedAt(LocalDateTime.now());
        return submissionRepository.save(submission);
    }

    public List<MySubmissionResponseDTO> listMySubmissions(Long issueId) {
        Long userId = CurrentUserUtil.getUserIdOrThrow();

        List<Submission> submissions;

        if (issueId != null) {
            Issue issue = issueRepository.findById(issueId)
                    .orElseThrow(() -> new IllegalArgumentException("Issue not found"));
            submissions = submissionRepository.findByUserIdAndIssue(userId, issue);
        } else {
            submissions = submissionRepository.findByUserId(userId);
        }

        return submissions.stream()
                .map(s -> {
                    int voteCount = ("approved".equals(s.getStatus()) || "selected".equals(s.getStatus()))
                            ? voteRepository.findBySubmission(s).size()
                            : 0;

                    return new MySubmissionResponseDTO(s, voteCount);
                })
                .collect(Collectors.toList());
    }

    /**
     * List all submissions for admin management.
     * This returns all submissions regardless of status, optionally filtered by issue.
     */
    public List<AdminSubmissionResponseDTO> listAllSubmissions(Long issueId) {
        List<Submission> submissions;
        
        if (issueId != null) {
            Issue issue = issueRepository.findById(issueId)
                    .orElseThrow(() -> new IllegalArgumentException("Issue not found"));
            submissions = submissionRepository.findByIssue(issue);
        } else {
            submissions = submissionRepository.findAll();
        }
        
        return submissions.stream()
                .map(s -> {
                    int voteCount = voteRepository.findBySubmission(s).size();
                    return new AdminSubmissionResponseDTO(s, voteCount);
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Delete a submission and its associated image file.
     * Users can only delete their own submissions.
     * Admins can delete any submission.
     * 
     * @param submissionId ID of the submission to delete
     * @throws IllegalArgumentException if submission not found
     * @throws SecurityException if user is not authorized to delete the submission
     */
    @Transactional
    public void deleteSubmission(Long submissionId) {
        Long currentUserId = CurrentUserUtil.getUserIdOrThrow();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found"));
        
        // Check if current user is the owner or an admin
        boolean isOwner = submission.getUser().getId().equals(currentUserId);
        boolean isAdmin = "admin".equals(currentUser.getRole());
        
        if (!isOwner && !isAdmin) {
            throw new SecurityException("Not authorized to delete this submission");
        }
        
        // 获取图片URL
        String imageUrl = submission.getImageUrl();
        
        // Delete any votes associated with this submission
        voteRepository.deleteBySubmission(submission);
        
        // Delete the submission from database
        submissionRepository.delete(submission);
        
        // 删除存储在云端的图片文件
        if (imageUrl != null && !imageUrl.isEmpty()) {
            logger.info("Deleting image file: " + imageUrl);
            boolean deleteSuccessful = storageService.deleteFile(imageUrl);
            if (deleteSuccessful) {
                logger.info("Successfully deleted image file: " + imageUrl);
            } else {
                logger.warning("Failed to delete image file: " + imageUrl);
            }
        } else {
            logger.warning("No image URL found for submission " + submissionId);
        }
    }

    /**
     * Download all selected submissions for an issue as a ZIP file
     * Admin only functionality
     */
    public Path downloadSelectedSubmissionsAsZip(Long issueId) throws IOException {
        // 1. Find the issue
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue not found"));
        
        // 2. Get all selected submissions for this issue
        List<Submission> selectedSubmissions = submissionRepository.findByIssueAndStatus(issue, "selected");
        
        if (selectedSubmissions.isEmpty()) {
            throw new IllegalStateException("No selected submissions found for this issue");
        }
        
        // 3. Create ZIP file using FileDownloadService
        logger.info("Creating ZIP for " + selectedSubmissions.size() + " selected submissions from issue: " + issue.getTitle());
        
        return fileDownloadService.createZipFromSubmissions(selectedSubmissions, issue.getTitle());
    }

    /**
     * Get approved submission entities for masonry layout optimization.
     * Returns submission entities instead of DTOs to provide access to stored dimension data
     * and reduce the need for external API calls during layout calculation.
     * 
     * This method is optimized for the hybrid masonry layout approach where:
     * - Stored dimensions in entities eliminate external dimension fetching
     * - Backend provides optimal ordering with submission entity data
     * - Frontend handles responsive positioning
     * 
     * @param issueId The issue ID to get approved submissions for
     * @return List of approved Submission entities with dimension data when available
     */
    public List<Submission> getApprovedSubmissionEntities(Long issueId) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue not found"));
        
        // Get all approved and selected submissions (includes both statuses for voting display)
        List<Submission> submissions = submissionRepository.findByIssueAndApprovedOrSelected(issue);
        
        logger.info("Retrieved " + submissions.size() + " approved submission entities for issue " + issueId + " (with dimension optimization)");
        
        // Log dimension data availability for performance monitoring
        long withDimensions = submissions.stream()
                .mapToLong(s -> s.hasDimensionData() ? 1 : 0)
                .sum();
        
        if (withDimensions > 0) {
            double percentage = (withDimensions * 100.0 / submissions.size());
            logger.info("Dimension optimization: " + withDimensions + "/" + submissions.size() + 
                       " submissions have stored dimensions (" + String.format("%.1f", percentage) + "%)");
        }
        
        return submissions;
    }

    /**
     * Get all submission entities for migration purposes.
     * **ADMIN USE ONLY** - For data migration and analysis.
     * 
     * @return List of all submission entities
     */
    public List<Submission> getAllSubmissionEntities() {
        logger.info("Retrieving all submission entities for migration analysis");
        return submissionRepository.findAll();
    }
    
    /**
     * Update an existing submission entity.
     * Used primarily for data migration to add dimension information.
     * 
     * @param submission The submission entity to update
     * @return The updated submission
     */
    @Transactional
    public Submission updateSubmission(Submission submission) {
        if (submission == null || submission.getId() == null) {
            throw new IllegalArgumentException("Submission and submission ID cannot be null");
        }
        
        // Verify submission exists
        if (!submissionRepository.existsById(submission.getId())) {
            throw new IllegalArgumentException("Submission not found with ID: " + submission.getId());
        }
        
        return submissionRepository.save(submission);
    }

    public SubmissionRepository getSubmissionRepository() {
        return submissionRepository;
    }

    public IssueRepository getIssueRepository() {
        return issueRepository;
    }

    public UserRepository getUserRepository() {
        return userRepository;
    }
}