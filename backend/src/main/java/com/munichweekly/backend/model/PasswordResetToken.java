package com.munichweekly.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Password reset token entity class for storing password reset requests
 */
@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime expiryDate;

    private LocalDateTime usedAt;

    // Default constructor
    public PasswordResetToken() {}

    // Create a new reset token
    public PasswordResetToken(User user) {
        this.user = user;
        this.token = UUID.randomUUID().toString();
        this.expiryDate = LocalDateTime.now().plusMinutes(30); // 30-minute validity period
    }

    // Check if token is expired
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.expiryDate);
    }

    // Check if token has been used
    public boolean isUsed() {
        return this.usedAt != null;
    }

    // Mark token as used
    public void markAsUsed() {
        this.usedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public String getToken() {
        return token;
    }

    public User getUser() {
        return user;
    }

    public LocalDateTime getExpiryDate() {
        return expiryDate;
    }

    public LocalDateTime getUsedAt() {
        return usedAt;
    }

    public void setUsedAt(LocalDateTime usedAt) {
        this.usedAt = usedAt;
    }
}