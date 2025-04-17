package com.munichweekly.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity // 表明这是一个 JPA 实体类，映射到数据库表
@Table(name = "users") // 映射到 PostgreSQL 数据库中的 users 表
public class User {

    @Id // 主键标识
    @GeneratedValue(strategy = GenerationType.IDENTITY) // 自动生成主键ID
    private Long id;

    @Column(unique = true) // 邮箱唯一，避免重复注册
    private String email;

    private String nickname;

    private String avatarUrl;

    @Column()
    private String role = "user"; // 默认角色为普通用户

    private LocalDateTime registeredAt = LocalDateTime.now();

    private Boolean isBanned = false;

    // 无参构造函数（JPA 规范要求）
    public User() {}

    // 全参数构造函数（便于后续创建用户实例）
    public User(String email, String nickname, String avatarUrl, String role) {
        this.email = email;
        this.nickname = nickname;
        this.avatarUrl = avatarUrl;
        this.role = role;
        this.registeredAt = LocalDateTime.now();
        this.isBanned = false;
    }

    // getter 和 setter 方法（IDE自动生成）
    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public LocalDateTime getRegisteredAt() {
        return registeredAt;
    }

    public void setRegisteredAt(LocalDateTime registeredAt) {
        this.registeredAt = registeredAt;
    }

    public Boolean getIsBanned() {
        return isBanned;
    }

    public void setIsBanned(Boolean banned) {
        isBanned = banned;
    }
}