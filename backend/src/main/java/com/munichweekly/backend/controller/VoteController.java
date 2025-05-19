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

import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@RestController
@RequestMapping("/api/votes")
public class VoteController {

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
        
        // 如果未登录且没有visitorId，则返回错误
        if (currentUserId.isEmpty() && (visitorId == null || visitorId.isEmpty())) {
            return ResponseEntity.badRequest().body("Authentication required: either login or enable cookies for visitorId.");
        }

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found"));

        String ipAddress = request.getRemoteAddr();

        // 使用用户ID或visitorId进行投票
        Vote vote;
        if (currentUserId.isPresent()) {
            vote = voteService.voteAsUser(currentUserId.get(), submission, ipAddress);
        } else {
            vote = voteService.vote(visitorId, submission, ipAddress);
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
        
        // 如果既没有登录也没有visitorId，则视为未投票
        if (currentUserId.isEmpty() && (visitorId == null || visitorId.isEmpty())) {
            return ResponseEntity.ok(Map.of("voted", false));
        }

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found"));

        boolean voted;
        if (currentUserId.isPresent()) {
            voted = voteService.hasVotedAsUser(currentUserId.get(), submission);
        } else {
            voted = voteService.hasVoted(visitorId, submission);
        }
        
        return ResponseEntity.ok(Map.of("voted", voted));
    }
}
