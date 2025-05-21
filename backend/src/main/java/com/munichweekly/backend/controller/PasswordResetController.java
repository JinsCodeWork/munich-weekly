package com.munichweekly.backend.controller;

import com.munichweekly.backend.dto.ForgotPasswordRequestDTO;
import com.munichweekly.backend.dto.ResetPasswordRequestDTO;
import com.munichweekly.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for password reset functionality.
 */
@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {

    private final UserService userService;

    public PasswordResetController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Request password reset. If email exists, an email with reset link will be sent.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequestDTO dto) {
        userService.requestPasswordReset(dto);
        return ResponseEntity.ok().body(
                Map.of("message", "If your email exists in our system, you will receive an email with a password reset link shortly")
        );
    }

    /**
     * Reset password using token sent via email.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequestDTO dto) {
        userService.resetPassword(dto);
        return ResponseEntity.ok().body(
                Map.of("message", "Password reset successful")
        );
    }
} 