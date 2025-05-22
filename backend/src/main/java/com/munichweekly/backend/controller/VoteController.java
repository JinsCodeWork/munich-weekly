package com.munichweekly.backend.controller;

import com.munichweekly.backend.devtools.annotation.Description;
import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.model.Vote;
import com.munichweekly.backend.security.CurrentUserUtil;
import com.munichweekly.backend.service.VoteService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.munichweekly.backend.repository.SubmissionRepository;
import com.munichweekly.backend.repository.VoteRepository;
import org.springframework.web.server.ResponseStatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.RequestAttributes;

import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@RestController
@RequestMapping("/api/votes")
public class VoteController {
    private static final Logger logger = LoggerFactory.getLogger(VoteController.class);

    private final VoteService voteService;
    private final SubmissionRepository submissionRepository;
    private final VoteRepository voteRepository;

    public VoteController(VoteService voteService, SubmissionRepository submissionRepository, VoteRepository voteRepository) {
        this.voteService = voteService;
        this.submissionRepository = submissionRepository;
        this.voteRepository = voteRepository;
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

        // 获取当前登录用户ID（如果已登录）
        Optional<Long> currentUserId = CurrentUserUtil.getCurrentUserId();
        
        logger.info("Submit vote: submissionId={}, visitorId={}, userId={}", 
                 submissionId, visitorId, currentUserId.orElse(null));
        
        // 如果未登录且没有visitorId，则返回错误
        if (currentUserId.isEmpty() && (visitorId == null || visitorId.isEmpty())) {
            logger.warn("Vote attempt without authentication: submissionId={}", submissionId);
            return ResponseEntity.badRequest().body("Authentication required: either login or enable cookies for visitorId.");
        }

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found"));

        String ipAddress = request.getRemoteAddr();

        // 使用用户ID或visitorId进行投票
        Vote vote;
        if (currentUserId.isPresent()) {
            vote = voteService.voteAsUser(currentUserId.get(), submission, ipAddress);
            logger.info("User vote successful: userId={}, submissionId={}", currentUserId.get(), submissionId);
        } else {
            vote = voteService.vote(visitorId, submission, ipAddress);
            logger.info("Anonymous vote successful: visitorId={}, submissionId={}", visitorId, submissionId);
        }
        
        // Get current vote count
        int currentVoteCount = voteRepository.findBySubmission(submission).size();
        
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

        // 获取当前登录用户ID（如果已登录）
        Optional<Long> currentUserId = CurrentUserUtil.getCurrentUserId();
        
        logger.debug("Check vote status: submissionId={}, visitorId={}, userId={}", 
                   submissionId, visitorId, currentUserId.orElse(null));
        
        // 如果既没有登录也没有visitorId，则视为未投票
        if (currentUserId.isEmpty() && (visitorId == null || visitorId.isEmpty())) {
            logger.debug("No visitorId or user found, assuming not voted");
            return ResponseEntity.ok(Map.of("voted", false));
        }

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found"));

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
            
        // 获取当前登录用户ID（如果已登录）
        Optional<Long> currentUserId = CurrentUserUtil.getCurrentUserId();
        
        logger.info("Cancel vote request: submissionId={}, visitorId={}, userId={}, cookies={}", 
                 submissionId, visitorId, currentUserId.orElse(null), 
                 java.util.Arrays.toString(((HttpServletRequest)RequestContextHolder.currentRequestAttributes().resolveReference(RequestAttributes.REFERENCE_REQUEST)).getCookies()));
        
        // 如果未登录且没有visitorId，则返回错误
        if (currentUserId.isEmpty() && (visitorId == null || visitorId.isEmpty())) {
            logger.warn("Cancel vote attempt without authentication: submissionId={}", submissionId);
            return ResponseEntity.badRequest().body("Authentication required: either login or enable cookies for visitorId.");
        }
        
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found"));

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
            
            // Get updated vote count
            int updatedVoteCount = voteRepository.findBySubmission(submission).size();
            
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
