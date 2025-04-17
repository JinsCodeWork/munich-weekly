package com.munichweekly.backend.controller;

import com.munichweekly.backend.dto.SubmissionRequestDTO;
import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.service.SubmissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/submissions")
public class SubmissionController {

    private final SubmissionService submissionService;

    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    @PostMapping
    public ResponseEntity<?> submit(@RequestBody SubmissionRequestDTO dto) {
        // ⚠️ 模拟一个当前登录用户 ID（将来用认证系统替代）
        Long fakeUserId = 43L; // 小明的 user.id

        Submission saved = submissionService.submit(fakeUserId, dto);
        return ResponseEntity.ok(saved);
    }
}