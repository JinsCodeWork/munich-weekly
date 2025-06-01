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
    private static final int MAX_SUBMISSIONS_PER_ISSUE = 4;

    public SubmissionService(SubmissionRepository submissionRepository,
                             IssueRepository issueRepository,
                             UserRepository userRepository,
                             VoteRepository voteRepository,
                             StorageService storageService) {
        this.submissionRepository = submissionRepository;
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
        this.voteRepository = voteRepository;
        this.storageService = storageService;
    }

    public Submission submit(Long userId, SubmissionRequestDTO dto) {
        // 1️⃣ 找用户
        User user = userRepository.findById(userId).orElseThrow(() ->
                new IllegalArgumentException("User not found"));

        // 2️⃣ 找对应期数
        Issue issue = issueRepository.findById(dto.getIssueId()).orElseThrow(() ->
                new IllegalArgumentException("Issue not found"));

        // 3️⃣ 检查投稿时间是否开放
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(issue.getSubmissionStart()) || now.isAfter(issue.getSubmissionEnd())) {
            throw new IllegalStateException("Not in valid date range");
        }

        // 4️⃣ 检查该用户是否已投了4张图
        long count = submissionRepository.countByUserAndIssue(user, issue);
        if (count >= MAX_SUBMISSIONS_PER_ISSUE) {
            throw new IllegalStateException("Maximum " + MAX_SUBMISSIONS_PER_ISSUE + " submissions per issue");
        }
        
        // 5️⃣ 验证描述长度，不能超过200个字符
        if (dto.getDescription() != null && dto.getDescription().length() > 200) {
            throw new IllegalArgumentException("Description must be 200 characters or less");
        }

        // 6️⃣ 创建投稿对象，状态为 pending
        Submission submission = new Submission(user, issue, null, dto.getDescription());
        submission.setStatus("pending");

        return submissionRepository.save(submission);
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