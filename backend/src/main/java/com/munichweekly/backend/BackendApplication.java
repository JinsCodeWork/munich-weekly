package com.munichweekly.backend;

import com.munichweekly.backend.model.User;
import com.munichweekly.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Bean
    public CommandLineRunner demo(UserRepository userRepository) {
        return (args) -> {
            // 插入一条测试记录
            User user = new User("test@example.com", "测试用户");
            userRepository.save(user);
            System.out.println("用户保存成功！");
        };
    }
}