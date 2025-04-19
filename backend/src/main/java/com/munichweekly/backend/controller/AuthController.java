package com.munichweekly.backend.controller;

import com.munichweekly.backend.dto.*;
import com.munichweekly.backend.security.CurrentUserUtil;
import com.munichweekly.backend.service.UserService;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller for authentication (login) endpoints.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Login with email + password.
     * Returns JWT token and user info.
     */
    @PostMapping("/login/email")
    public ResponseEntity<LoginResponseDTO> loginWithEmail(@Valid @RequestBody EmailLoginRequestDTO dto) {
        LoginResponseDTO response = userService.loginWithEmail(dto);
        return ResponseEntity.ok(response);
    }

    /**
     * Login with third-party provider (e.g. Google/WeChat).
     * Will auto-create user if first-time login.
     */
    @PostMapping("/login/provider")
    public ResponseEntity<LoginResponseDTO> loginWithProvider(@Valid @RequestBody UserAuthProviderLoginRequestDTO dto) {
        LoginResponseDTO response = userService.loginWithThirdParty(dto);
        return ResponseEntity.ok(response);
    }


    /**
     * Register a new user with email, password, and nickname.
     * Returns a JWT token upon successful registration.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody @Valid UserRegisterRequestDTO dto) {
        String token = userService.register(dto);
        return ResponseEntity.ok().body(
                java.util.Map.of("token", token)
        );
    }

    /**
     * Bind a third-party provider (e.g. Google/WeChat) to current logged-in user.
     */
    @PostMapping("/bind")
    @PreAuthorize("hasAnyAuthority('user', 'admin')")
    public ResponseEntity<?> bindProvider(@Valid @RequestBody BindRequestDTO dto) {
        Long userId = CurrentUserUtil.getUserIdOrThrow(); // ← 直接拿当前登录用户ID
        userService.bindThirdPartyAccount(userId, dto);
        return ResponseEntity.ok().body(
                java.util.Map.of("message", "Binding successful")
        );
    }

    /**
     * Get all third-party accounts linked to the current user.
     */
    @GetMapping("/providers")
    @PreAuthorize("hasAnyAuthority('user', 'admin')")
    public ResponseEntity<List<UserAuthProviderResponseDTO>> getLinkedProviders() {
        Long userId = CurrentUserUtil.getUserIdOrThrow();
        List<UserAuthProviderResponseDTO> linked = userService.getLinkedAuthProviders(userId);
        return ResponseEntity.ok(linked);
    }

    /**
     * Unbind a third-party provider from the current user account.
     * Example: DELETE /api/auth/bind/google
     */
    @DeleteMapping("/bind/{provider}")
    @PreAuthorize("hasAnyAuthority('user', 'admin')")
    public ResponseEntity<?> unbindProvider(@PathVariable String provider) {
        Long userId = CurrentUserUtil.getUserIdOrThrow();
        userService.unbindThirdPartyAccount(userId, provider.toLowerCase()); // normalize
        return ResponseEntity.ok().body(
                Map.of("message", "Successfully unbound " + provider)
        );
    }
}