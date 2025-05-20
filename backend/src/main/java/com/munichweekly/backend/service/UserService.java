package com.munichweekly.backend.service;

import com.munichweekly.backend.dto.*;
import com.munichweekly.backend.model.User;
import com.munichweekly.backend.model.UserAuthProvider;
import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.model.Vote;
import com.munichweekly.backend.repository.UserRepository;
import com.munichweekly.backend.repository.UserAuthProviderRepository;
import com.munichweekly.backend.repository.SubmissionRepository;
import com.munichweekly.backend.repository.VoteRepository;
import com.munichweekly.backend.security.CurrentUserUtil;
import com.munichweekly.backend.security.JwtUtil;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.logging.Logger;

/**
 * Service for handling user login and identity linking.
 */
@Service
public class UserService {

    private static final Logger logger = Logger.getLogger(UserService.class.getName());

    private final UserRepository userRepository;
    private final UserAuthProviderRepository authProviderRepository;
    private final SubmissionRepository submissionRepository;
    private final VoteRepository voteRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final StorageService storageService;

    public UserService(UserRepository userRepository,
                       UserAuthProviderRepository authProviderRepository, SubmissionRepository submissionRepository, VoteRepository voteRepository, JwtUtil jwtUtil, PasswordEncoder passwordEncoder, StorageService storageService) {
        this.userRepository = userRepository;
        this.authProviderRepository = authProviderRepository;
        this.submissionRepository = submissionRepository;
        this.voteRepository = voteRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
        this.storageService = storageService;
    }

    /**
     * Logs in a user using email and password.
     * Throws if authentication fails.
     */
    public LoginResponseDTO loginWithEmail(EmailLoginRequestDTO dto) {
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
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
            newUser.setNickname(dto.getDisplayName() != null ? dto.getDisplayName() : "User" + System.currentTimeMillis());
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
     * Changes the user's password after validating the old password.
     * 
     * @param userId The ID of the user changing their password
     * @param dto Contains the old password and new password
     * @return The updated user entity
     * @throws IllegalArgumentException if the old password is incorrect
     */
    public User changePassword(Long userId, ChangePasswordRequestDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // If user is using third-party auth and has no password set
        if (user.getPassword() == null) {
            throw new IllegalArgumentException("Cannot change password for accounts without password");
        }
        
        // Verify old password
        if (!passwordEncoder.matches(dto.getOldPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        
        // Encrypt and set the new password
        String hashedNewPassword = passwordEncoder.encode(dto.getNewPassword());
        user.setPassword(hashedNewPassword);
        
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

    /**
     * Retrieves all third-party providers linked to a user account.
     *
     * @param userId ID of the user
     * @return List of linked provider information (e.g. WeChat, google)
     */
    public List<UserAuthProviderResponseDTO> getLinkedAuthProviders(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return authProviderRepository.findByUser(user)
                .stream()
                .map(auth -> new UserAuthProviderResponseDTO(
                        auth.getProvider(),
                        auth.getDisplayName(),
                        auth.getAvatarUrl()
                ))
                .collect(Collectors.toList());
    }


    /**
     * Unbinds a third-party provider account from the current user.
     *
     * @param userId   ID of the user requesting to unbind
     * @param provider The provider name (e.g. google, WeChat)
     */
    public void unbindThirdPartyAccount(Long userId, String provider) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // 查询是否存在该绑定
        Optional<UserAuthProvider> existing = authProviderRepository.findByUserAndProvider(user, provider);

        if (existing.isEmpty()) {
            throw new IllegalArgumentException("No binding found for provider: " + provider);
        }

        authProviderRepository.delete(existing.get());
    }

    /**
     * Delete the currently authenticated user and all their data.
     * Uses transaction to ensure atomic operation.
     */
    @Transactional
    public void deleteCurrentUser() {
        Long userId = CurrentUserUtil.getUserIdOrThrow();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
                
        logger.info("Deleting user with ID: " + userId);
        
        // Find user's submissions using repository
        List<Submission> userSubmissions = submissionRepository.findByUserId(userId);
        if (!userSubmissions.isEmpty()) {
            logger.info("Deleting " + userSubmissions.size() + " submissions for user: " + userId);
            
            // Delete votes associated with user's submissions first
            for (Submission submission : userSubmissions) {
                List<Vote> submissionVotes = voteRepository.findBySubmission(submission);
                if (!submissionVotes.isEmpty()) {
                    logger.info("Deleting " + submissionVotes.size() + " votes for submission: " + submission.getId());
                    voteRepository.deleteAll(submissionVotes);
                }
                
                // Delete the image file from cloud storage
                String imageUrl = submission.getImageUrl();
                if (imageUrl != null && !imageUrl.isEmpty()) {
                    logger.info("Deleting image file: " + imageUrl + " for submission: " + submission.getId());
                    boolean deleteSuccessful = storageService.deleteFile(imageUrl);
                    if (deleteSuccessful) {
                        logger.info("Successfully deleted image file: " + imageUrl);
                    } else {
                        logger.warning("Failed to delete image file: " + imageUrl);
                    }
                }
            }
            
            // Now delete the submissions
            submissionRepository.deleteAll(userSubmissions);
        }
        
        // Delete votes cast by the user
        voteRepository.deleteByUserId(userId);
                
        // Delete third-party bindings
        List<UserAuthProvider> providers = authProviderRepository.findByUser(user);
        if (!providers.isEmpty()) {
            logger.info("Deleting " + providers.size() + " auth providers for user: " + userId);
            authProviderRepository.deleteAll(providers);
        }
        
        // Finally delete the user
        userRepository.delete(user);
        logger.info("User with ID: " + userId + " has been deleted");
    }
}