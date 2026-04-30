package com.munichweekly.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class AnonymousSubmissionRequestDTO {
    @NotNull(message = "Issue is required")
    private Long issueId;

    @NotBlank(message = "Description is required")
    @Size(max = 2000, message = "Description must be 2000 characters or less")
    private String description;

    @Email(message = "Contact email must be a valid email address")
    private String contactEmail;

    @NotBlank(message = "Captcha token is required")
    private String captchaToken;

    public Long getIssueId() {
        return issueId;
    }

    public void setIssueId(Long issueId) {
        this.issueId = issueId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getCaptchaToken() {
        return captchaToken;
    }

    public void setCaptchaToken(String captchaToken) {
        this.captchaToken = captchaToken;
    }
}
