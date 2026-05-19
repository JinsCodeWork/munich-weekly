package com.munichweekly.backend.controller;

import com.munichweekly.backend.dto.FileUploadResponseDTO;
import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.service.StorageService;
import com.munichweekly.backend.service.R2StorageService;
import com.munichweekly.backend.service.LocalStorageService;
import com.munichweekly.backend.service.SubmissionUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import com.munichweekly.backend.devtools.annotation.Description;
import com.munichweekly.backend.service.AnonymousUploadTokenService;
/**
 * Enhanced REST controller for handling file uploads with image dimension optimization
 */
@RestController
@RequestMapping("/api/submissions")
public class FileUploadController {

    private static final Logger logger = LoggerFactory.getLogger(FileUploadController.class);
    private final StorageService storageService;
    private final SubmissionUploadService submissionUploadService;
    private final R2StorageService r2StorageService;  // Direct R2 service for debugging
    private final LocalStorageService localStorageService;
    private final AnonymousUploadTokenService anonymousUploadTokenService;

    @Autowired
    public FileUploadController(StorageService storageService,
                               SubmissionUploadService submissionUploadService,
                               R2StorageService r2StorageService,
                               LocalStorageService localStorageService,
                               AnonymousUploadTokenService anonymousUploadTokenService) {
        this.storageService = storageService;
        this.submissionUploadService = submissionUploadService;
        this.r2StorageService = r2StorageService;
        this.localStorageService = localStorageService;
        this.anonymousUploadTokenService = anonymousUploadTokenService;
    }

    /**
     * Upload an image file and associate it with a specific submission with dimension optimization.
     * Enhanced version that captures image dimensions during upload for improved masonry layout performance.
     * 
     * The submissionId is used to look up the submission, and the image will be stored in the appropriate path (local or cloud).
     * After successful upload, both the imageUrl and image dimensions are captured and stored for layout optimization.
     */
    @Description("Upload an image file for a specific submission with dimension optimization. The image will be stored and its dimensions captured for improved layout performance.")
    @PostMapping("/{submissionId}/upload")
    @PreAuthorize("hasAnyAuthority('user', 'admin')")
    public ResponseEntity<FileUploadResponseDTO> uploadImageToSubmission(
            @PathVariable("submissionId") String submissionId,
            @RequestParam("file") MultipartFile file) {
        logger.info("Starting enhanced image upload for submission ID: " + submissionId);
        logger.info("File details - Name: " + file.getOriginalFilename() + 
                   ", Size: " + file.getSize() + " bytes, Content Type: " + file.getContentType());
        
        try {
            // Validate the submission ID
            Long subId = Long.valueOf(submissionId);
            logger.info("Looking up submission with ID: " + subId);
            
            // Fetch the submission
            Submission submission = submissionUploadService.requireSubmission(subId);

            if (!submissionUploadService.currentUserMayUpload(submission)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new FileUploadResponseDTO(false, "You do not have permission to upload to this submission"));
            }
            
            logger.info("Submission found. Issue ID: " + submission.getIssue().getId() + 
                       ", User ID: " + submission.getUser().getId());
            
            String issueId = submission.getIssue().getId().toString();
            String userId = submission.getUser().getId().toString();
            
            logger.info("Storing file with issueId: " + issueId + ", userId: " + userId + 
                       ", submissionId: " + submissionId);
            
            // **ENHANCEMENT: Use new storeFileWithDimensions method for optimal performance**
            StorageService.StorageResult storageResult = storageService.storeFileWithDimensions(file, issueId, userId, submissionId);
            String imageUrl = storageResult.getUrl();
            
            logger.info("File successfully stored with dimensions. URL: " + imageUrl);
            
            // Check if the URL is valid and accessible
            if (imageUrl != null && !imageUrl.isEmpty()) {
                boolean fileExists = false;
                try {
                    fileExists = storageService.fileExists(imageUrl);
                    logger.info("File existence check: " + (fileExists ? "File exists" : "File not found"));
                } catch (Exception e) {
                    logger.warn("Unable to verify file existence: " + e.getMessage());
                }
                
                if (!fileExists) {
                    logger.warn("Uploaded file could not be verified at URL: " + imageUrl + 
                                  " but proceeding with database update anyway");
                }
            } else {
                logger.error("Storage service returned empty or null URL");
                return ResponseEntity.internalServerError()
                        .body(new FileUploadResponseDTO(false, "Storage service returned invalid URL"));
            }
            
            submissionUploadService.applyStoredImageAndSave(submission, storageResult);
            if (storageResult.hasDimensions()) {
                logger.info("Stored dimensions from upload: {}", storageResult.getDimensions());
            } else {
                logger.info("No dimensions available from upload, submission will use dynamic fetching when needed");
            }

            logger.info("Enhanced file upload process completed successfully with optimal dimension handling");
            return ResponseEntity.ok(new FileUploadResponseDTO(imageUrl));
            
        } catch (NumberFormatException e) {
            logger.error("Invalid submission ID format: " + submissionId);
            return ResponseEntity.badRequest().body(
                new FileUploadResponseDTO(false, "Invalid submission ID: " + submissionId)
            );
        } catch (IllegalStateException e) {
            logger.warn("Unauthorized file upload: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new FileUploadResponseDTO(false, e.getMessage()));
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid file upload: " + e.getMessage());
            return ResponseEntity.badRequest().body(new FileUploadResponseDTO(false, e.getMessage()));
        } catch (IOException e) {
            logger.error("File upload error: " + e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(new FileUploadResponseDTO(false, "Failed to store file: " + e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error during file upload", e);
            return ResponseEntity.internalServerError()
                    .body(new FileUploadResponseDTO(false, "An unexpected error occurred: " + e.getMessage()));
        }
    }

    @Description("Upload an image for an anonymous submission using a short-lived upload token.")
    @PostMapping("/{submissionId}/anonymous-upload")
    public ResponseEntity<FileUploadResponseDTO> uploadImageToAnonymousSubmission(
            @PathVariable("submissionId") String submissionId,
            @RequestHeader("X-Anonymous-Upload-Token") String uploadToken,
            @RequestParam("file") MultipartFile file) {
        try {
            Long subId = Long.valueOf(submissionId);
            AnonymousUploadTokenService.AnonymousUploadTokenClaims claims =
                    anonymousUploadTokenService.validateToken(uploadToken, subId);

            Submission submission = submissionUploadService.requireSubmission(subId);

            if (!submission.getUser().getId().equals(claims.userId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new FileUploadResponseDTO(false, "Anonymous upload token does not match submission owner"));
            }

            if (submission.getImageUrl() != null && !submission.getImageUrl().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new FileUploadResponseDTO(false, "Anonymous submission already has an uploaded image"));
            }

            StorageService.StorageResult storageResult = storageService.storeFileWithDimensions(
                    file,
                    submission.getIssue().getId().toString(),
                    submission.getUser().getId().toString(),
                    submissionId
            );

            String imageUrl = storageResult.getUrl();
            if (imageUrl == null || imageUrl.isEmpty()) {
                return ResponseEntity.internalServerError()
                        .body(new FileUploadResponseDTO(false, "Storage service returned invalid URL"));
            }

            submissionUploadService.applyStoredImageAndSave(submission, storageResult);

            return ResponseEntity.ok(new FileUploadResponseDTO(imageUrl));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(
                    new FileUploadResponseDTO(false, "Invalid submission ID: " + submissionId)
            );
        } catch (io.jsonwebtoken.JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new FileUploadResponseDTO(false, "Invalid anonymous upload token"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new FileUploadResponseDTO(false, e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(new FileUploadResponseDTO(false, "Failed to store file: " + e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error during anonymous upload", e);
            return ResponseEntity.internalServerError()
                    .body(new FileUploadResponseDTO(false, "An unexpected error occurred during upload"));
        }
    }

    /**
     * Admin upload interface for static resources such as homepage images
     * 
     * @param file The uploaded file
     * @param path Relative path, e.g. "images/home"
     * @param filename Filename, e.g. "hero.jpg"
     * @return Upload result
     */
    @Description("Admin upload interface for static resources such as homepage images")
    @PostMapping("/admin/upload")
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<Map<String, Object>> adminUploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("path") String path,
            @RequestParam(value = "filename", required = false) String filename) {
        
        logger.info("Starting admin static resource upload - Path: " + path + ", Filename: " + (filename != null ? filename : file.getOriginalFilename()));
        logger.info("File details - Name: " + file.getOriginalFilename() + 
                   ", Size: " + file.getSize() + " bytes, Content Type: " + file.getContentType());
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Simple validation for path and filename
            if (path == null || path.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Upload path cannot be empty"
                ));
            }
            
            // Use fixed ID parameters for static resource uploads
            String staticIssueId = "static";
            String adminUserId = "admin";
            String staticSubmissionId = path.replace("/", "_");
            
            // If filename is provided, handle file extension
            String finalFilename = filename;
            if (finalFilename != null && !finalFilename.isEmpty()) {
                // Ensure filename has extension
                if (!finalFilename.contains(".")) {
                    String originalExtension = "";
                    String originalFilename = file.getOriginalFilename();
                    if (originalFilename != null && originalFilename.contains(".")) {
                        originalExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
                        finalFilename += originalExtension;
                    }
                }
                // Set static resource ID
                staticSubmissionId = path.replace("/", "_") + "_" + finalFilename.replace(".", "_");
            }
            
            logger.info("Storing static file - Path: " + path + 
                       ", Static IssueID: " + staticIssueId + 
                       ", Admin UserID: " + adminUserId + 
                       ", Static ResourceID: " + staticSubmissionId);
            
            // Use storage service to save the file
            String fileUrl = storageService.storeFile(file, staticIssueId, adminUserId, staticSubmissionId);
            logger.info("File stored successfully. URL: " + fileUrl);
            
            // Validate URL
            if (fileUrl != null && !fileUrl.isEmpty()) {
                boolean fileExists = false;
                try {
                    fileExists = storageService.fileExists(fileUrl);
                    logger.info("File existence check: " + (fileExists ? "File exists" : "File not found"));
                } catch (Exception e) {
                    logger.warn("Unable to verify file existence: " + e.getMessage());
                }
                
                if (!fileExists) {
                    logger.warn("Unable to verify uploaded file at URL: " + fileUrl + ", but continuing with processing");
                }
                
                // Return success response
                response.put("success", true);
                response.put("message", "File uploaded successfully");
                response.put("url", fileUrl);
                return ResponseEntity.ok(response);
            } else {
                logger.error("Storage service returned empty or null URL");
                response.put("success", false);
                response.put("error", "Storage service returned invalid URL");
                return ResponseEntity.internalServerError().body(response);
            }
            
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid file upload: " + e.getMessage());
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (IOException e) {
            logger.error("File upload error: " + e.getMessage(), e);
            response.put("success", false);
            response.put("error", "Failed to store file: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        } catch (Exception e) {
            logger.error("Unexpected error during file upload", e);
            response.put("success", false);
            response.put("error", "An unexpected error occurred: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Debug endpoint: Check if file exists in R2 storage
     * 
     * @param submissionId submission ID
     * @return file status information
     */
    @GetMapping("/{submissionId}/check-image")
    @PreAuthorize("hasAnyAuthority('user', 'admin')")
    public ResponseEntity<Map<String, Object>> checkImage(@PathVariable("submissionId") String submissionId) {
        logger.info("Starting image verification for submission ID: " + submissionId);
        Map<String, Object> response = new HashMap<>();
        
        try {
            Long subId = Long.valueOf(submissionId);
            Submission submission = submissionUploadService.requireSubmission(subId);
            
            String imageUrl = submission.getImageUrl();
            response.put("submissionId", submissionId);
            response.put("imageUrl", imageUrl);
            
            if (imageUrl == null || imageUrl.isEmpty()) {
                response.put("status", "No image URL found for this submission");
                return ResponseEntity.ok(response);
            }
            
            boolean exists = r2StorageService.fileExists(imageUrl);
            response.put("exists", exists);
            
            if (exists) {
                response.put("status", "File exists in R2 storage");
                
                try {
                    // Get file size and other metadata
                    String objectKey = r2StorageService.extractObjectKeyFromUrl(imageUrl);
                    if (objectKey != null) {
                        software.amazon.awssdk.services.s3.model.HeadObjectRequest headRequest = 
                            software.amazon.awssdk.services.s3.model.HeadObjectRequest.builder()
                                .bucket(r2StorageService.getBucketName())
                                .key(objectKey)
                                .build();
                        
                        software.amazon.awssdk.services.s3.model.HeadObjectResponse headResponse = 
                            r2StorageService.getS3Client().headObject(headRequest);
                        
                        response.put("fileSize", headResponse.contentLength());
                        response.put("contentType", headResponse.contentType());
                        response.put("eTag", headResponse.eTag());
                        response.put("lastModified", headResponse.lastModified().toString());
                    }
                } catch (Exception e) {
                    logger.warn("Failed to get file metadata: " + e.getMessage());
                    response.put("metadata_error", e.getMessage());
                }
            } else {
                response.put("status", "File does not exist in R2 storage");
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error checking image: " + e.getMessage(), e);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * Debug endpoint: Get image content directly from R2
     * 
     * @param submissionId submission ID
     * @return image content
     */
    @GetMapping(value = "/{submissionId}/direct-image", produces = {MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE})
    @PreAuthorize("hasAnyAuthority('user', 'admin')")
    public ResponseEntity<byte[]> getImageDirectly(@PathVariable("submissionId") String submissionId) {
        logger.info("Direct image retrieval request for submission ID: " + submissionId);
        
        try {
            Long subId = Long.valueOf(submissionId);
            Submission submission = submissionUploadService.requireSubmission(subId);
            
            String imageUrl = submission.getImageUrl();
            if (imageUrl == null || imageUrl.isEmpty()) {
                logger.warn("No image URL found for submission: " + submissionId);
                return ResponseEntity.notFound().build();
            }
            
            logger.info("Attempting to retrieve image directly from R2: " + imageUrl);
            byte[] imageData = r2StorageService.getObjectBytes(imageUrl);
            
            if (imageData == null || imageData.length == 0) {
                logger.warn("Failed to retrieve image data for URL: " + imageUrl);
                return ResponseEntity.notFound().build();
            }
            
            logger.info("Successfully retrieved image data. Size: " + imageData.length + " bytes");
            
            // Determine content type
            String contentType = MediaType.IMAGE_JPEG_VALUE; // Default to JPEG
            if (imageUrl.toLowerCase().endsWith("png")) {
                contentType = MediaType.IMAGE_PNG_VALUE;
            }
            
            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(imageData);
        } catch (Exception e) {
            logger.error("Error retrieving image: " + e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Dedicated endpoint for uploading homepage hero image
     * The uploaded image will be saved as /uploads/hero.jpg, replacing any existing file
     * 
     * @param file uploaded image file
     * @return upload result
     */
    @Description("Upload hero image for homepage. The image will be saved as /uploads/hero.jpg, replacing any existing file.")
    @PostMapping("/admin/upload-hero")
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<Map<String, Object>> uploadHeroImage(@RequestParam("file") MultipartFile file) {
        logger.info("Starting hero image upload - File: " + file.getOriginalFilename() + 
                   ", Size: " + file.getSize() + " bytes, Content Type: " + file.getContentType());
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Basic validation
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Cannot upload empty file"
                ));
            }
            
            // File size check (30MB)
            long maxSize = 30 * 1024 * 1024;
            if (file.getSize() > maxSize) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "File size exceeds the limit of 30MB"
                ));
            }
            
            // File type check
            String contentType = file.getContentType();
            if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png"))) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "File type not supported. Only JPEG and PNG are allowed"
                ));
            }
            
            // If using LocalStorageService, we need to manually save to a specific location
            if (storageService instanceof LocalStorageService) {
                // Use special path to save hero image
                String heroFileUrl = saveHeroImageLocally(file, localStorageService);
                
                if (heroFileUrl != null) {
                    response.put("success", true);
                    response.put("message", "Hero image uploaded successfully");
                    response.put("url", heroFileUrl);
                    logger.info("Hero image uploaded successfully: " + heroFileUrl);
                    return ResponseEntity.ok(response);
                } else {
                    return ResponseEntity.internalServerError().body(Map.of(
                        "success", false,
                        "error", "Failed to save hero image"
                    ));
                }
            } else {
                // For R2 storage, use existing logic but save to specific path
                String fileUrl = storageService.storeFile(file, "static", "admin", "hero");
                response.put("success", true);
                response.put("message", "Hero image uploaded successfully");
                response.put("url", fileUrl);
                return ResponseEntity.ok(response);
            }
            
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid hero image upload: " + e.getMessage());
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (IOException e) {
            logger.error("Hero image upload error: " + e.getMessage(), e);
            response.put("success", false);
            response.put("error", "Failed to store hero image: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        } catch (Exception e) {
            logger.error("Unexpected error during hero image upload", e);
            response.put("success", false);
            response.put("error", "An unexpected error occurred: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Save hero image to specific location in local storage
     */
    private String saveHeroImageLocally(MultipartFile file, LocalStorageService localService) throws IOException {
        // Get the root path of uploads directory
        try {
            java.lang.reflect.Field rootLocationField = LocalStorageService.class.getDeclaredField("rootLocation");
            rootLocationField.setAccessible(true);
            java.nio.file.Path rootLocation = (java.nio.file.Path) rootLocationField.get(localService);
            
            // Determine file extension
            String originalFilename = file.getOriginalFilename();
            String extension = "jpg"; // Default
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
            }
            
            // Save as fixed hero.jpg
            java.nio.file.Path heroImagePath = rootLocation.resolve("hero." + extension);
            
            logger.info("Saving hero image to: " + heroImagePath);
            
            // Save file, replace existing file
            java.nio.file.Files.copy(file.getInputStream(), heroImagePath, 
                    java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            
            logger.info("Hero image saved successfully: " + heroImagePath);
            
            // Return accessible URL path
            return "/uploads/hero." + extension;
            
        } catch (Exception e) {
            logger.error("Failed to save hero image locally: " + e.getMessage(), e);
            throw new IOException("Failed to save hero image: " + e.getMessage(), e);
        }
    }
}