package com.munichweekly.backend.repository;

import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.model.User;
import com.munichweekly.backend.model.Issue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    // 查询某用户在某期的所有投稿（用于限制最多提交 4 张）
    List<Submission> findByUserAndIssue(User user, Issue issue);

    // 查询某期所有通过审核的投稿（用于投票展示）
    List<Submission> findByIssueAndStatus(Issue issue, String status);

    // 查询某期的封面作品
    Optional<Submission> findByIssueAndIsCoverTrue(Issue issue);

    // 查询某用户所有投稿记录（用于个人统计页）
    List<Submission> findByUser(User user);

    // 查询某作品是否属于某用户（用于权限校验）
    Optional<Submission> findByIdAndUser(Long id, User user);

    long countByUserAndIssue(User user, Issue issue);
}