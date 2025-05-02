package com.munichweekly.backend.devtools;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("dev") // Only run in development profile
public class ApiDocGeneratorRunner implements CommandLineRunner {

    private final ApiScanner apiScanner;

    public ApiDocGeneratorRunner(ApiScanner apiScanner) {
        this.apiScanner = apiScanner;
    }

    @Override
    public void run(String... args) {
        System.out.println("🛠 Starting API Scanner...");
        apiScanner.run();
    }
}