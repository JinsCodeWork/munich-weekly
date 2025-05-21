package com.munichweekly.backend.repository;

import com.munichweekly.backend.model.PasswordResetToken;
import com.munichweekly.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

/**
 * 密码重置令牌仓库接口
 */
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    
    // 根据令牌查找
    Optional<PasswordResetToken> findByToken(String token);
    
    // 查找用户未使用的令牌
    Optional<PasswordResetToken> findByUserAndUsedAtIsNull(User user);
    
    // 删除用户未使用的令牌
    void deleteByUserAndUsedAtIsNull(User user);
} 