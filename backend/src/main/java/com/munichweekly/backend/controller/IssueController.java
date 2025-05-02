package com.munichweekly.backend.controller;

import com.munichweekly.backend.devtools.annotation.Description;
import com.munichweekly.backend.dto.IssueCreateRequestDTO;
import com.munichweekly.backend.model.Issue;
import com.munichweekly.backend.repository.IssueRepository;
import com.munichweekly.backend.service.IssueService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/issues")
public class IssueController {

    private final IssueRepository issueRepository;
    private final IssueService issueService;

    public IssueController(IssueRepository issueRepository, IssueService issueService) {
        this.issueRepository = issueRepository;
        this.issueService = issueService;
    }

    @Description("Get all issues in the system")
    @GetMapping
    public List<Issue> getAllIssues() {
        return issueRepository.findAll();
    }

    /**
     * Create a new issue (admin only).
     * Accepts title, description, submission/voting times.
     */
    @Description("Create a new issue. Admin only. Accepts title, description, and submission/voting periods")
    @PreAuthorize("hasAuthority('admin')")
    @PostMapping
    public ResponseEntity<Issue> createIssue(@RequestBody IssueCreateRequestDTO dto) {
        Issue created = issueService.createIssue(dto);
        return ResponseEntity.ok(created);
    }
}