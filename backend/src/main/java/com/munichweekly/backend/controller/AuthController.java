package com.munichweekly.backend.controller;

import com.munichweekly.backend.devtools.annotation.Description;
import com.munichweekly.backend.dto.*;
import com.munichweekly.backend.security.CurrentUserUtil;
import com.munichweekly.backend.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Authentication", description = "Login, registration, and linked provider account management")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Login with email + password.
     * Returns JWT token and user info.
     */
    @Description("Login with email and password, returns JWT token and user info")
    @Operation(
            summary = "Login with email and password",
            description = "Authenticates a registered user and returns a JWT token with user profile details."
    )
    @PostMapping("/login/email")
    public ResponseEntity<LoginResponseDTO> loginWithEmail(@Valid @RequestBody EmailLoginRequestDTO dto) {
        LoginResponseDTO response = userService.loginWithEmail(dto);
        return ResponseEntity.ok(response);
    }

    /**
     * Login with third-party provider (e.g. Google).
     * Will auto-create user if first-time login.
     */
    @Description("Login with a third-party provider (e.g. Google). Auto-creates user on first login")
    @Operation(
            summary = "Login with provider",
            description = "Authenticates with a supported third-party provider and creates the user on first login."
    )
    @PostMapping("/login/provider")
    public ResponseEntity<LoginResponseDTO> loginWithProvider(@Valid @RequestBody UserAuthProviderLoginRequestDTO dto) {
        LoginResponseDTO response = userService.loginWithThirdParty(dto);
        return ResponseEntity.ok(response);
    }


    /**
     * Register a new user with email, password, and nickname.
     * Returns a JWT token upon successful registration.
     */
    @Description("Register a new user with email, password, and nickname. Returns JWT token")
    @Operation(
            summary = "Register a new user",
            description = "Creates an email/password account and returns a JWT token."
    )
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
    @Description("Bind a third-party provider (e.g. Google or WeChat) to the currently logged-in user")
    @Operation(
            summary = "Bind a third-party provider",
            description = "Links a supported third-party identity provider to the authenticated user."
    )
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/bind")
    @PreAuthorize("hasAnyAuthority('user', 'admin')")
    public ResponseEntity<?> bindProvider(@Valid @RequestBody BindRequestDTO dto) {
        Long userId = CurrentUserUtil.getUserIdOrThrow(); // ← Get current logged-in user ID directly
        userService.bindThirdPartyAccount(userId, dto);
        return ResponseEntity.ok().body(
                java.util.Map.of("message", "Binding successful")
        );
    }

    /**
     * Get all third-party accounts linked to the current user.
     */
    @Description("Get all third-party providers linked to the current logged-in user")
    @Operation(
            summary = "List linked providers",
            description = "Returns the third-party identity providers linked to the authenticated user."
    )
    @SecurityRequirement(name = "bearerAuth")
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
    @Description("Unbind a third-party provider from the current user. Example: DELETE /api/auth/bind/google")
    @Operation(
            summary = "Unbind a third-party provider",
            description = "Removes a linked third-party identity provider from the authenticated user."
    )
    @SecurityRequirement(name = "bearerAuth")
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
