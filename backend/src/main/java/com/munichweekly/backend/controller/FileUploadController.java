package com.munichweekly.backend.controller;

import com.munichweekly.backend.dto.FileUploadResponseDTO;
import com.munichweekly.backend.service.StorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * REST controller for handling file uploads
 */
@RestController
@RequestMapping("/api/uploads")
public class FileUploadController {

    private static final Logger logger = Logger.getLogger(FileUploadController.class.getName());
    private final StorageService storageService;

    @Autowired
    public FileUploadController(StorageService storageService) {
        this.storageService = storageService;
    }

    /**
     * Handle image upload requests
     * 
     * @param file The image file to upload
     * @return ResponseEntity with the upload result
     */
    @PostMapping("/image")
    @PreAuthorize("hasAnyAuthority('user', 'admin')")
    public ResponseEntity<FileUploadResponseDTO> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unnamed file";
            long fileSize = file.getSize();
            String contentType = file.getContentType();
            
            logger.info("Received file upload request: " + 
                        "name=" + filename + 
                        ", size=" + fileSize + " bytes" + 
                        ", type=" + contentType);
            
            String imageUrl = storageService.storeFile(file);
            
            logger.info("File uploaded successfully: " + imageUrl);
            return ResponseEntity.ok(new FileUploadResponseDTO(imageUrl));
            
        } catch (IllegalArgumentException e) {
            logger.warning("Invalid file upload: " + e.getMessage());
            return ResponseEntity.badRequest().body(new FileUploadResponseDTO(false, e.getMessage()));
            
        } catch (IOException e) {
            logger.log(Level.SEVERE, "File upload error: " + e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(new FileUploadResponseDTO(false, "Failed to store file: " + e.getMessage()));
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Unexpected error during file upload", e);
            return ResponseEntity.internalServerError()
                    .body(new FileUploadResponseDTO(false, "An unexpected error occurred: " + e.getMessage()));
        }
    }
} 