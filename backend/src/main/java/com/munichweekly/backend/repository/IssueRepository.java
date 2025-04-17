package com.munichweekly.backend.repository;

import com.munichweekly.backend.model.Issue;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface IssueRepository extends JpaRepository<Issue, Long> {

    // 查找当前处于投稿阶段的期数
    List<Issue> findBySubmissionStartBeforeAndSubmissionEndAfter(LocalDateTime now1, LocalDateTime now2);

    // 查找当前处于投票阶段的期数
    List<Issue> findByVotingStartBeforeAndVotingEndAfter(LocalDateTime now1, LocalDateTime now2);

    // 查找最新一期（根据 submissionStart 降序排序）
    Optional<Issue> findFirstByOrderBySubmissionStartDesc();
}