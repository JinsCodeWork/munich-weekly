package com.munichweekly.backend.repository;

import com.munichweekly.backend.model.Vote;
import com.munichweekly.backend.model.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface VoteRepository extends JpaRepository<Vote, Long> {

    // 判断匿名访客是否对某个作品投过票
    boolean existsByVisitorIdAndSubmission(String visitorId, Submission submission);
    
    // 判断登录用户是否对某个作品投过票
    boolean existsByUserIdAndSubmission(Long userId, Submission submission);

    // 查询某个作品收到的所有投票（用于计算得票数）
    List<Vote> findBySubmission(Submission submission);

    // 查询用户投过的所有票
    List<Vote> findByUserId(Long userId);
    
    // 查找特定访客对特定投稿的投票
    Optional<Vote> findByVisitorIdAndSubmission(String visitorId, Submission submission);
    
    // 查找特定用户对特定投稿的投票
    Optional<Vote> findByUserIdAndSubmission(Long userId, Submission submission);

    // 删除用户投过的所有票
    void deleteByUserId(Long userId);
    
    // 删除某个作品收到的所有投票
    @Transactional
    void deleteBySubmission(Submission submission);

    @Query("SELECT v.submission.id AS submissionId, COUNT(v) AS voteCount " +
            "FROM Vote v WHERE v.issue.id = :issueId GROUP BY v.submission.id")
    List<Object[]> countVotesByIssue(@Param("issueId") Long issueId);
}