package com.munichweekly.backend.controller;

import com.munichweekly.backend.devtools.annotation.Description;
import com.munichweekly.backend.dto.UserUpdateRequestDTO;
import com.munichweekly.backend.model.User;
import com.munichweekly.backend.repository.UserRepository;
import com.munichweekly.backend.security.CurrentUserUtil;
import com.munichweekly.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final UserService userService;

    public UserController(UserRepository userRepository, UserService userService) {
        this.userRepository = userRepository;
        this.userService = userService;
    }

    // GET /api/users
    @Description("Get a list of all users. Admin only.")
    @PreAuthorize("hasAuthority('admin')")
    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Get information about the currently authenticated user.
     * This endpoint is used by the frontend to retrieve the profile of the logged-in user
     * (such as ID, nickname, email, and role) after successful authentication.
     * ⚠️ Note:
     * This endpoint requires a valid JWT token in the Authorization header.
     * If the token is missing or invalid, Spring Security will return 401 Unauthorized automatically.
     * This is NOT a login status checker, but a way to fetch logged-in user info.
     */
    @Description("Get the profile of the currently authenticated user. Requires JWT token.")
    @PreAuthorize("hasAnyAuthority('user', 'admin')")
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        User user = CurrentUserUtil.getUser();
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not logged in"));
        }

        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "nickname", user.getNickname(),
                "email", user.getEmail(),
                "role", user.getRole()
        ));
    }

    /**
     * Update current user's nickname and avatar.
     * Only authenticated users (admin or user) can access this endpoint.
     */
    @Description("Update the authenticated user's nickname and avatar.")
    @PatchMapping("/me")
    @PreAuthorize("hasAnyAuthority('user', 'admin')")
    public ResponseEntity<User> updateProfile(@RequestBody @Valid UserUpdateRequestDTO dto) {
        User updated = userService.updateUserProfile(dto);
        return ResponseEntity.ok(updated);
    }
}