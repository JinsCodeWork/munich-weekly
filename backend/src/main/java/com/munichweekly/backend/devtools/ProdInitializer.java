package com.munichweekly.backend.devtools;

import com.munichweekly.backend.model.User;
import com.munichweekly.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("prod-init")  // 只在指定 profile 生效
@Order(1)
public class ProdInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ProdInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            System.out.println("🔁 Database already initialized. Skipping.");
            return;
        }

        User admin1 = new User("dongkai.jin@tum.de", passwordEncoder.encode("123456"), "Marc", null, "admin");
        User admin2 = new User("hzan66@gmail.com", passwordEncoder.encode("123456"), "Annan", null, "admin");
        User user    = new User("marcjingames@gmail.com", passwordEncoder.encode("123456"), "UserJin", null, "user");

        userRepository.save(admin1);
        userRepository.save(admin2);
        userRepository.save(user);

        System.out.println("✅ Production admin/user accounts initialized.");
    }
}