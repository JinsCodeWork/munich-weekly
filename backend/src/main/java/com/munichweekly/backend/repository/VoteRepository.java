package com.munichweekly.backend.repository;

import com.munichweekly.backend.model.Vote;
import com.munichweekly.backend.model.User;
import com.munichweekly.backend.model.Issue;
import com.munichweekly.backend.model.Submission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VoteRepository extends JpaRepository<Vote, Long> {

    // 判断用户是否对某个作品投过票（防止重复投票）
    boolean existsByUserAndSubmission(User user, Submission submission);

    // 查询某个用户在某期所有投票（用于展示“你投过的作品”）
    List<Vote> findByUserAndIssue(User user, Issue issue);

    // 查询某个作品收到的所有投票（用于计算得票数）
    List<Vote> findBySubmission(Submission submission);

    // 查询某个用户是否对某期某作品投过票（可用于审核用途）
    Optional<Vote> findByUserAndSubmissionAndIssue(User user, Submission submission, Issue issue);
}