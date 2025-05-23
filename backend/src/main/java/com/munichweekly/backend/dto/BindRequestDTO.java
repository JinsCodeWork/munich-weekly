package com.munichweekly.backend.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for binding a third-party provider account (e.g. Google, WeChat) to the current logged-in user.
 */
public class BindRequestDTO {

    @NotBlank(message = "Provider must not be blank")
    private String provider;

    @NotBlank(message = "Provider user ID must not be blank")
    private String providerUserId;

    private String displayName;

    private String avatarUrl;

    public BindRequestDTO() {
        // Default constructor
    }

    // generate getters and setters

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getProviderUserId() {
        return providerUserId;
    }

    public void setProviderUserId(String providerUserId) {
        this.providerUserId = providerUserId;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }
}