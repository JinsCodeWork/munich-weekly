package com.munichweekly.backend.repository;

import com.munichweekly.backend.model.PasswordResetToken;
import com.munichweekly.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

/**
 * Password reset token repository interface
 */
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    
    // Find by token
    Optional<PasswordResetToken> findByToken(String token);
    
    // Find unused tokens for a user
    Optional<PasswordResetToken> findByUserAndUsedAtIsNull(User user);
    
    // Delete unused tokens for a user
    void deleteByUserAndUsedAtIsNull(User user);
} 