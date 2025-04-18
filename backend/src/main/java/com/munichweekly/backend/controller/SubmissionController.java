package com.munichweekly.backend.controller;

import com.munichweekly.backend.dto.SubmissionRequestDTO;
import com.munichweekly.backend.dto.SubmissionResponseDTO;
import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.security.CurrentUserUtil;
import com.munichweekly.backend.service.SubmissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for handling photo submissions.
 * Provides endpoints for submitting, retrieving, and managing submissions.
 */
@RestController
@RequestMapping("/api/submissions")
public class SubmissionController {

    private final SubmissionService submissionService;

    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    /**
     * Submit a new photo to a specific issue.
     * Called by authenticated users (currently simulated).
     */
    @PreAuthorize("hasAnyAuthority('user', 'admin')")
    @PostMapping
    public ResponseEntity<?> submit(@RequestBody SubmissionRequestDTO dto) {
        Long actualId = CurrentUserUtil.getUserIdOrThrow();
        Submission saved = submissionService.submit(actualId, dto);
        return ResponseEntity.ok(saved);
    }

    /**
     * Get all approved submissions under a specific issue,
     * including the number of votes for each submission.
     *
     * @param issueId ID of the issue
     * @return List of submissions with vote counts
     */
    @GetMapping
    public List<SubmissionResponseDTO> getApprovedSubmissions(@RequestParam Long issueId) {
        return submissionService.listApprovedByIssue(issueId);
    }

    /**
     * Approve a submission. Changes its status to 'approved' and sets reviewed time.
     * Called by admin users (simulated).
     */
    @PreAuthorize("hasAuthority('admin')")
    @PatchMapping("/{id}/approve")
    public ResponseEntity<Submission> approveSubmission(@PathVariable Long id) {
        Submission updated = submissionService.approveSubmission(id);
        return ResponseEntity.ok(updated);
    }

    /**
     * Reject a submission. Changes its status to 'rejected' and sets reviewed time.
     * Called by admin users (simulated).
     */
    @PreAuthorize("hasAuthority('admin')")
    @PatchMapping("/{id}/reject")
    public ResponseEntity<Submission> rejectSubmission(@PathVariable Long id) {
        Submission updated = submissionService.rejectSubmission(id);
        return ResponseEntity.ok(updated);
    }
}
