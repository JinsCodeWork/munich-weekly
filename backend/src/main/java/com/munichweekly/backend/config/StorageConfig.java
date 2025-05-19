package com.munichweekly.backend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import com.munichweekly.backend.service.LocalStorageService;
import com.munichweekly.backend.service.R2StorageService;
import com.munichweekly.backend.service.StorageService;

/**
 * Configuration class for storage services
 * This class selects which storage service implementation to use based on the storage.mode property
 */
@Configuration
public class StorageConfig {

    @Value("${storage.mode:R2}")
    private String storageMode;
    
    @Autowired(required = false)
    private R2StorageService r2StorageService;
    
    @Autowired(required = false)
    private LocalStorageService localStorageService;
    
    /**
     * Provides the primary storage service implementation based on configuration
     * @return The appropriate StorageService implementation
     */
    @Bean
    @Primary
    public StorageService storageService() {
        // Prefer R2 storage if 'R2' is specified (case-insensitive)
        if ("R2".equalsIgnoreCase(storageMode)) {
            if (r2StorageService != null) {
                System.out.println("Using R2 cloud storage service");
                return r2StorageService;
            } else {
                System.out.println("R2 storage service is not available, falling back to local storage");
                return localStorageService;
            }
        }
        
        // Otherwise use local storage
        System.out.println("Using local storage service");
        return localStorageService;
    }
} 