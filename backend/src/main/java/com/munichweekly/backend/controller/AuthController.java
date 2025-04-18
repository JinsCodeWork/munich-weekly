package com.munichweekly.backend.controller;

import com.munichweekly.backend.dto.LoginRequestDTO;
import com.munichweekly.backend.dto.LoginResponseDTO;
import com.munichweekly.backend.dto.UserRegisterRequestDTO;
import com.munichweekly.backend.service.UserService;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
     * Login endpoint for both email/password and third-party login.
     * Returns JWT token and basic user info if authentication is successful.
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO dto) {
        LoginResponseDTO response = userService.login(dto);
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
}