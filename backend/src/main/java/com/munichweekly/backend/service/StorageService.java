package com.munichweekly.backend.service;

import com.munichweekly.backend.model.ImageDimensions;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

/**
 * Enhanced interface for file storage operations with image dimension optimization.
 * This abstraction allows for different storage implementations
 * (local file system, cloud storage, etc.) with built-in dimension extraction
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
     * Enhanced file storage with dimension extraction during upload.
     * This method provides optimal performance by capturing image dimensions
     * during the upload process, avoiding the need for subsequent downloads.
     * 
     * @param file The MultipartFile to store
     * @param issueId The ID of the issue
     * @param userId The ID of the user
     * @param submissionId The ID of the submission
     * @return StorageResult containing both URL and dimensions
     * @throws IOException If an I/O error occurs during storage
     * @throws IllegalArgumentException If the file is invalid (empty, wrong format, etc.)
     */
    StorageResult storeFileWithDimensions(MultipartFile file, String issueId, String userId, String submissionId) throws IOException, IllegalArgumentException;
    
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
    
    /**
     * Result container for enhanced file storage operations
     * Contains both the file URL and extracted image dimensions
     */
    class StorageResult {
        private final String url;
        private final ImageDimensions dimensions;
        
        public StorageResult(String url, ImageDimensions dimensions) {
            this.url = url;
            this.dimensions = dimensions;
        }
        
        public String getUrl() {
            return url;
        }
        
        public ImageDimensions getDimensions() {
            return dimensions;
        }
        
        public boolean hasDimensions() {
            return dimensions != null;
        }
        
        @Override
        public String toString() {
            return String.format("StorageResult{url='%s', dimensions=%s}", url, dimensions);
        }
    }
} 