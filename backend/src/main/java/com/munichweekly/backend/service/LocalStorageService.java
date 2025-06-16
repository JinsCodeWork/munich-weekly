package com.munichweekly.backend.service;

import com.munichweekly.backend.model.ImageDimensions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Enhanced implementation of StorageService that stores files in the local file system
 * with optimized image dimension extraction during upload.
 * Used for development and testing purposes.
 */
@Service
public class LocalStorageService implements StorageService {
    
    private static final Logger logger = Logger.getLogger(LocalStorageService.class.getName());
    
    @Value("${uploads.directory:./uploads}")
    private String uploadsDirectory;
    
    private final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png");
    private final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList("image/jpeg", "image/png");
    private final long MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB
    
    private Path rootLocation;
    
    /**
     * Initialize the upload directory when the service is created
     */
    @PostConstruct
    public void init() {
        try {
            rootLocation = Paths.get(uploadsDirectory);
            Files.createDirectories(rootLocation);
            logger.info("Local storage initialized at: " + rootLocation.toAbsolutePath());
        } catch (IOException e) {
            logger.log(Level.SEVERE, "Could not initialize local storage", e);
            throw new RuntimeException("Could not initialize storage", e);
        }
    }
    
    @Override
    public String storeFile(MultipartFile file, String issueId, String userId, String submissionId) throws IOException, IllegalArgumentException {
        // Check if file is null first
        if (file == null) {
            logger.severe("File parameter is null. Cannot upload file.");
            throw new IllegalArgumentException("File cannot be null");
        }
        
        // Use the enhanced method but only return the URL for backward compatibility
        StorageResult result = storeFileWithDimensions(file, issueId, userId, submissionId);
        return result.getUrl();
    }
    
    @Override
    public StorageResult storeFileWithDimensions(MultipartFile file, String issueId, String userId, String submissionId) throws IOException, IllegalArgumentException {
        logger.info("Starting enhanced local file storage with dimension extraction");
        
        // Check if file is null first
        if (file == null) {
            logger.severe("File parameter is null. Cannot upload file.");
            throw new IllegalArgumentException("File cannot be null");
        }
        
        validateFile(file);
        
        // Create directory structure: uploads/issues/{issueId}/submissions/
        Path issueDir = rootLocation.resolve("issues").resolve(issueId).resolve("submissions");
        Files.createDirectories(issueDir);
        
        // Get file extension
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        
        // Create filename: {submissionId}.{extension}
        String filename = submissionId + "." + extension;
        Path destinationFile = issueDir.resolve(filename);
        
        // **OPTIMIZATION: Extract dimensions from stream before storing**
        ImageDimensions dimensions = null;
        byte[] fileBytes = file.getBytes(); // Read file content once
        
        try {
            dimensions = extractDimensionsFromBytes(fileBytes, file.getContentType());
            if (dimensions != null) {
                logger.info("Successfully extracted dimensions during upload: " + dimensions);
            } else {
                logger.warning("Could not extract dimensions during upload for file: " + originalFilename);
            }
        } catch (Exception e) {
            logger.warning("Failed to extract dimensions during upload: " + e.getMessage());
            // Continue with file storage even if dimension extraction fails
        }
        
        // Store the file
        try {
            Files.write(destinationFile, fileBytes);
            logger.info("File stored successfully at: " + destinationFile);
        } catch (IOException e) {
            logger.log(Level.SEVERE, "Failed to store file", e);
            throw new IOException("Failed to store file: " + filename, e);
        }
        
        // Return relative URL for frontend access
        String relativePath = "/uploads/issues/" + issueId + "/submissions/" + filename;
        return new StorageResult(relativePath, dimensions);
    }
    
    /**
     * Extract image dimensions from byte array without additional I/O
     */
    private ImageDimensions extractDimensionsFromBytes(byte[] imageBytes, String contentType) {
        if (imageBytes == null || imageBytes.length == 0) {
            return null;
        }
        
        ImageInputStream imageInputStream = null;
        try {
            imageInputStream = ImageIO.createImageInputStream(new ByteArrayInputStream(imageBytes));
            if (imageInputStream == null) {
                logger.fine("Could not create ImageInputStream from byte array");
                return null;
            }
            
            Iterator<ImageReader> readers = ImageIO.getImageReaders(imageInputStream);
            if (!readers.hasNext()) {
                logger.fine("No ImageReader found for content type: " + contentType);
                return null;
            }
            
            ImageReader reader = readers.next();
            try {
                reader.setInput(imageInputStream);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                
                return new ImageDimensions(width, height);
                
            } finally {
                reader.dispose();
            }
            
        } catch (IOException e) {
            logger.log(Level.FINE, "Error reading image dimensions from bytes: " + e.getMessage(), e);
            return null;
        } finally {
            if (imageInputStream != null) {
                try {
                    imageInputStream.close();
                } catch (IOException e) {
                    logger.log(Level.FINE, "Error closing ImageInputStream", e);
                }
            }
        }
    }
    
    /**
     * Validate uploaded file
     */
    private void validateFile(MultipartFile file) throws IllegalArgumentException {
        // Note: file null check is performed in calling method
        
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file");
        }
        
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                "File size exceeds maximum allowed size of " + (MAX_FILE_SIZE / (1024 * 1024)) + "MB"
            );
        }
        
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("File type not allowed. Only JPEG and PNG images are supported.");
        }
        
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            throw new IllegalArgumentException("Filename cannot be empty");
        }
        
        String extension = getFileExtension(originalFilename);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("File extension not allowed: " + extension);
        }
    }
    
    /**
     * Extract file extension from filename
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            throw new IllegalArgumentException("File must have a valid extension");
        }
        
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
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