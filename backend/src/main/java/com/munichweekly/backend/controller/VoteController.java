package com.munichweekly.backend.controller;

import com.munichweekly.backend.devtools.annotation.Description;
import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.model.Vote;
import com.munichweekly.backend.security.CurrentUserUtil;
import com.munichweekly.backend.service.VoteService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.munichweekly.backend.repository.SubmissionRepository;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/votes")
public class VoteController {

    private final VoteService voteService;
    private final SubmissionRepository submissionRepository;

    public VoteController(VoteService voteService, SubmissionRepository submissionRepository) {
        this.voteService = voteService;
        this.submissionRepository = submissionRepository;
    }

    /**
     * Submit a vote for a submission using visitorId.
     * visitorId is passed via HTTP cookie.
     */
    @Description("Submit a vote for a submission. Uses visitorId from cookie.")
    @PostMapping
    public ResponseEntity<?> vote(
            @RequestParam Long submissionId,
            @CookieValue(name = "visitorId", required = false) String visitorId,
            HttpServletRequest request) {

        if (visitorId == null || visitorId.isEmpty()) {
            return ResponseEntity.badRequest().body("Missing visitorId cookie.");
        }

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found"));

        String ipAddress = request.getRemoteAddr();

        Vote vote = voteService.vote(visitorId, submission, ipAddress);
        return ResponseEntity.ok(vote);
    }

    /**
     * Check whether a visitor has already voted for a specific submission.
     */
    @Description("Check if current visitor has voted for a submission.")
    @GetMapping("/check")
    public ResponseEntity<?> hasVoted(
            @RequestParam Long submissionId,
            @CookieValue(name = "visitorId", required = false) String visitorId) {

        if (visitorId == null || visitorId.isEmpty()) {
            return ResponseEntity.ok(Map.of("voted", false)); // treat as not voted
        }

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found"));

        boolean voted = voteService.hasVoted(visitorId, submission);
        return ResponseEntity.ok(Map.of("voted", voted));
    }
}
