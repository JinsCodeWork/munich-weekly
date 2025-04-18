package com.munichweekly.backend.dto;

import com.munichweekly.backend.model.Submission;

import java.time.LocalDateTime;

/**
 * DTO used for returning approved submissions in public views.
 * This class is designed for GET /api/submissions?issueId=... endpoint,
 * exposing only the necessary fields to the frontend.
 */
public class SubmissionResponseDTO {
    private Long id;
    private String imageUrl;
    private String description;
    private String nickname;
    private LocalDateTime submittedAt;
    private Long voteCount;

    public SubmissionResponseDTO() {
        // 默认构造器（可选）
    }

    public SubmissionResponseDTO(Submission s, long voteCount) {
        this.id = s.getId();
        this.imageUrl = s.getImageUrl();
        this.description = s.getDescription();
        this.nickname = s.getUser().getNickname();
        this.submittedAt = s.getSubmittedAt();
        this.voteCount = voteCount;
    }

    // getter/setter 可通过 IDE 自动生成，无需手动编写

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public Long getVoteCount() {
        return voteCount;
    }

    public void setVoteCount(Long voteCount) {
        this.voteCount = voteCount;
    }
}
