package com.munichweekly.backend.controller;

import com.munichweekly.backend.dto.FileUploadResponseDTO;
import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.repository.SubmissionRepository;
import com.munichweekly.backend.service.StorageService;
import com.munichweekly.backend.service.SubmissionService;
import com.munichweekly.backend.service.R2StorageService;
import com.munichweekly.backend.service.LocalStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.munichweekly.backend.devtools.annotation.Description;

/**
 * Enhanced REST controller for handling file uploads with image dimension optimization
 */
@RestController
@RequestMapping("/api/submissions")
public class FileUploadController {

    private static final Logger logger = Logger.getLogger(FileUploadController.class.getName());
    private final StorageService storageService;
    private final SubmissionRepository submissionRepository;
    private final SubmissionService submissionService; // **NEW: For dimension optimization**
    private final R2StorageService r2StorageService;  // Direct R2 service for debugging
    private final LocalStorageService localStorageService;

    @Autowired
    public FileUploadController(StorageService storageService, 
                               SubmissionRepository submissionRepository,
                               SubmissionService submissionService,
                               R2StorageService r2StorageService,
                               LocalStorageService localStorageService) {
        this.storageService = storageService;
        this.submissionRepository = submissionRepository;
        this.submissionService = submissionService;
        this.r2StorageService = r2StorageService;
        this.localStorageService = localStorageService;
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
            Submission submission = submissionRepository.findById(subId)
                    .orElseThrow(() -> new IllegalArgumentException("Submission not found: " + submissionId));
            
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
                    logger.warning("Unable to verify file existence: " + e.getMessage());
                }
                
                if (!fileExists) {
                    logger.warning("Uploaded file could not be verified at URL: " + imageUrl + 
                                  " but proceeding with database update anyway");
                }
            } else {
                logger.severe("Storage service returned empty or null URL");
                return ResponseEntity.internalServerError()
                        .body(new FileUploadResponseDTO(false, "Storage service returned invalid URL"));
            }
            
            // **OPTIMIZED: Update submission with URL and dimensions in one operation**
            submission.setImageUrl(imageUrl);
            
            // If dimensions were extracted during upload, store them directly
            if (storageResult.hasDimensions()) {
                submission.setImageDimensions(
                    storageResult.getDimensions().getWidth(), 
                    storageResult.getDimensions().getHeight()
                );
                logger.info("Stored dimensions from upload: " + storageResult.getDimensions());
            } else {
                logger.info("No dimensions available from upload, submission will use dynamic fetching when needed");
            }
            
            // Save the updated submission
            submissionRepository.save(submission);
            
            logger.info("Enhanced file upload process completed successfully with optimal dimension handling");
            return ResponseEntity.ok(new FileUploadResponseDTO(imageUrl));
            
        } catch (NumberFormatException e) {
            logger.severe("Invalid submission ID format: " + submissionId);
            return ResponseEntity.badRequest().body(
                new FileUploadResponseDTO(false, "Invalid submission ID: " + submissionId)
            );
        } catch (IllegalArgumentException e) {
            logger.warning("Invalid file upload: " + e.getMessage());
            return ResponseEntity.badRequest().body(new FileUploadResponseDTO(false, e.getMessage()));
        } catch (IOException e) {
            logger.log(Level.SEVERE, "File upload error: " + e.getMessage(), e);
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(new FileUploadResponseDTO(false, "Failed to store file: " + e.getMessage()));
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Unexpected error during file upload", e);
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(new FileUploadResponseDTO(false, "An unexpected error occurred: " + e.getMessage()));
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
                    logger.warning("Unable to verify file existence: " + e.getMessage());
                }
                
                if (!fileExists) {
                    logger.warning("Unable to verify uploaded file at URL: " + fileUrl + ", but continuing with processing");
                }
                
                // Return success response
                response.put("success", true);
                response.put("message", "File uploaded successfully");
                response.put("url", fileUrl);
                return ResponseEntity.ok(response);
            } else {
                logger.severe("Storage service returned empty or null URL");
                response.put("success", false);
                response.put("error", "Storage service returned invalid URL");
                return ResponseEntity.internalServerError().body(response);
            }
            
        } catch (IllegalArgumentException e) {
            logger.warning("Invalid file upload: " + e.getMessage());
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (IOException e) {
            logger.log(Level.SEVERE, "File upload error: " + e.getMessage(), e);
            e.printStackTrace();
            response.put("success", false);
            response.put("error", "Failed to store file: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Unexpected error during file upload", e);
            e.printStackTrace();
            response.put("success", false);
            response.put("error", "An unexpected error occurred: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 调试端点：检查文件是否存在于R2存储中
     * 
     * @param submissionId 提交ID
     * @return 文件状态信息
     */
    @GetMapping("/{submissionId}/check-image")
    @PreAuthorize("hasAnyAuthority('user', 'admin')")
    public ResponseEntity<Map<String, Object>> checkImage(@PathVariable("submissionId") String submissionId) {
        logger.info("Starting image verification for submission ID: " + submissionId);
        Map<String, Object> response = new HashMap<>();
        
        try {
            Long subId = Long.valueOf(submissionId);
            Submission submission = submissionRepository.findById(subId)
                    .orElseThrow(() -> new IllegalArgumentException("Submission not found: " + submissionId));
            
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
                    // 获取文件大小和其他元数据
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
                    logger.warning("Failed to get file metadata: " + e.getMessage());
                    response.put("metadata_error", e.getMessage());
                }
            } else {
                response.put("status", "File does not exist in R2 storage");
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error checking image: " + e.getMessage(), e);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * 调试端点：直接从R2获取图片内容
     * 
     * @param submissionId 提交ID
     * @return 图片内容
     */
    @GetMapping(value = "/{submissionId}/direct-image", produces = {MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE})
    @PreAuthorize("hasAnyAuthority('user', 'admin')")
    public ResponseEntity<byte[]> getImageDirectly(@PathVariable("submissionId") String submissionId) {
        logger.info("Direct image retrieval request for submission ID: " + submissionId);
        
        try {
            Long subId = Long.valueOf(submissionId);
            Submission submission = submissionRepository.findById(subId)
                    .orElseThrow(() -> new IllegalArgumentException("Submission not found: " + submissionId));
            
            String imageUrl = submission.getImageUrl();
            if (imageUrl == null || imageUrl.isEmpty()) {
                logger.warning("No image URL found for submission: " + submissionId);
                return ResponseEntity.notFound().build();
            }
            
            logger.info("Attempting to retrieve image directly from R2: " + imageUrl);
            byte[] imageData = r2StorageService.getObjectBytes(imageUrl);
            
            if (imageData == null || imageData.length == 0) {
                logger.warning("Failed to retrieve image data for URL: " + imageUrl);
                return ResponseEntity.notFound().build();
            }
            
            logger.info("Successfully retrieved image data. Size: " + imageData.length + " bytes");
            
            // 确定内容类型
            String contentType = MediaType.IMAGE_JPEG_VALUE; // 默认为JPEG
            if (imageUrl.toLowerCase().endsWith("png")) {
                contentType = MediaType.IMAGE_PNG_VALUE;
            }
            
            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(imageData);
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error retrieving image: " + e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 专门用于主页hero图片上传的端点
     * 上传的图片将直接保存为 /uploads/hero.jpg，覆盖现有文件
     * 
     * @param file 上传的图片文件
     * @return 上传结果
     */
    @Description("Upload hero image for homepage. The image will be saved as /uploads/hero.jpg, replacing any existing file.")
    @PostMapping("/admin/upload-hero")
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<Map<String, Object>> uploadHeroImage(@RequestParam("file") MultipartFile file) {
        logger.info("Starting hero image upload - File: " + file.getOriginalFilename() + 
                   ", Size: " + file.getSize() + " bytes, Content Type: " + file.getContentType());
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 基本验证
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Cannot upload empty file"
                ));
            }
            
            // 文件大小检查 (30MB)
            long maxSize = 30 * 1024 * 1024;
            if (file.getSize() > maxSize) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "File size exceeds the limit of 30MB"
                ));
            }
            
            // 文件类型检查
            String contentType = file.getContentType();
            if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png"))) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "File type not supported. Only JPEG and PNG are allowed"
                ));
            }
            
            // 如果使用LocalStorageService，我们需要手动保存到特定位置
            if (storageService instanceof LocalStorageService) {
                // 使用特殊的路径来保存hero图片
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
                // 对于R2存储，使用现有逻辑但保存到特定路径
                String fileUrl = storageService.storeFile(file, "static", "admin", "hero");
                response.put("success", true);
                response.put("message", "Hero image uploaded successfully");
                response.put("url", fileUrl);
                return ResponseEntity.ok(response);
            }
            
        } catch (IllegalArgumentException e) {
            logger.warning("Invalid hero image upload: " + e.getMessage());
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (IOException e) {
            logger.log(Level.SEVERE, "Hero image upload error: " + e.getMessage(), e);
            response.put("success", false);
            response.put("error", "Failed to store hero image: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Unexpected error during hero image upload", e);
            response.put("success", false);
            response.put("error", "An unexpected error occurred: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 将hero图片保存到本地存储的特定位置
     */
    private String saveHeroImageLocally(MultipartFile file, LocalStorageService localService) throws IOException {
        // 获取uploads目录的根路径
        try {
            java.lang.reflect.Field rootLocationField = LocalStorageService.class.getDeclaredField("rootLocation");
            rootLocationField.setAccessible(true);
            java.nio.file.Path rootLocation = (java.nio.file.Path) rootLocationField.get(localService);
            
            // 确定文件扩展名
            String originalFilename = file.getOriginalFilename();
            String extension = "jpg"; // 默认
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
            }
            
            // 固定保存为 hero.jpg
            java.nio.file.Path heroImagePath = rootLocation.resolve("hero." + extension);
            
            logger.info("Saving hero image to: " + heroImagePath);
            
            // 保存文件，覆盖现有文件
            java.nio.file.Files.copy(file.getInputStream(), heroImagePath, 
                    java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            
            logger.info("Hero image saved successfully: " + heroImagePath);
            
            // 返回可访问的URL路径
            return "/uploads/hero." + extension;
            
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Failed to save hero image locally: " + e.getMessage(), e);
            throw new IOException("Failed to save hero image: " + e.getMessage(), e);
        }
    }
}