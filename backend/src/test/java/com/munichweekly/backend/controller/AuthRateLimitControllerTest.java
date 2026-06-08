package com.munichweekly.backend.controller;

import com.munichweekly.backend.config.AuthRateLimitProperties;
import com.munichweekly.backend.dto.EmailLoginRequestDTO;
import com.munichweekly.backend.dto.ForgotPasswordRequestDTO;
import com.munichweekly.backend.dto.LoginResponseDTO;
import com.munichweekly.backend.exception.GlobalExceptionHandler;
import com.munichweekly.backend.exception.RateLimitExceededException;
import com.munichweekly.backend.service.AuthRateLimitService;
import com.munichweekly.backend.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthRateLimitControllerTest {

    @Test
    void repeatedLoginFailureBlocksBeforeCallingUserServiceAgain() {
        UserService userService = mock(UserService.class);
        AuthController controller = new AuthController(
                userService,
                new AuthRateLimitService(properties(1, 900, 3, 3600, 0), fixedClock())
        );
        HttpServletRequest request = request("203.0.113.10");
        EmailLoginRequestDTO dto = loginRequest("user@example.com");
        when(userService.loginWithEmail(any(EmailLoginRequestDTO.class)))
                .thenThrow(new IllegalArgumentException("Invalid email or password"));

        assertThatThrownBy(() -> controller.loginWithEmail(dto, request))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> controller.loginWithEmail(dto, request))
                .isInstanceOf(RateLimitExceededException.class);

        verify(userService, times(1)).loginWithEmail(any(EmailLoginRequestDTO.class));
    }

    @Test
    void successfulLoginClearsPreviousFailures() {
        UserService userService = mock(UserService.class);
        AuthController controller = new AuthController(
                userService,
                new AuthRateLimitService(properties(2, 900, 3, 3600, 0), fixedClock())
        );
        HttpServletRequest request = request("203.0.113.10");
        EmailLoginRequestDTO dto = loginRequest("user@example.com");
        when(userService.loginWithEmail(any(EmailLoginRequestDTO.class)))
                .thenThrow(new IllegalArgumentException("Invalid email or password"))
                .thenReturn(new LoginResponseDTO("token", "User", null, "user"))
                .thenThrow(new IllegalArgumentException("Invalid email or password"))
                .thenThrow(new IllegalArgumentException("Invalid email or password"));

        assertThatThrownBy(() -> controller.loginWithEmail(dto, request))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(controller.loginWithEmail(dto, request).getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThatThrownBy(() -> controller.loginWithEmail(dto, request))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> controller.loginWithEmail(dto, request))
                .isInstanceOf(IllegalArgumentException.class);

        verify(userService, times(4)).loginWithEmail(any(EmailLoginRequestDTO.class));
    }

    @Test
    void passwordResetOverLimitDoesNotCallUserServiceAgain() {
        UserService userService = mock(UserService.class);
        PasswordResetController controller = new PasswordResetController(
                userService,
                new AuthRateLimitService(properties(10, 900, 1, 3600, 0), fixedClock())
        );
        HttpServletRequest request = request("203.0.113.10");
        ForgotPasswordRequestDTO dto = new ForgotPasswordRequestDTO("user@example.com");
        doNothing().when(userService).requestPasswordReset(any(ForgotPasswordRequestDTO.class));

        assertThat(controller.forgotPassword(dto, request).getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThatThrownBy(() -> controller.forgotPassword(dto, request))
                .isInstanceOf(RateLimitExceededException.class);

        verify(userService, times(1)).requestPasswordReset(any(ForgotPasswordRequestDTO.class));
    }

    @Test
    void passwordResetSuccessResponsesRemainIndistinguishableForDifferentEmails() {
        UserService userService = mock(UserService.class);
        PasswordResetController controller = new PasswordResetController(
                userService,
                new AuthRateLimitService(properties(10, 900, 10, 3600, 0), fixedClock())
        );
        doNothing().when(userService).requestPasswordReset(any(ForgotPasswordRequestDTO.class));

        ResponseEntity<?> existingEmailResponse = controller.forgotPassword(
                new ForgotPasswordRequestDTO("existing@example.com"),
                request("203.0.113.10")
        );
        ResponseEntity<?> missingEmailResponse = controller.forgotPassword(
                new ForgotPasswordRequestDTO("missing@example.com"),
                request("203.0.113.10")
        );

        assertThat(existingEmailResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(missingEmailResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(missingEmailResponse.getBody()).isEqualTo(existingEmailResponse.getBody());
    }

    @Test
    void rateLimitExceptionHandlerReturnsGeneric429() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();

        ResponseEntity<?> response = handler.handleRateLimitExceeded(new RateLimitExceededException(123));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(response.getHeaders().getFirst(HttpHeaders.RETRY_AFTER)).isEqualTo("123");
        assertThat(response.getBody()).isInstanceOf(Map.class);

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertThat(body)
                .containsEntry("error", "Too Many Requests")
                .containsEntry("message", "Too many requests. Please try again later.");
        assertThat(body.toString()).doesNotContain("user@example.com", "203.0.113.10", "exists");
    }

    private static EmailLoginRequestDTO loginRequest(String email) {
        EmailLoginRequestDTO dto = new EmailLoginRequestDTO();
        dto.setEmail(email);
        dto.setPassword("password");
        return dto;
    }

    private static HttpServletRequest request(String remoteAddr) {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRemoteAddr()).thenReturn(remoteAddr);
        return request;
    }

    private static Clock fixedClock() {
        return Clock.fixed(Instant.parse("2026-06-08T12:00:00Z"), ZoneId.of("UTC"));
    }

    private static AuthRateLimitProperties properties(
            int loginMaxAttempts,
            long loginWindowSeconds,
            int passwordResetMaxAttempts,
            long passwordResetWindowSeconds,
            long passwordResetCooldownSeconds
    ) {
        AuthRateLimitProperties properties = new AuthRateLimitProperties();
        properties.getLogin().setMaxAttempts(loginMaxAttempts);
        properties.getLogin().setWindowSeconds(loginWindowSeconds);
        properties.getPasswordReset().setMaxAttempts(passwordResetMaxAttempts);
        properties.getPasswordReset().setWindowSeconds(passwordResetWindowSeconds);
        properties.getPasswordReset().setCooldownSeconds(passwordResetCooldownSeconds);
        return properties;
    }
}
