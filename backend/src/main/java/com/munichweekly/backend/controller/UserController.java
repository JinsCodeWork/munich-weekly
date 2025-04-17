package com.munichweekly.backend.controller;

import com.munichweekly.backend.model.User;
import com.munichweekly.backend.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users") // 所有路径都以 /api/users 开头
public class UserController {

    private final UserRepository userRepository;

    // 构造函数注入 repository
    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // GET /api/users
    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}