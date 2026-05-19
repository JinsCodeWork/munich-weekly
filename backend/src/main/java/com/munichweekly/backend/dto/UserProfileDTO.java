package com.munichweekly.backend.dto;

import com.munichweekly.backend.model.User;

/**
 * Authenticated user's profile — safe subset for /me and profile updates.
 */
public class UserProfileDTO {
    private Long id;
    private String email;
    private String nickname;
    private String role;
    private String avatarUrl;

    public UserProfileDTO() {
    }

    public UserProfileDTO(Long id, String email, String nickname, String role, String avatarUrl) {
        this.id = id;
        this.email = email;
        this.nickname = nickname;
        this.role = role;
        this.avatarUrl = avatarUrl;
    }

    public static UserProfileDTO fromEntity(User user) {
        return new UserProfileDTO(
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                user.getRole(),
                user.getAvatarUrl()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
}
