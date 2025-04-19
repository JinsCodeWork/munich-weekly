package com.munichweekly.backend.service;

import com.munichweekly.backend.dto.*;
import com.munichweekly.backend.model.User;
import com.munichweekly.backend.model.UserAuthProvider;
import com.munichweekly.backend.repository.UserRepository;
import com.munichweekly.backend.repository.UserAuthProviderRepository;
import com.munichweekly.backend.security.CurrentUserUtil;
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
     * Logs in a user using email and password.
     * Throws if authentication fails.
     */
    public LoginResponseDTO loginWithEmail(EmailLoginRequestDTO dto) {
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid password");
        }

        String token = jwtUtil.generateToken(user.getId());

        return new LoginResponseDTO(token, user.getNickname(), user.getAvatarUrl(), user.getRole());
    }

    /**
     * Logs in a user using third-party provider (e.g. Google/WeChat).
     * Creates a new user account if first-time login.
     */
    public LoginResponseDTO loginWithThirdParty(UserAuthProviderLoginRequestDTO dto) {
        Optional<UserAuthProvider> auth = authProviderRepository
                .findByProviderAndProviderUserId(dto.getProvider(), dto.getProviderUserId());

        User user;

        if (auth.isPresent()) {
            user = auth.get().getUser();
        } else {
            // Create new user using info from third-party
            User newUser = new User();
            newUser.setEmail(null);
            newUser.setNickname(dto.getDisplayName() != null ? dto.getDisplayName() : "用户" + System.currentTimeMillis());
            newUser.setAvatarUrl(dto.getAvatarUrl());
            newUser.setRole("user");

            user = userRepository.save(newUser);

            UserAuthProvider newAuth = new UserAuthProvider(
                    user,
                    dto.getProvider(),
                    dto.getProviderUserId(),
                    dto.getDisplayName(),
                    dto.getAvatarUrl()
            );

            authProviderRepository.save(newAuth);
        }

        String token = jwtUtil.generateToken(user.getId());

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

    /**
     * Update nickname and avatar for the current user.
     */
    public User updateUserProfile(UserUpdateRequestDTO dto) {
        Long userId = CurrentUserUtil.getUserIdOrThrow();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setNickname(dto.getNickname());
        user.setAvatarUrl(dto.getAvatarUrl());

        return userRepository.save(user);
    }

    /**
     * Binds a third-party account (e.g., Google, WeChat) to the current user.
     * Throws an exception if the third-party account is already bound to another user.
     */
    public void bindThirdPartyAccount(Long userId, BindRequestDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Check if the third-party account is already linked to someone else
        Optional<UserAuthProvider> existing = authProviderRepository
                .findByProviderAndProviderUserId(dto.getProvider(), dto.getProviderUserId());

        if (existing.isPresent()) {
            throw new IllegalArgumentException("This third-party account is already bound to another user.");
        }

        // Save new binding with displayName and avatarUrl (if any)
        UserAuthProvider newAuth = new UserAuthProvider(
                user,
                dto.getProvider(),
                dto.getProviderUserId(),
                dto.getDisplayName(),
                dto.getAvatarUrl()
        );

        authProviderRepository.save(newAuth);
    }
}