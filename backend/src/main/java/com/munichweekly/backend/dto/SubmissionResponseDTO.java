package com.munichweekly.backend.dto;

import com.munichweekly.backend.model.Submission;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO used for returning approved submissions in public views.
 * This class is designed for GET /api/submissions?issueId=... endpoint,
 * exposing only the necessary fields to the frontend.
 * 
 * **Enhanced with image dimension fields for optimized masonry layout**
 */
public class SubmissionResponseDTO {
    private Long id;
    private String imageUrl;
    private String description;
    private String nickname;
    private LocalDateTime submittedAt;
    private Long voteCount;
    
    // **NEW: Image dimension fields for optimized masonry layout**
    private Integer imageWidth;
    private Integer imageHeight;
    private BigDecimal aspectRatio;

    public SubmissionResponseDTO() {
        // Default constructor (optional)
    }

    public SubmissionResponseDTO(Submission s, long voteCount) {
        this.id = s.getId();
        this.imageUrl = s.getImageUrl() != null ? s.getImageUrl() : "";
        this.description = s.getDescription();
        this.nickname = s.getUser().getNickname();
        this.submittedAt = s.getSubmittedAt();
        this.voteCount = voteCount;
        
        // **NEW: Include dimension data when available**
        this.imageWidth = s.getImageWidth();
        this.imageHeight = s.getImageHeight();
        this.aspectRatio = s.getAspectRatio();
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
    
    // **NEW: Image dimension getters and setters**
    
    public Integer getImageWidth() {
        return imageWidth;
    }

    public void setImageWidth(Integer imageWidth) {
        this.imageWidth = imageWidth;
    }

    public Integer getImageHeight() {
        return imageHeight;
    }

    public void setImageHeight(Integer imageHeight) {
        this.imageHeight = imageHeight;
    }

    public BigDecimal getAspectRatio() {
        return aspectRatio;
    }

    public void setAspectRatio(BigDecimal aspectRatio) {
        this.aspectRatio = aspectRatio;
    }
}
