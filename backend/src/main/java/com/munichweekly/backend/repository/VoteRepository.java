package com.munichweekly.backend.repository;

import com.munichweekly.backend.model.Vote;
import com.munichweekly.backend.model.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VoteRepository extends JpaRepository<Vote, Long> {

    // 判断匿名访客是否对某个作品投过票
    boolean existsByVisitorIdAndSubmission(String visitorId, Submission submission);
    
    // 判断登录用户是否对某个作品投过票
    boolean existsByUserIdAndSubmission(Long userId, Submission submission);

    // 查询某个作品收到的所有投票（用于计算得票数）
    List<Vote> findBySubmission(Submission submission);


    @Query("SELECT v.submission.id AS submissionId, COUNT(v) AS voteCount " +
            "FROM Vote v WHERE v.issue.id = :issueId GROUP BY v.submission.id")
    List<Object[]> countVotesByIssue(@Param("issueId") Long issueId);
}