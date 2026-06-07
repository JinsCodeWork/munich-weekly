package com.munichweekly.backend.controller;

import com.munichweekly.backend.devtools.annotation.Description;
import com.munichweekly.backend.dto.IssueCreateRequestDTO;
import com.munichweekly.backend.dto.IssueResponseDTO;
import com.munichweekly.backend.dto.IssueUpdateRequestDTO;
import com.munichweekly.backend.model.Issue;
import com.munichweekly.backend.repository.IssueRepository;
import com.munichweekly.backend.service.IssueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/issues")
@Tag(name = "Issues", description = "Weekly photo issue scheduling and admin management")
public class IssueController {

    private final IssueRepository issueRepository;
    private final IssueService issueService;

    public IssueController(IssueRepository issueRepository, IssueService issueService) {
        this.issueRepository = issueRepository;
        this.issueService = issueService;
    }

    /**
     * Get all issues in the system
     */
    @Description("Get all issues in the system")
    @Operation(
            summary = "List issues",
            description = "Returns all weekly issues in the system."
    )
    @GetMapping
    public List<IssueResponseDTO> getAllIssues() {
        return issueRepository.findAll().stream()
                .map(IssueResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get a specific issue by ID (admin only)
     */
    @Description("Get a specific issue by ID - Admin only")
    @Operation(
            summary = "Get issue by ID",
            description = "Returns one issue by ID. Admin access is required."
    )
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAuthority('admin')")
    @GetMapping("/{id}")
    public ResponseEntity<IssueResponseDTO> getIssueById(@PathVariable Long id) {
        Issue issue = issueService.getIssueById(id);
        return ResponseEntity.ok(IssueResponseDTO.fromEntity(issue));
    }

    /**
     * Create a new issue (admin only).
     * Accepts title, description, submission/voting times.
     */
    @Description("Create a new issue. Admin only. Accepts title, description, and submission/voting periods")
    @Operation(
            summary = "Create issue",
            description = "Creates a weekly issue with submission and voting windows. Admin access is required."
    )
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAuthority('admin')")
    @PostMapping
    public ResponseEntity<IssueResponseDTO> createIssue(@RequestBody @Valid IssueCreateRequestDTO dto) {
        Issue created = issueService.createIssue(dto);
        return ResponseEntity.ok(IssueResponseDTO.fromEntity(created));
    }

    /**
     * Update an existing issue (admin only).
     * Allows editing title, description, and submission/voting periods.
     */
    @Description("Update an existing issue. Admin only. Allows editing all issue fields including title, description, and time periods")
    @Operation(
            summary = "Update issue",
            description = "Updates an existing weekly issue. Admin access is required."
    )
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAuthority('admin')")
    @PutMapping("/{id}")
    public ResponseEntity<IssueResponseDTO> updateIssue(@PathVariable Long id, @RequestBody @Valid IssueUpdateRequestDTO dto) {
        Issue updated = issueService.updateIssue(id, dto);
        return ResponseEntity.ok(IssueResponseDTO.fromEntity(updated));
    }

    /**
     * Delete an existing issue (admin only).
     * Refuses deletion when dependent submissions, votes, or gallery config exist.
     */
    @Description("Delete an existing issue. Admin only. Refuses deletion when dependencies exist")
    @Operation(
            summary = "Delete issue",
            description = "Deletes an issue when dependency rules allow it. Admin access is required."
    )
    @ApiResponse(responseCode = "204", description = "Issue deleted")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAuthority('admin')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIssue(@PathVariable Long id) {
        issueService.deleteIssue(id);
        return ResponseEntity.noContent().build();
    }
}
