package com.munichweekly.backend.controller;

import com.munichweekly.backend.model.Issue;
import com.munichweekly.backend.repository.IssueRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/issues")
public class IssueController {

    private final IssueRepository issueRepository;

    public IssueController(IssueRepository issueRepository) {
        this.issueRepository = issueRepository;
    }

    @GetMapping
    public List<Issue> getAllIssues() {
        return issueRepository.findAll();
    }
}