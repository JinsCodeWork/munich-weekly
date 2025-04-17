package com.munichweekly.backend.repository;

import com.munichweekly.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {

    // 通过邮箱查找用户（用于邮箱登录）
    Optional<User> findByEmail(String email);

    // 查找是否存在管理员账号
    List<User> findByRole(String role);

    // 查找被封禁用户
    List<User> findByIsBannedTrue();
}