package com.munichweekly.backend.dto;

/**
 * Data Transfer Object for file upload response
 */
public class FileUploadResponseDTO {
    private boolean success;
    private String imageUrl;
    private String error;

    // Default constructor
    public FileUploadResponseDTO() {
    }

    // Success response constructor
    public FileUploadResponseDTO(String imageUrl) {
        this.success = true;
        this.imageUrl = imageUrl;
        this.error = null;
    }

    // Error response constructor
    public FileUploadResponseDTO(boolean success, String error) {
        this.success = success;
        this.error = error;
        this.imageUrl = null;
    }

    // Getters and setters
    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
} 