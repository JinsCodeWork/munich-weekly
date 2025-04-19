package com.munichweekly.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO for updating user profile (nickname and avatar).
 */
public class UserUpdateRequestDTO {

    @NotBlank(message = "Nickname cannot be blank")
    @Size(min = 1, max = 50, message = "Nickname must be between 1 and 50 characters")
    private String nickname;

    @Size(max = 500, message = "Avatar URL too long")
    private String avatarUrl;

    public UserUpdateRequestDTO() {
        // Default constructor
    }

    // generate getters and setters

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
}