package com.munichweekly.backend.dto;

/**
 * DTO representing a third-party provider account linked to the current user.
 * Used for display in "Account Settings" or "Linked Accounts" page.
 */
public class UserAuthProviderResponseDTO {

    private String provider;       // e.g. google, wechat
    private String displayName;    // Nickname from third-party platform
    private String avatarUrl;      // Avatar URL from third-party platform

    public UserAuthProviderResponseDTO() {
        // default constructor
    }

    public UserAuthProviderResponseDTO(String provider, String displayName, String avatarUrl) {
        this.provider = provider;
        this.displayName = displayName;
        this.avatarUrl = avatarUrl;
    }

    // generate getters and setters

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
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