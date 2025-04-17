package com.munichweekly.backend.repository;

import com.munichweekly.backend.model.User;
import com.munichweekly.backend.model.UserAuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserAuthProviderRepository extends JpaRepository<UserAuthProvider, Long> {

    // 查找某个 provider 中的某个用户（用于登录）
    Optional<UserAuthProvider> findByProviderAndProviderUserId(String provider, String providerUserId);

    // 查找某用户已绑定的所有登录方式（用于个人账号页展示）
    List<UserAuthProvider> findByUser(User user);
}