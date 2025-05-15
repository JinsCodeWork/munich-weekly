package com.munichweekly.backend.dto;

import com.munichweekly.backend.model.Submission;
import java.time.LocalDateTime;

/**
 * DTO for returning submissions in admin management view.
 * Includes complete submission information and user details.
 */
public class AdminSubmissionResponseDTO {

    private Long id;
    private String imageUrl;
    private String description;
    private String status;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private boolean isCover;
    private int voteCount;
    
    // 用户信息
    private Long userId;
    private String userEmail;
    private String userNickname;
    private String userAvatarUrl;
    
    public AdminSubmissionResponseDTO() {
        // Default constructor
    }
    
    public AdminSubmissionResponseDTO(Submission s, int voteCount) {
        this.id = s.getId();
        this.imageUrl = s.getImageUrl();
        this.description = s.getDescription();
        this.status = s.getStatus();
        this.submittedAt = s.getSubmittedAt();
        this.reviewedAt = s.getReviewedAt();
        this.isCover = Boolean.TRUE.equals(s.getCover());
        this.voteCount = voteCount;
        
        // 设置用户信息
        if (s.getUser() != null) {
            this.userId = s.getUser().getId();
            this.userEmail = s.getUser().getEmail();
            this.userNickname = s.getUser().getNickname();
            this.userAvatarUrl = s.getUser().getAvatarUrl();
        }
    }
    
    // Getters and setters
    
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
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }
    
    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }
    
    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }
    
    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }
    
    public boolean isCover() {
        return isCover;
    }
    
    public void setCover(boolean cover) {
        isCover = cover;
    }
    
    public int getVoteCount() {
        return voteCount;
    }
    
    public void setVoteCount(int voteCount) {
        this.voteCount = voteCount;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public String getUserEmail() {
        return userEmail;
    }
    
    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }
    
    public String getUserNickname() {
        return userNickname;
    }
    
    public void setUserNickname(String userNickname) {
        this.userNickname = userNickname;
    }
    
    public String getUserAvatarUrl() {
        return userAvatarUrl;
    }
    
    public void setUserAvatarUrl(String userAvatarUrl) {
        this.userAvatarUrl = userAvatarUrl;
    }
} 