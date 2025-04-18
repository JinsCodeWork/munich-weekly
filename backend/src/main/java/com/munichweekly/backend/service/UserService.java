package com.munichweekly.backend.service;

import com.munichweekly.backend.dto.LoginRequestDTO;
import com.munichweekly.backend.dto.LoginResponseDTO;
import com.munichweekly.backend.dto.UserRegisterRequestDTO;
import com.munichweekly.backend.model.User;
import com.munichweekly.backend.model.UserAuthProvider;
import com.munichweekly.backend.repository.UserRepository;
import com.munichweekly.backend.repository.UserAuthProviderRepository;
import com.munichweekly.backend.security.JwtUtil;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

/**
 * Service for handling user login and identity linking.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserAuthProviderRepository authProviderRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       UserAuthProviderRepository authProviderRepository, JwtUtil jwtUtil, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.authProviderRepository = authProviderRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Unified login method for both email/password and third-party login.
     * Returns a logged-in user or throws if authentication fails.
     */
    public LoginResponseDTO login(LoginRequestDTO dto) {
        User user;

        if (dto.getEmail() != null && dto.getPassword() != null) {
            // Email login
            user = userRepository.findByEmail(dto.getEmail())
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            // TODO: Use real password hashing (e.g. BCrypt)
            if (!user.getPassword().equals(dto.getPassword())) {
                throw new IllegalArgumentException("Invalid password");
            }

        } else if (dto.getProvider() != null && dto.getProviderUserId() != null) {
            // Third-party login
            Optional<UserAuthProvider> auth = authProviderRepository
                    .findByProviderAndProviderUserId(dto.getProvider(), dto.getProviderUserId());

            if (auth.isPresent()) {
                user = auth.get().getUser();
            } else {
                // Auto-create new user for new third-party login
                User newUser = new User();
                newUser.setEmail(null);
                newUser.setNickname("用户" + System.currentTimeMillis());
                newUser.setAvatarUrl(null);
                newUser.setRole("user");

                user = userRepository.save(newUser);

                UserAuthProvider newAuth = new UserAuthProvider(user, dto.getProvider(), dto.getProviderUserId());
                authProviderRepository.save(newAuth);
            }

        } else {
            throw new IllegalArgumentException("Invalid login request");
        }

        // Generate JWT token
        String token = jwtUtil.generateToken(user.getId());

        // Return token and basic user info
        return new LoginResponseDTO(token, user.getNickname(), user.getAvatarUrl(), user.getRole());
    }

    /**
     * Registers a new user.
     * Validates email uniqueness, encrypts password, and returns JWT token.
     */
    public String register(UserRegisterRequestDTO dto) {
        // Check for duplicate email
        if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }

        // Encrypt the password
        String hashedPassword = passwordEncoder.encode(dto.getPassword());

        // Create and save new user
        User user = new User();
        user.setEmail(dto.getEmail());
        user.setPassword(hashedPassword);
        user.setNickname(dto.getNickname());
        user.setAvatarUrl(dto.getAvatarUrl());
        user.setRole("user"); // Default role

        userRepository.save(user);

        // Generate JWT token
        return jwtUtil.generateToken(user.getId());
    }
}