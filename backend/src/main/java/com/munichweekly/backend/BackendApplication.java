package com.munichweekly.backend;

import com.munichweekly.backend.devtools.DataResetService;
import com.munichweekly.backend.model.User;
import com.munichweekly.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

//    @Bean //测试阶段用于清空数据
//    @Order(1)
//    @Profile("dev")
//    public CommandLineRunner resetDatabase(DataResetService resetService) {
//        return args -> {
//                resetService.resetAllData();
//        };
//    }


}