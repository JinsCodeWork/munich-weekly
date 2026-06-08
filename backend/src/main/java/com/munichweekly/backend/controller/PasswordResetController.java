package com.munichweekly.backend.controller;

import com.munichweekly.backend.dto.ForgotPasswordRequestDTO;
import com.munichweekly.backend.dto.ResetPasswordRequestDTO;
import com.munichweekly.backend.service.AuthRateLimitService;
import com.munichweekly.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for password reset functionality.
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Login, registration, and password reset")
public class PasswordResetController {

    private static final String FORGOT_PASSWORD_MESSAGE =
            "If your email exists in our system, you will receive an email with a password reset link shortly";

    private final UserService userService;
    private final AuthRateLimitService authRateLimitService;

    public PasswordResetController(UserService userService, AuthRateLimitService authRateLimitService) {
        this.userService = userService;
        this.authRateLimitService = authRateLimitService;
    }

    /**
     * Request password reset. If email exists, an email with reset link will be sent.
     */
    @Operation(
            summary = "Request password reset",
            description = "Accepts a password reset request and returns a generic response regardless of account existence."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Password reset request accepted"),
            @ApiResponse(responseCode = "400", description = "Invalid request"),
            @ApiResponse(responseCode = "429", description = "Too many password reset requests")
    })
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequestDTO dto,
            HttpServletRequest request
    ) {
        authRateLimitService.checkAndRecordPasswordReset(dto.getEmail(), request);
        userService.requestPasswordReset(dto);
        return ResponseEntity.ok().body(Map.of("message", FORGOT_PASSWORD_MESSAGE));
    }

    /**
     * Reset password using token sent via email.
     */
    @Operation(
            summary = "Reset password",
            description = "Resets an account password using a valid password reset token."
    )
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequestDTO dto) {
        userService.resetPassword(dto);
        return ResponseEntity.ok().body(
                Map.of("message", "Password reset successful")
        );
    }
}
