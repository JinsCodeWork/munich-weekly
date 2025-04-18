package com.munichweekly.backend.dto;

/**
 * DTO returned after successful login.
 * Contains JWT token and basic user info.
 */
public class LoginResponseDTO {

    private String token;
    private String nickname;
    private String avatarUrl;
    private String role;

    public LoginResponseDTO() {}

    public LoginResponseDTO(String token, String nickname, String avatarUrl, String role) {
        this.token = token;
        this.nickname = nickname;
        this.avatarUrl = avatarUrl;
        this.role = role;
    }

    // generate getters and setters

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

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

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}