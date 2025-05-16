package com.munichweekly.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.logging.Logger;

/**
 * Configuration for file uploads and static resource handling
 */
@Configuration
public class FileUploadConfig implements WebMvcConfigurer {

    private static final Logger logger = Logger.getLogger(FileUploadConfig.class.getName());

    @Value("${uploads.directory:./uploads}")
    private String uploadsDirectory;

    /**
     * Configure resource handlers to serve uploaded files
     * This allows files in the uploads directory to be accessed via /uploads/** URLs
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Convert to absolute path to ensure proper resource resolution
        Path uploadPath = Paths.get(uploadsDirectory).toAbsolutePath().normalize();
        String resourceLocation = "file:" + uploadPath.toString() + "/";
        
        logger.info("Configuring resource handler for uploads: " + resourceLocation);
            
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(resourceLocation);
    }
} 