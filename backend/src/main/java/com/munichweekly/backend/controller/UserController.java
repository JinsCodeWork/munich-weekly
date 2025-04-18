package com.munichweekly.backend.controller;

import com.munichweekly.backend.model.User;
import com.munichweekly.backend.repository.UserRepository;
import com.munichweekly.backend.security.CurrentUserUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users") // 所有路径都以 /api/users 开头
public class UserController {

    private final UserRepository userRepository;

    // 构造函数注入 repository
    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // GET /api/users

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
}