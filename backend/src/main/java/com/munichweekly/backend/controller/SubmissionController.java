package com.munichweekly.backend.controller;

import com.munichweekly.backend.devtools.annotation.Description;
import com.munichweekly.backend.dto.AdminSubmissionResponseDTO;
import com.munichweekly.backend.dto.MySubmissionResponseDTO;
import com.munichweekly.backend.dto.SubmissionRequestDTO;
import com.munichweekly.backend.dto.SubmissionResponseDTO;
import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.security.CurrentUserUtil;
import com.munichweekly.backend.service.SubmissionService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

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
    @Description("Submit a new photo to a specific issue. Requires authentication.")
    @PreAuthorize("hasAnyAuthority('user', 'admin')")
    @PostMapping
    public ResponseEntity<?> submit(@RequestBody SubmissionRequestDTO dto) {
        Long actualId = CurrentUserUtil.getUserIdOrThrow();
        Submission saved = submissionService.submit(actualId, dto);
        return ResponseEntity.ok(Map.of(
            "submissionId", saved.getId(),
            "uploadUrl", "/api/submissions/" + saved.getId() + "/upload"
        ));
    }

    /**
     * Get all approved submissions under a specific issue,
     * including the number of votes for each submission.
     *
     * @param issueId ID of the issue
     * @return List of submissions with vote counts
     */
    @Description("Get all approved submissions under a given issue, including vote counts.")
    @GetMapping
    public List<SubmissionResponseDTO> getApprovedSubmissions(@RequestParam Long issueId) {
        return submissionService.listApprovedByIssue(issueId);
    }

    /**
     * Approve a submission. Changes its status to 'approved' and sets reviewed time.
     * Called by admin users.
     */
    @Description("Approve a submission by ID. Admin only.")
    @PreAuthorize("hasAuthority('admin')")
    @PatchMapping("/{id}/approve")
    public ResponseEntity<Submission> approveSubmission(@PathVariable Long id) {
        Submission updated = submissionService.approveSubmission(id);
        return ResponseEntity.ok(updated);
    }

    /**
     * Reject a submission. Changes its status to 'rejected' and sets reviewed time.
     * Called by admin users.
     */
    @Description("Reject a submission by ID. Admin only.")
    @PreAuthorize("hasAuthority('admin')")
    @PatchMapping("/{id}/reject")
    public ResponseEntity<Submission> rejectSubmission(@PathVariable Long id) {
        Submission updated = submissionService.rejectSubmission(id);
        return ResponseEntity.ok(updated);
    }

    /**
     * Select a submission as featured. Changes its status to 'selected'.
     * Called by admin users.
     */
    @Description("Select a submission as featured. Admin only.")
    @PreAuthorize("hasAuthority('admin')")
    @PatchMapping("/{id}/select")
    public ResponseEntity<Submission> selectSubmission(@PathVariable Long id) {
        Submission updated = submissionService.selectSubmission(id);
        return ResponseEntity.ok(updated);
    }

    /**
     * Retrieve the current user's submissions (optionally filtered by issue).
     */
    @Description("Get the current user's own submissions, optionally filtered by issue.")
    @GetMapping("/mine")
    @PreAuthorize("hasAnyAuthority('user', 'admin')")
    public ResponseEntity<List<MySubmissionResponseDTO>> getMySubmissions(
            @RequestParam(required = false) Long issueId) {
        List<MySubmissionResponseDTO> submissions = submissionService.listMySubmissions(issueId);
        return ResponseEntity.ok(submissions);
    }

    /**
     * Retrieve all submissions for an issue (admin only).
     * This endpoint is used by admins to manage submissions.
     */
    @Description("Get all submissions for an issue, regardless of status. Admin only.")
    @GetMapping("/all")
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<List<AdminSubmissionResponseDTO>> getAllSubmissions(
            @RequestParam(required = false) Long issueId) {
        List<AdminSubmissionResponseDTO> submissions = submissionService.listAllSubmissions(issueId);
        return ResponseEntity.ok(submissions);
    }
    
    /**
     * Delete a submission by ID.
     * Users can only delete their own submissions.
     * Admins can delete any submission.
     */
    @Description("Delete a submission by ID. User can only delete their own submissions.")
    @PreAuthorize("hasAnyAuthority('user', 'admin')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSubmission(@PathVariable Long id) {
        submissionService.deleteSubmission(id);
        return ResponseEntity.ok().body(Map.of("message", "Submission deleted successfully"));
    }

    /**
     * Download all selected submissions for an issue as a ZIP file
     * Admin only functionality
     */
    @Description("Download all selected submissions for an issue as ZIP. Admin only.")
    @PreAuthorize("hasAuthority('admin')")
    @GetMapping("/download-selected/{issueId}")
    public ResponseEntity<Resource> downloadSelectedSubmissions(@PathVariable Long issueId) {
        try {
            Path zipPath = submissionService.downloadSelectedSubmissionsAsZip(issueId);
            
            FileSystemResource resource = new FileSystemResource(zipPath);
            
            String filename = zipPath.getFileName().toString();
            
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(resource);
                    
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.noContent().build();
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
