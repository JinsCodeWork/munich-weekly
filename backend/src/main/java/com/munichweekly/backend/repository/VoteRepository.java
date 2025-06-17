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

    // Check if an anonymous visitor has voted for a specific submission
    boolean existsByVisitorIdAndSubmission(String visitorId, Submission submission);
    
    // Check if a logged-in user has voted for a specific submission
    boolean existsByUserIdAndSubmission(Long userId, Submission submission);

    // Query all votes received by a submission (used to calculate vote count)
    List<Vote> findBySubmission(Submission submission);

    // Query all votes cast by a user
    List<Vote> findByUserId(Long userId);
    
    // Find votes by a specific visitor for a specific submission
    Optional<Vote> findByVisitorIdAndSubmission(String visitorId, Submission submission);
    
    // Find votes by a specific user for a specific submission
    Optional<Vote> findByUserIdAndSubmission(Long userId, Submission submission);

    // Delete all votes cast by a user
    void deleteByUserId(Long userId);
    
    // Delete all votes received by a submission
    @Transactional
    void deleteBySubmission(Submission submission);

    @Query("SELECT v.submission.id AS submissionId, COUNT(v) AS voteCount " +
            "FROM Vote v WHERE v.issue.id = :issueId GROUP BY v.submission.id")
    List<Object[]> countVotesByIssue(@Param("issueId") Long issueId);
}