package com.munichweekly.backend.service;

import com.munichweekly.backend.dto.SubmissionRequestDTO;
import com.munichweekly.backend.model.*;
import com.munichweekly.backend.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final IssueRepository issueRepository;
    private final UserRepository userRepository;
    private static final int MAX_SUBMISSIONS_PER_ISSUE = 4;

    public SubmissionService(SubmissionRepository submissionRepository,
                             IssueRepository issueRepository,
                             UserRepository userRepository) {
        this.submissionRepository = submissionRepository;
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
    }

    public Submission submit(Long userId, SubmissionRequestDTO dto) {
        // 1️⃣ 找用户
        User user = userRepository.findById(userId).orElseThrow(() ->
                new IllegalArgumentException("用户不存在"));

        // 2️⃣ 找对应期数
        Issue issue = issueRepository.findById(dto.getIssueId()).orElseThrow(() ->
                new IllegalArgumentException("投稿期不存在"));

        // 3️⃣ 检查投稿时间是否开放
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(issue.getSubmissionStart()) || now.isAfter(issue.getSubmissionEnd())) {
            throw new IllegalStateException("当前不在投稿开放时间段");
        }

        // 4️⃣ 检查该用户是否已投了4张图
        long count = submissionRepository.countByUserAndIssue(user, issue);
        if (count >= MAX_SUBMISSIONS_PER_ISSUE) {
            throw new IllegalStateException("每期最多允许投稿 " + MAX_SUBMISSIONS_PER_ISSUE + " 张作品");
        }

        // 5️⃣ 创建投稿对象，状态为 pending
        Submission submission = new Submission(user, issue, dto.getImageUrl(), dto.getDescription());
        submission.setStatus("pending");

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