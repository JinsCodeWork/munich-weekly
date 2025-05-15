package com.munichweekly.backend.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for changing user password.
 */
public class ChangePasswordRequestDTO {

    @NotBlank(message = "Old password is required")
    private String oldPassword;

    @NotBlank(message = "New password is required")
    private String newPassword;

    // Default constructor
    public ChangePasswordRequestDTO() {}

    // Constructor with fields
    public ChangePasswordRequestDTO(String oldPassword, String newPassword) {
        this.oldPassword = oldPassword;
        this.newPassword = newPassword;
    }

    // Getters and setters
    public String getOldPassword() {
        return oldPassword;
    }

    public void setOldPassword(String oldPassword) {
        this.oldPassword = oldPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
} 