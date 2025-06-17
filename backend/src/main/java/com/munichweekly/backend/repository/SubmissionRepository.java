package com.munichweekly.backend.repository;

import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.model.User;
import com.munichweekly.backend.model.Issue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    // Find submissions by a specific user in a specific issue
    List<Submission> findByUserIdAndIssue(Long userId, Issue issue);

    // Query all approved submissions for a specific issue (for voting display)
    List<Submission> findByIssueAndStatus(Issue issue, String status);
    
    // Query all approved and featured submissions for a specific issue (includes approved and selected status)
    @Query("SELECT s FROM Submission s WHERE s.issue = :issue AND (s.status = 'approved' OR s.status = 'selected')")
    List<Submission> findByIssueAndApprovedOrSelected(Issue issue);

    // Query cover submissions for a specific issue
    Optional<Submission> findByIssueAndIsCoverTrue(Issue issue);

    // 🔍 Find all submissions by a specific user (across all issues)
    List<Submission> findByUserId(Long userId);

    // Query whether a submission belongs to a specific user (for permission verification)
    Optional<Submission> findByIdAndUser(Long id, User user);

    long countByUserAndIssue(User user, Issue issue);
    
    // Query all submissions for a specific issue (regardless of status, for admin review)
    List<Submission> findByIssue(Issue issue);
}