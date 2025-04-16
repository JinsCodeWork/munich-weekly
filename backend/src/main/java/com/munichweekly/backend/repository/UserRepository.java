package com.munichweekly.backend.repository;

import com.munichweekly.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
}