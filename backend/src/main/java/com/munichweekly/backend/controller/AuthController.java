package com.munichweekly.backend.controller;

import com.munichweekly.backend.devtools.annotation.Description;
import com.munichweekly.backend.dto.*;
import com.munichweekly.backend.security.CurrentUserUtil;
import com.munichweekly.backend.service.AuthRateLimitService;
import com.munichweekly.backend.service.UserService;

import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

/**
 * Controller for authentication (login) endpoints.
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Login, registration, and linked provider account management")
public class AuthController {

    private static final String THIRD_PARTY_AUTH_DISABLED = "Third-party authentication is not enabled.";

    private final UserService userService;
    private final AuthRateLimitService authRateLimitService;

    public AuthController(UserService userService, AuthRateLimitService authRateLimitService) {
        this.userService = userService;
        this.authRateLimitService = authRateLimitService;
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
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Authenticated"),
            @ApiResponse(responseCode = "400", description = "Invalid request or invalid email/password"),
            @ApiResponse(responseCode = "429", description = "Too many login attempts")
    })
    @PostMapping("/login/email")
    public ResponseEntity<LoginResponseDTO> loginWithEmail(
            @Valid @RequestBody EmailLoginRequestDTO dto,
            HttpServletRequest request
    ) {
        authRateLimitService.checkLoginAllowed(dto.getEmail(), request);
        try {
            LoginResponseDTO response = userService.loginWithEmail(dto);
            authRateLimitService.clearLoginFailures(dto.getEmail(), request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            authRateLimitService.recordLoginFailure(dto.getEmail(), request);
            throw ex;
        }
    }

    /**
     * Login with third-party provider (e.g. Google).
     * Will auto-create user if first-time login.
     */
    @Description("Login with a third-party provider (e.g. Google). Auto-creates user on first login")
    @Operation(
            summary = "Login with provider",
            description = "Third-party authentication is currently disabled."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "501", description = "Third-party authentication is not enabled")
    })
    @PostMapping("/login/provider")
    public ResponseEntity<LoginResponseDTO> loginWithProvider() {
        throw thirdPartyAuthDisabled();
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
            description = "Third-party authentication is currently disabled."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "501", description = "Third-party authentication is not enabled")
    })
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/bind")
    @PreAuthorize("hasAnyAuthority('user', 'admin')")
    public ResponseEntity<?> bindProvider() {
        throw thirdPartyAuthDisabled();
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

    private static ResponseStatusException thirdPartyAuthDisabled() {
        return new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED, THIRD_PARTY_AUTH_DISABLED);
    }
}
