package com.munichweekly.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 密码重置令牌实体类，用于存储密码重置请求
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

    // 默认构造函数
    public PasswordResetToken() {}

    // 创建一个新的重置令牌
    public PasswordResetToken(User user) {
        this.user = user;
        this.token = UUID.randomUUID().toString();
        this.expiryDate = LocalDateTime.now().plusMinutes(30); // 30分钟有效期
    }

    // 检查令牌是否过期
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiryDate);
    }

    // 检查令牌是否已被使用
    public boolean isUsed() {
        return usedAt != null;
    }

    // 标记令牌为已使用
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