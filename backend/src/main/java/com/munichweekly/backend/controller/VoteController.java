package com.munichweekly.backend.controller;

import com.munichweekly.backend.model.Vote;
import com.munichweekly.backend.service.VoteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for handling user voting.
 * Allows users to vote for submissions in a given issue.
 */
@RestController
@RequestMapping("/api/votes")
public class VoteController {

    private final VoteService voteService;

    public VoteController(VoteService voteService) {
        this.voteService = voteService;
    }

    /**
     * Submit a vote for a submission in a specific issue.
     * This endpoint assumes the user is authenticated (simulated userId).
     */
    @PostMapping
    public ResponseEntity<Vote> vote(@RequestParam Long submissionId) {
        Long fakeUserId = 2L; // Simulated user ID (e.g., Xiaoming)
        Vote vote = voteService.vote(fakeUserId, submissionId);
        return ResponseEntity.ok(vote);
    }
}
