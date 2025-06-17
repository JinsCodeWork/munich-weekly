package com.munichweekly.backend.repository;

import com.munichweekly.backend.model.Issue;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface IssueRepository extends JpaRepository<Issue, Long> {

    // Find issues currently in submission phase
    List<Issue> findBySubmissionStartBeforeAndSubmissionEndAfter(LocalDateTime now1, LocalDateTime now2);

    // Find issues currently in voting phase
    List<Issue> findByVotingStartBeforeAndVotingEndAfter(LocalDateTime now1, LocalDateTime now2);

    // Find the latest issue (sorted by submissionStart in descending order)
    Optional<Issue> findFirstByOrderBySubmissionStartDesc();
}