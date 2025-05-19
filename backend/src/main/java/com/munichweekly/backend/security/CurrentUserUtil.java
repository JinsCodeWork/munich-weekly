package com.munichweekly.backend.security;

import com.munichweekly.backend.model.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.Optional;

/**
 * Utility class to retrieve the current authenticated user from the security context.
 */
public class CurrentUserUtil {

    /**
     * Get the currently authenticated user.
     *
     * @return the authenticated User object, or null if not authenticated
     */
    public static User getUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getPrincipal() instanceof User user) {
            return user;
        }

        return null;
    }

    /**
     * Get the ID of the current user, or throw exception if not authenticated.
     *
     * @return current user ID
     * @throws IllegalStateException if not logged in
     */
    public static Long getUserIdOrThrow() {
        User user = getUser();
        if (user == null) {
            throw new IllegalStateException("You must be logged in to perform this action.");
        }
        return user.getId();
    }

    /**
     * Get the ID of the current user as an Optional.
     *
     * @return Optional containing the user ID, or empty if not authenticated
     */
    public static Optional<Long> getCurrentUserId() {
        User user = getUser();
        return user != null ? Optional.of(user.getId()) : Optional.empty();
    }
}