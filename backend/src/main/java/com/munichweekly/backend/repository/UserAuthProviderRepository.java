package com.munichweekly.backend.repository;

import com.munichweekly.backend.model.User;
import com.munichweekly.backend.model.UserAuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserAuthProviderRepository extends JpaRepository<UserAuthProvider, Long> {

    // Find a specific user in a specific provider (for login)
    Optional<UserAuthProvider> findByProviderAndProviderUserId(String provider, String providerUserId);

    // Find all login methods bound to a specific user (for personal account page display)
    List<UserAuthProvider> findByUser(User user);

    // Find a specific provider bound to a specific user (for unbinding)
    Optional<UserAuthProvider> findByUserAndProvider(User user, String provider);
}