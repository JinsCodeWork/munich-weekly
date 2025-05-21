package com.munichweekly.backend.devtools;

import com.munichweekly.backend.model.*;
import com.munichweekly.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order(2)
@Profile("dev")
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            System.out.println("➡️ 数据已存在，跳过初始化。");
            return;
        }
        User admin1 = new User("dongkai.jin@tum.de", passwordEncoder.encode("123456"),"Marc", null, "admin");
        User savedAdmin1 = userRepository.saveAndFlush(admin1); // 自动生成 ID

        User admin2 = new User("hzan66@gmail.com", passwordEncoder.encode("123456"),"Annan", null, "admin");
        User savedAdmin2 = userRepository.saveAndFlush(admin2);

        User user = new User("marcjingames@gmail.com", passwordEncoder.encode("123456"),"UserJin", null, "user");
        User savedUser = userRepository.saveAndFlush(user);

        System.out.println("✅ 初始化数据完成！");
        System.out.println("🧪 admin1Id = " + savedAdmin1.getId());
        System.out.println("🧪 admin2Id = " + savedAdmin2.getId());
        System.out.println("🧪 userId = " + savedUser.getId());
    }
}