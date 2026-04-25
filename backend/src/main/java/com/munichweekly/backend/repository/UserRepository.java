package com.munichweekly.backend.repository;

import com.munichweekly.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {

    // Find user by email (used for email login)
    Optional<User> findByEmail(String email);

    // Find if admin accounts exist
    List<User> findByRole(String role);

    // Find banned users
    List<User> findByIsBannedTrue();

    // Visible admin users include legacy rows with null accountType and exclude synthetic anonymous submission users.
    @Query("SELECT u FROM User u WHERE u.accountType IS NULL OR u.accountType <> 'ANONYMOUS_SUBMISSION'")
    List<User> findVisibleAdminUsers();
}