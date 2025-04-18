package com.munichweekly.backend.service;

import com.munichweekly.backend.dto.LoginRequestDTO;
import com.munichweekly.backend.dto.LoginResponseDTO;
import com.munichweekly.backend.model.User;
import com.munichweekly.backend.model.UserAuthProvider;
import com.munichweekly.backend.repository.UserRepository;
import com.munichweekly.backend.repository.UserAuthProviderRepository;
import com.munichweekly.backend.security.JwtUtil;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Service for handling user login and identity linking.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserAuthProviderRepository authProviderRepository;
    private final JwtUtil jwtUtil;

    public UserService(UserRepository userRepository,
                       UserAuthProviderRepository authProviderRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.authProviderRepository = authProviderRepository;
        this.jwtUtil = jwtUtil;
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
}