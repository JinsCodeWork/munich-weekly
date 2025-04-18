package com.munichweekly.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Represents a third-party auth provider linked to a user account.
 * Supports OAuth logins (e.g., WeChat, Google, Apple).
 */
@Entity
@Table(name = "user_auth_providers", uniqueConstraints = @UniqueConstraint(columnNames = {"provider", "providerUserId"}))
public class UserAuthProvider {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private User user;

    private String provider; // wechat / google / apple
    private String providerUserId;

    private LocalDateTime linkedAt = LocalDateTime.now();

    public UserAuthProvider() {}

    public UserAuthProvider(User user, String provider, String providerUserId) {
        this.user = user;
        this.provider = provider;
        this.providerUserId = providerUserId;
        this.linkedAt = LocalDateTime.now();
    }

    // Getters & setters ...

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getProviderUserId() {
        return providerUserId;
    }

    public void setProviderUserId(String providerUserId) {
        this.providerUserId = providerUserId;
    }

    public LocalDateTime getLinkedAt() {
        return linkedAt;
    }

    public void setLinkedAt(LocalDateTime linkedAt) {
        this.linkedAt = linkedAt;
    }
}
