package com.munichweekly.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * 忘记密码请求DTO
 */
public class ForgotPasswordRequestDTO {

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email")
    private String email;

    // 默认构造函数
    public ForgotPasswordRequestDTO() {}

    // 带参数构造函数
    public ForgotPasswordRequestDTO(String email) {
        this.email = email;
    }

    // Getters and Setters
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
} 