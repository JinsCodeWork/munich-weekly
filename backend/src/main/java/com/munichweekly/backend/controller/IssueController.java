package com.munichweekly.backend.controller;

import com.munichweekly.backend.devtools.annotation.Description;
import com.munichweekly.backend.dto.IssueCreateRequestDTO;
import com.munichweekly.backend.dto.IssueResponseDTO;
import com.munichweekly.backend.dto.IssueUpdateRequestDTO;
import com.munichweekly.backend.model.Issue;
import com.munichweekly.backend.repository.IssueRepository;
import com.munichweekly.backend.service.IssueService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/issues")
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
    @PreAuthorize("hasAuthority('admin')")
    @PutMapping("/{id}")
    public ResponseEntity<IssueResponseDTO> updateIssue(@PathVariable Long id, @RequestBody @Valid IssueUpdateRequestDTO dto) {
        Issue updated = issueService.updateIssue(id, dto);
        return ResponseEntity.ok(IssueResponseDTO.fromEntity(updated));
    }
}