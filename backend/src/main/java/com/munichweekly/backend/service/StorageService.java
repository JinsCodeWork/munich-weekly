package com.munichweekly.backend.service;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

/**
 * Interface for file storage operations.
 * This abstraction allows for different storage implementations
 * (local file system, cloud storage, etc.)
 */
public interface StorageService {
    
    /**
     * Store a file and return its accessible URL
     * 
     * @param file The MultipartFile to store
     * @param issueId The ID of the issue
     * @param userId The ID of the user
     * @param submissionId The ID of the submission
     * @return URL string where the file can be accessed
     * @throws IOException If an I/O error occurs during storage
     * @throws IllegalArgumentException If the file is invalid (empty, wrong format, etc.)
     */
    String storeFile(MultipartFile file, String issueId, String userId, String submissionId) throws IOException, IllegalArgumentException;
    
    /**
     * Delete a file by its URL
     * 
     * @param fileUrl The URL of the file to delete
     * @return true if deletion was successful, false otherwise
     */
    boolean deleteFile(String fileUrl);
    
    /**
     * Check if a file exists
     * 
     * @param fileUrl The URL of the file to check
     * @return true if the file exists, false otherwise
     */
    boolean fileExists(String fileUrl);
} 