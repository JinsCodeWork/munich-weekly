package com.munichweekly.backend.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for third-party login (e.g. Google, WeChat), mapped to UserAuthProvider entity.
 * Used for OAuth login and auto-registration flow.
 */
public class UserAuthProviderLoginRequestDTO {

    @NotBlank(message = "Provider must not be blank")
    private String provider;

    @NotBlank(message = "Provider user ID must not be blank")
    private String providerUserId;

    private String displayName;

    private String avatarUrl;

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

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
}