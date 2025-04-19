package com.munichweekly.backend.repository;

import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.model.User;
import com.munichweekly.backend.model.Issue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    // Find submissions by a specific user in a specific issue
    List<Submission> findByUserIdAndIssue(Long userId, Issue issue);

    // 查询某期所有通过审核的投稿（用于投票展示）
    List<Submission> findByIssueAndStatus(Issue issue, String status);

    // 查询某期的封面作品
    Optional<Submission> findByIssueAndIsCoverTrue(Issue issue);

    // 🔍 Find all submissions by a specific user (across all issues)
    List<Submission> findByUserId(Long userId);

    // 查询某作品是否属于某用户（用于权限校验）
    Optional<Submission> findByIdAndUser(Long id, User user);

    long countByUserAndIssue(User user, Issue issue);
}