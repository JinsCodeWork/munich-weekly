package com.munichweekly.backend.controller;

import com.munichweekly.backend.devtools.annotation.Description;
import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.model.Vote;
import com.munichweekly.backend.service.VoteService;
import com.munichweekly.backend.security.CurrentUserUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Arrays;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/votes")
public class VoteController {
    private static final Logger logger = LoggerFactory.getLogger(VoteController.class);

    private final VoteService voteService;

    public VoteController(VoteService voteService) {
        this.voteService = voteService;
    }

    /**
     * Submit a vote for a submission.
     * For authenticated users, we use their userId.
     * For anonymous users, we use visitorId from cookie.
     * Returns the vote object and current vote count.
     */
    @Description("Submit a vote for a submission. Uses userId for authenticated users, visitorId for anonymous users.")
    @PostMapping
    public ResponseEntity<?> vote(
            @RequestParam Long submissionId,
            @CookieValue(name = "visitorId", required = false) String visitorId,
            HttpServletRequest request) {

        // Get current user ID if logged in
        Optional<Long> currentUserId = CurrentUserUtil.getCurrentUserId();
        
        logger.info("Submit vote: submissionId={}, visitorId={}, userId={}", 
                 submissionId, visitorId, currentUserId.orElse(null));
        
        // If not logged in and no visitorId, return error
        if (currentUserId.isEmpty() && (visitorId == null || visitorId.isEmpty())) {
            logger.warn("Vote attempt without authentication: submissionId={}", submissionId);
            return ResponseEntity.badRequest().body("Authentication required: either login or enable cookies for visitorId.");
        }

        Submission submission = voteService.requireSubmissionForVote(submissionId);

        String ipAddress = request.getRemoteAddr();

        Vote vote;
        if (currentUserId.isPresent()) {
            vote = voteService.voteAsUser(currentUserId.get(), submission, ipAddress);
            logger.info("User vote successful: userId={}, submissionId={}", currentUserId.get(), submissionId);
        } else {
            vote = voteService.vote(visitorId, submission, ipAddress);
            logger.info("Anonymous vote successful: visitorId={}, submissionId={}", visitorId, submissionId);
        }
        
        int currentVoteCount = voteService.countVotesForSubmission(submission);
        
        // Create response with vote and count
        Map<String, Object> response = new HashMap<>();
        response.put("vote", vote);
        response.put("voteCount", currentVoteCount);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Check whether a user has already voted for a specific submission.
     * For authenticated users, we check by userId.
     * For anonymous users, we check by visitorId.
     */
    @Description("Check if current user has voted for a submission.")
    @GetMapping("/check")
    public ResponseEntity<?> hasVoted(
            @RequestParam Long submissionId,
            @CookieValue(name = "visitorId", required = false) String visitorId) {

        // Get current user ID if logged in
        Optional<Long> currentUserId = CurrentUserUtil.getCurrentUserId();
        
        logger.debug("Check vote status: submissionId={}, visitorId={}, userId={}", 
                   submissionId, visitorId, currentUserId.orElse(null));
        
        // If neither logged in nor have visitorId, assume not voted
        if (currentUserId.isEmpty() && (visitorId == null || visitorId.isEmpty())) {
            logger.debug("No visitorId or user found, assuming not voted");
            return ResponseEntity.ok(Map.of("voted", false));
        }

        Submission submission = voteService.requireSubmissionForVote(submissionId);

        boolean voted;
        if (currentUserId.isPresent()) {
            voted = voteService.hasVotedAsUser(currentUserId.get(), submission);
            logger.debug("User vote check: userId={}, submissionId={}, voted={}", 
                       currentUserId.get(), submissionId, voted);
        } else {
            voted = voteService.hasVoted(visitorId, submission);
            logger.debug("Anonymous vote check: visitorId={}, submissionId={}, voted={}", 
                       visitorId, submissionId, voted);
        }

        return ResponseEntity.ok(Map.of("voted", voted));
    }

    /**
     * Batch check whether a user has voted for multiple submissions.
     * 
     * This is a performance optimization endpoint that reduces N individual API calls 
     * to 1 batch call when checking vote status for multiple submissions.
     * 
     * For authenticated users, we check by userId.
     * For anonymous users, we check by visitorId.
     * 
     * @param submissionIds Comma-separated list of submission IDs to check
     * @param visitorId Visitor ID from cookie (for anonymous users)
     * @return Map of submission IDs to their voted status and total checked count
     */
    @Description("Batch check if current user has voted for multiple submissions. Performance optimization for vote page.")
    @GetMapping("/check-batch")
    public ResponseEntity<?> hasBatchVoted(
            @RequestParam String submissionIds,
            @CookieValue(name = "visitorId", required = false) String visitorId) {

        // Get current user ID if logged in
        Optional<Long> currentUserId = CurrentUserUtil.getCurrentUserId();
        
        logger.info("Batch vote status check: submissionIds={}, visitorId={}, userId={}", 
                   submissionIds, visitorId, currentUserId.orElse(null));
        
        // Parse submission IDs from comma-separated string
        List<Long> submissionIdList;
        try {
            submissionIdList = Arrays.stream(submissionIds.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(Long::valueOf)
                    .collect(Collectors.toList());
        } catch (NumberFormatException e) {
            logger.warn("Invalid submission IDs format: {}", submissionIds);
            return ResponseEntity.badRequest().body("Invalid submission IDs format");
        }
        
        if (submissionIdList.isEmpty()) {
            logger.debug("No submission IDs provided for batch check");
            return ResponseEntity.ok(Map.of("statuses", Map.of(), "totalChecked", 0));
        }
        
        // If neither logged in nor have visitorId, assume all not voted
        if (currentUserId.isEmpty() && (visitorId == null || visitorId.isEmpty())) {
            logger.debug("No visitorId or user found for batch check, assuming all not voted");
            Map<String, Boolean> statuses = submissionIdList.stream()
                    .collect(Collectors.toMap(
                            id -> id.toString(),
                            id -> false
                    ));
            return ResponseEntity.ok(Map.of("statuses", statuses, "totalChecked", submissionIdList.size()));
        }

        VoteService.BatchVoteStatusResult batchResult =
                voteService.batchVoteStatuses(submissionIdList, currentUserId, Optional.ofNullable(visitorId));

        logger.info("Batch vote status check completed: checked={}/{} submissions, userId={}, visitorId={}",
                   batchResult.totalChecked(), submissionIdList.size(), currentUserId.orElse(null), visitorId);

        Map<String, Object> response = new HashMap<>();
        response.put("statuses", batchResult.statuses());
        response.put("totalChecked", batchResult.totalChecked());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Cancel a vote for a submission.
     * For authenticated users, we use their userId.
     * For anonymous users, we use visitorId from cookie.
     * Returns success status and updated vote count.
     */
    @Description("Cancel a vote for a submission. Uses userId for authenticated users, visitorId for anonymous users.")
    @DeleteMapping
    public ResponseEntity<?> cancelVote(
            @RequestParam Long submissionId,
            @CookieValue(name = "visitorId", required = false) String visitorId) {

        // Get current user ID if logged in
        Optional<Long> currentUserId = CurrentUserUtil.getCurrentUserId();
        
        logger.info("Cancel vote: submissionId={}, visitorId={}, userId={}", 
                   submissionId, visitorId, currentUserId.orElse(null));
        
        // If not logged in and no visitorId, return error
        if (currentUserId.isEmpty() && (visitorId == null || visitorId.isEmpty())) {
            logger.warn("Cancel vote attempt without authentication: submissionId={}", submissionId);
            return ResponseEntity.badRequest().body("Authentication required: either login or enable cookies for visitorId.");
        }

        Submission submission = voteService.requireSubmissionForVote(submissionId);

        try {
            boolean success;
            if (currentUserId.isPresent()) {
                logger.info("Attempting to cancel user vote: userId={}, submissionId={}", 
                         currentUserId.get(), submissionId);
                success = voteService.cancelVoteAsUser(currentUserId.get(), submission);
                logger.info("User vote cancelled: userId={}, submissionId={}, success={}", 
                         currentUserId.get(), submissionId, success);
            } else {
                logger.info("Attempting to cancel anonymous vote: visitorId={}, submissionId={}", 
                         visitorId, submissionId);
                success = voteService.cancelVote(visitorId, submission);
                logger.info("Anonymous vote cancelled: visitorId={}, submissionId={}, success={}", 
                         visitorId, submissionId, success);
            }
            
            int updatedVoteCount = voteService.countVotesForSubmission(submission);
            
            // Create response with success status and updated count
            Map<String, Object> response = new HashMap<>();
            response.put("success", success);
            response.put("voteCount", updatedVoteCount);
            
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            logger.error("Failed to cancel vote: submissionId={}, visitorId={}, userId={}, error={}", 
                       submissionId, visitorId, currentUserId.orElse(null), e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
