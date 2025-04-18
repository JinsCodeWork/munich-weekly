package com.munichweekly.backend.service;

import com.munichweekly.backend.dto.SubmissionRequestDTO;
import com.munichweekly.backend.dto.SubmissionResponseDTO;
import com.munichweekly.backend.model.*;
import com.munichweekly.backend.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final IssueRepository issueRepository;
    private final UserRepository userRepository;
    private final VoteRepository voteRepository;
    private static final int MAX_SUBMISSIONS_PER_ISSUE = 4;

    public SubmissionService(SubmissionRepository submissionRepository,
                             IssueRepository issueRepository,
                             UserRepository userRepository,
                             VoteRepository voteRepository) {
        this.submissionRepository = submissionRepository;
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
        this.voteRepository = voteRepository;
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

        // 5️⃣ 创建投稿对象，状态为 pending
        Submission submission = new Submission(user, issue, dto.getImageUrl(), dto.getDescription());
        submission.setStatus("pending");

        return submissionRepository.save(submission);
    }

    public List<SubmissionResponseDTO> listApprovedByIssue(Long issueId) {
        // 1. 检查期刊是否存在
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue not found"));

        // 2. 查询所有“审核通过”的投稿
        List<Submission> submissions = submissionRepository.findByIssueAndStatus(issue, "approved");

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