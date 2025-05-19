package com.munichweekly.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Implementation of StorageService that stores files in the local file system.
 * Used for development and testing purposes.
 */
@Service
public class LocalStorageService implements StorageService {
    
    private static final Logger logger = Logger.getLogger(LocalStorageService.class.getName());
    
    @Value("${uploads.directory:./uploads}")
    private String uploadsDirectory;
    
    private final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png");
    private final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList("image/jpeg", "image/png");
    private final long MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
    
    private Path rootLocation;
    
    /**
     * Initialize the upload directory when the service is created
     */
    @PostConstruct
    public void init() {
        try {
            rootLocation = Paths.get(uploadsDirectory).toAbsolutePath().normalize();
            logger.info("Storage location set to: " + rootLocation);
            
            if (!Files.exists(rootLocation)) {
                logger.info("Creating directory: " + rootLocation);
                Files.createDirectories(rootLocation);
                logger.info("Created upload directory successfully");
            } else {
                logger.info("Upload directory already exists");
            }
            
            // Verify write permissions
            if (!Files.isWritable(rootLocation)) {
                throw new RuntimeException("Upload directory is not writable: " + rootLocation);
            }
            
        } catch (IOException e) {
            logger.log(Level.SEVERE, "Failed to create upload directory: " + e.getMessage(), e);
            throw new RuntimeException("Could not initialize storage location: " + e.getMessage(), e);
        }
    }
    
    /**
     * Store a file in the local file system (新签名)
     * 
     * @param file The MultipartFile to store
     * @param issueId The ID of the issue
     * @param userId The ID of the user
     * @param submissionId The ID of the submission
     * @return URL path where the file can be accessed
     */
    @Override
    public String storeFile(MultipartFile file, String issueId, String userId, String submissionId) throws IOException {
        // Check if file is empty
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file");
        }

        // Check file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds the limit of 20MB");
        }

        // Check file type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("File type not supported. Only JPEG and PNG are allowed");
        }

        // Get file extension
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
            if (!ALLOWED_EXTENSIONS.contains(extension)) {
                throw new IllegalArgumentException("File extension not allowed. Only jpg, jpeg, and png are allowed");
            }
        } else {
            throw new IllegalArgumentException("Invalid file name");
        }

        // Validate mandatory path parameters
        if (issueId == null || issueId.trim().isEmpty()) {
            throw new IllegalArgumentException("issueId cannot be null or empty");
        }
        if (userId == null || userId.trim().isEmpty()) {
            throw new IllegalArgumentException("userId cannot be null or empty");
        }
        if (submissionId == null || submissionId.trim().isEmpty()) {
            throw new IllegalArgumentException("submissionId cannot be null or empty");
        }

        // Generate unique file path with timestamp and provided IDs
        String timestamp = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
        String fileName = String.format("%s_%s_%s.%s", userId, submissionId, timestamp, extension);
        Path issueDir = rootLocation.resolve("issues").resolve(issueId).resolve("submissions");
        java.nio.file.Files.createDirectories(issueDir);
        Path destinationFile = issueDir.resolve(fileName);
        logger.info("Saving file to: " + destinationFile);
        java.nio.file.Files.copy(file.getInputStream(), destinationFile);
        logger.info("Stored file: " + fileName + " (" + file.getSize() + " bytes)");
        // 返回统一风格的URL路径
        return "/uploads/issues/" + issueId + "/submissions/" + fileName;
    }
    
    /**
     * Delete a file from the local file system
     * 
     * @param fileUrl The URL path of the file to delete
     * @return true if deletion was successful
     */
    @Override
    public boolean deleteFile(String fileUrl) {
        try {
            // Extract file name from URL
            String fileName = fileUrl;
            if (fileUrl.startsWith("/uploads/")) {
                fileName = fileUrl.substring("/uploads/".length());
            }
            
            Path filePath = rootLocation.resolve(fileName);
            logger.info("Attempting to delete file: " + filePath);
            
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                logger.info("Deleted file: " + fileName);
                return true;
            }
            logger.warning("File not found for deletion: " + filePath);
            return false;
        } catch (IOException e) {
            logger.log(Level.WARNING, "Failed to delete file: " + fileUrl + " - " + e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Check if a file exists in the local file system
     * 
     * @param fileUrl The URL path of the file to check
     * @return true if the file exists
     */
    @Override
    public boolean fileExists(String fileUrl) {
        // Extract file name from URL
        String fileName = fileUrl;
        if (fileUrl.startsWith("/uploads/")) {
            fileName = fileUrl.substring("/uploads/".length());
        }
        
        Path filePath = rootLocation.resolve(fileName);
        boolean exists = Files.exists(filePath);
        logger.info("Checking if file exists: " + filePath + " - " + exists);
        return exists;
    }
} 