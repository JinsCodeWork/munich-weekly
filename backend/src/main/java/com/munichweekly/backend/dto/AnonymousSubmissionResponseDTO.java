package com.munichweekly.backend.dto;

public class AnonymousSubmissionResponseDTO {
    private Long submissionId;
    private String uploadUrl;
    private String uploadToken;

    public AnonymousSubmissionResponseDTO(Long submissionId, String uploadUrl, String uploadToken) {
        this.submissionId = submissionId;
        this.uploadUrl = uploadUrl;
        this.uploadToken = uploadToken;
    }

    public Long getSubmissionId() {
        return submissionId;
    }

    public void setSubmissionId(Long submissionId) {
        this.submissionId = submissionId;
    }

    public String getUploadUrl() {
        return uploadUrl;
    }

    public void setUploadUrl(String uploadUrl) {
        this.uploadUrl = uploadUrl;
    }

    public String getUploadToken() {
        return uploadToken;
    }

    public void setUploadToken(String uploadToken) {
        this.uploadToken = uploadToken;
    }
}
