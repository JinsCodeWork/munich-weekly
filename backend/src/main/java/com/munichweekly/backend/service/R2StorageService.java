package com.munichweekly.backend.service;

import com.munichweekly.backend.model.ImageDimensions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.CreateBucketResponse;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketResponse;
import software.amazon.awssdk.services.s3.model.BucketAlreadyOwnedByYouException;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.ListBucketsResponse;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.core.sync.ResponseTransformer;

import jakarta.annotation.PostConstruct;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URI;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Enhanced implementation of StorageService that stores files in Cloudflare R2
 * with optimized image dimension extraction during upload.
 * Used for production environment.
 */
@Service
@ConditionalOnProperty(name = {"cloudflare.r2.access-key", "cloudflare.r2.secret-key", "cloudflare.r2.endpoint"}, matchIfMissing = false)
public class R2StorageService implements StorageService {
    
    private static final Logger logger = Logger.getLogger(R2StorageService.class.getName());
    
    @Value("${cloudflare.r2.access-key}")
    private String accessKey;
    
    @Value("${cloudflare.r2.secret-key}")
    private String secretKey;
    
    @Value("${cloudflare.r2.endpoint}")
    private String endpoint;
    
    @Value("${cloudflare.r2.bucket:munichweekly-photoupload}")
    private String bucketName;
    
    @Value("${cloudflare.r2.public-url:}")
    private String publicBaseUrl;
    
    private final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png");
    private final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList("image/jpeg", "image/png");
    private final long MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
    
    private S3Client s3Client;
    
    /**
     * Initialize the R2 client when the service is created
     */
    @PostConstruct
    public void init() {
        try {
            logger.info("Initializing R2 storage service with the following settings:");
            logger.info("Endpoint: " + endpoint);
            logger.info("Bucket: " + bucketName);
            logger.info("Access Key: " + (accessKey != null && !accessKey.isEmpty() ? "Configured (length: " + accessKey.length() + ")" : "Not Configured"));
            logger.info("Secret Key: " + (secretKey != null && !secretKey.isEmpty() ? "Configured (length: " + secretKey.length() + ")" : "Not Configured"));
            logger.info("Public Base URL: " + (publicBaseUrl != null && !publicBaseUrl.isEmpty() ? publicBaseUrl : "Not Configured (will be derived)"));
            
            // Validate environment variables
            if (accessKey == null || accessKey.isEmpty() || secretKey == null || secretKey.isEmpty() || endpoint == null || endpoint.isEmpty()) {
                logger.severe("R2 credentials not fully configured. Service will not operate correctly.");
                logger.severe("Please check your environment variables and ensure they are correctly set.");
                
                if (accessKey == null || accessKey.isEmpty()) {
                    logger.severe("CLOUDFLARE_R2_ACCESS_KEY is missing or empty");
                }
                
                if (secretKey == null || secretKey.isEmpty()) {
                    logger.severe("CLOUDFLARE_R2_SECRET_KEY is missing or empty");
                }
                
                if (endpoint == null || endpoint.isEmpty()) {
                    logger.severe("CLOUDFLARE_R2_ENDPOINT is missing or empty");
                }
                
                return;
            }
            
            // Validate endpoint format
            if (!endpoint.startsWith("https://")) {
                logger.warning("R2 endpoint URL does not start with https:// - this may cause issues");
            }
            
            if (!endpoint.contains("r2.cloudflarestorage.com")) {
                logger.warning("R2 endpoint URL does not contain 'r2.cloudflarestorage.com' - this may not be a valid R2 endpoint");
            }
            
            // Create the AWS credentials with R2 access keys
            AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);
            
            // Build the S3 client with R2 configuration
            this.s3Client = S3Client.builder()
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .endpointOverride(URI.create(endpoint))
                // R2 requires a region, but uses the endpoint URL for actual communication
                .region(Region.US_EAST_1)
                .build();
            
            logger.info("R2 storage service client initialized successfully");
            
            // List all available buckets to check connectivity
            try {
                ListBucketsResponse listBucketsResponse = s3Client.listBuckets();
                logger.info("Successfully connected to R2. Available buckets: " + 
                           listBucketsResponse.buckets().stream()
                               .map(bucket -> bucket.name())
                               .reduce((a, b) -> a + ", " + b)
                               .orElse("None"));
            } catch (Exception e) {
                logger.severe("Failed to list buckets: " + e.getMessage());
                e.printStackTrace();
            }
            
            // Check if bucket exists and create it if it doesn't
            try {
                logger.info("Checking if bucket exists: " + bucketName);
                HeadBucketRequest headBucketRequest = HeadBucketRequest.builder()
                    .bucket(bucketName)
                    .build();
                
                HeadBucketResponse headBucketResponse = s3Client.headBucket(headBucketRequest);
                logger.info("Bucket exists: " + bucketName);
            } catch (NoSuchBucketException e) {
                logger.warning("Bucket does not exist: " + bucketName + ". Attempting to create it.");
                try {
                    CreateBucketRequest createBucketRequest = CreateBucketRequest.builder()
                        .bucket(bucketName)
                        .build();
                    
                    CreateBucketResponse createBucketResponse = s3Client.createBucket(createBucketRequest);
                    logger.info("Bucket created successfully: " + bucketName);
                    
                    // Verify bucket was created by checking it again
                    try {
                        HeadBucketRequest verifyRequest = HeadBucketRequest.builder()
                            .bucket(bucketName)
                            .build();
                        s3Client.headBucket(verifyRequest);
                        logger.info("Verified bucket exists after creation: " + bucketName);
                    } catch (Exception verifyEx) {
                        logger.severe("Failed to verify bucket after creation: " + verifyEx.getMessage());
                        verifyEx.printStackTrace();
                    }
                } catch (BucketAlreadyOwnedByYouException ex) {
                    logger.info("Bucket already owned by you: " + bucketName);
                } catch (S3Exception ex) {
                    logger.severe("Failed to create bucket: " + bucketName + " - " + ex.getMessage());
                    ex.printStackTrace();
                    throw new RuntimeException("Failed to create bucket: " + bucketName, ex);
                }
            } catch (S3Exception e) {
                logger.severe("Error checking bucket: " + bucketName + " - " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Error checking bucket: " + bucketName, e);
            }
            
            // Determine and log the public base URL if not explicitly set
            if (publicBaseUrl == null || publicBaseUrl.isEmpty()) {
                // Use standard R2 public URL pattern
                publicBaseUrl = endpoint.replace("https://", "https://pub-");
                publicBaseUrl = publicBaseUrl.replace(".r2.cloudflarestorage.com", ".r2.dev");
                logger.info("Using derived public base URL: " + publicBaseUrl);
            } else {
                logger.info("Using configured public base URL: " + publicBaseUrl);
            }
            
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Failed to initialize R2 storage: " + e.getMessage(), e);
            e.printStackTrace();
            throw new RuntimeException("Could not initialize R2 storage: " + e.getMessage(), e);
        }
    }
    
    /**
     * Store a file in Cloudflare R2
     * 
     * @param file The MultipartFile to store
     * @param issueId The ID of the issue (activity period)
     * @param userId The ID of the user
     * @param submissionId The ID of the submission
     * @return URL where the file can be accessed publicly
     */
    @Override
    public String storeFile(MultipartFile file, String issueId, String userId, String submissionId) throws IOException {
        // Use the enhanced method but only return the URL for backward compatibility
        StorageResult result = storeFileWithDimensions(file, issueId, userId, submissionId);
        return result.getUrl();
    }
    
    @Override
    public StorageResult storeFileWithDimensions(MultipartFile file, String issueId, String userId, String submissionId) throws IOException {
        logger.info("Starting enhanced R2 file upload with dimension extraction:");
        logger.info("File name: " + (file != null ? file.getOriginalFilename() : "null"));
        logger.info("File size: " + (file != null ? file.getSize() + " bytes" : "null"));
        logger.info("Content type: " + (file != null ? file.getContentType() : "null"));
        logger.info("Issue ID: " + issueId);
        logger.info("User ID: " + userId);
        logger.info("Submission ID: " + submissionId);
        
        // Check if R2 client is initialized
        if (s3Client == null) {
            logger.severe("R2 client is not initialized. Cannot upload file.");
            throw new IOException("R2 storage service is not properly initialized");
        }
        
        // Validate file and parameters
        validateFileAndParameters(file, issueId, userId, submissionId);
        
        // Get file extension
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        
        // **OPTIMIZATION: Extract dimensions from stream before uploading**
        ImageDimensions dimensions = null;
        byte[] fileBytes = null;
        
        try {
            fileBytes = file.getBytes(); // Read file content once
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
        
        try {
            // Generate unique file path with timestamp and provided IDs
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
            // File key structure: uploads/issues/{issueId}/submissions/{userId}_{submissionId}_{timestamp}.{ext}
            String fileKey = String.format("uploads/issues/%s/submissions/%s_%s_%s.%s",
                issueId, userId, submissionId, timestamp, extension);
            
            // Upload file to R2
            logger.info("Attempting to upload to bucket: " + bucketName + " with key: " + fileKey);
            
            // Verify bucket exists
            verifyBucketExists();
            
            // Create upload request
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(fileKey)
                .contentType(file.getContentType())
                .build();
            
            // Upload file using pre-read bytes
            logger.info("Sending upload request to R2...");
            long startTime = System.currentTimeMillis();
            
            PutObjectResponse putObjectResponse = s3Client.putObject(
                putObjectRequest, 
                RequestBody.fromBytes(fileBytes)
            );
            
            long endTime = System.currentTimeMillis();
            logger.info("Enhanced upload operation completed in " + (endTime - startTime) + "ms");
            
            if (putObjectResponse != null) {
                logger.info("File upload response received. ETag: " + putObjectResponse.eTag());
            } else {
                logger.warning("Upload succeeded but response was null");
            }
            
            // Verify upload
            verifyUpload(fileKey, fileBytes.length);
            
            // Construct public URL
            String fileUrl = publicBaseUrl + "/" + fileKey;
            logger.info("File uploaded to R2 with dimensions. Public URL: " + fileUrl);
            
            return new StorageResult(fileUrl, dimensions);
            
        } catch (S3Exception e) {
            logger.log(Level.SEVERE, "Failed to upload file to R2: " + e.getMessage(), e);
            e.printStackTrace();
            throw new IOException("Failed to upload file to R2: " + e.getMessage(), e);
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Unexpected error during enhanced file upload: " + e.getMessage(), e);
            e.printStackTrace();
            throw new IOException("Unexpected error during enhanced file upload: " + e.getMessage(), e);
        }
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
     * Validate file and upload parameters
     */
    private void validateFileAndParameters(MultipartFile file, String issueId, String userId, String submissionId) {
        // Check if file is empty
        if (file.isEmpty()) {
            logger.warning("Cannot upload empty file");
            throw new IllegalArgumentException("Cannot store empty file");
        }

        // Check file size
        if (file.getSize() > MAX_FILE_SIZE) {
            logger.warning("File size exceeds limit: " + file.getSize() + " bytes (max: " + MAX_FILE_SIZE + " bytes)");
            throw new IllegalArgumentException("File size exceeds the limit of 20MB");
        }

        // Check file type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            logger.warning("File type not supported: " + contentType);
            throw new IllegalArgumentException("File type not supported. Only JPEG and PNG are allowed");
        }

        // Validate mandatory path parameters
        if (issueId == null || issueId.trim().isEmpty()) {
            logger.warning("issueId cannot be null or empty");
            throw new IllegalArgumentException("issueId cannot be null or empty");
        }
        if (userId == null || userId.trim().isEmpty()) {
            logger.warning("userId cannot be null or empty");
            throw new IllegalArgumentException("userId cannot be null or empty");
        }
        if (submissionId == null || submissionId.trim().isEmpty()) {
            logger.warning("submissionId cannot be null or empty");
            throw new IllegalArgumentException("submissionId cannot be null or empty");
        }
    }
    
    /**
     * Extract file extension from filename
     */
    private String getFileExtension(String originalFilename) {
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
            if (!ALLOWED_EXTENSIONS.contains(extension)) {
                logger.warning("File extension not allowed: " + extension);
                throw new IllegalArgumentException("File extension not allowed. Only jpg, jpeg, and png are allowed");
            }
        } else {
            logger.warning("Invalid file name: " + originalFilename);
            throw new IllegalArgumentException("Invalid file name");
        }
        return extension;
    }
    
    /**
     * Verify that the bucket exists before upload
     */
    private void verifyBucketExists() throws IOException {
        try {
            HeadBucketRequest checkRequest = HeadBucketRequest.builder()
                .bucket(bucketName)
                .build();
            
            s3Client.headBucket(checkRequest);
            logger.fine("Confirmed bucket exists before upload: " + bucketName);
        } catch (NoSuchBucketException e) {
            logger.severe("Bucket does not exist before upload attempt: " + bucketName);
            throw new IOException("Upload bucket does not exist: " + bucketName);
        } catch (Exception e) {
            logger.severe("Error checking bucket before upload: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Verify that the upload was successful
     */
    private void verifyUpload(String fileKey, long expectedSize) {
        try {
            HeadObjectRequest verifyRequest = HeadObjectRequest.builder()
                .bucket(bucketName)
                .key(fileKey)
                .build();
            
            HeadObjectResponse verifyResponse = s3Client.headObject(verifyRequest);
            logger.info("File upload verified. Size: " + verifyResponse.contentLength() + " bytes (expected: " + expectedSize + ")");
        } catch (Exception e) {
            logger.warning("Could not verify file upload: " + e.getMessage());
            // Continue anyway, as the file might still be propagating in R2
        }
    }
    
    /**
     * Delete a file from Cloudflare R2
     * 
     * @param fileUrl The URL of the file to delete
     * @return true if deletion was successful
     */
    @Override
    public boolean deleteFile(String fileUrl) {
        logger.info("Attempting to delete file: " + fileUrl);
        
        if (s3Client == null) {
            logger.warning("R2 storage service is not properly initialized");
            return false;
        }
        
        try {
            // Extract object key from URL
            String objectKey = extractObjectKeyFromUrl(fileUrl);
            if (objectKey == null) {
                logger.warning("Could not extract object key from URL: " + fileUrl);
                return false;
            }
            
            logger.info("Extracted object key: " + objectKey);
            
            // Delete object from R2
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .build();
            
            s3Client.deleteObject(deleteRequest);
            logger.info("Deleted file from R2: " + objectKey);
            return true;
            
        } catch (S3Exception e) {
            logger.log(Level.WARNING, "Failed to delete file from R2: " + fileUrl + " - " + e.getMessage(), e);
            e.printStackTrace();
            return false;
        } catch (Exception e) {
            logger.log(Level.WARNING, "Unexpected error during file deletion: " + e.getMessage(), e);
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * Check if a file exists in Cloudflare R2
     * 
     * @param fileUrl The URL of the file to check
     * @return true if the file exists
     */
    @Override
    public boolean fileExists(String fileUrl) {
        logger.info("Checking if file exists: " + fileUrl);
        
        if (s3Client == null) {
            logger.warning("R2 storage service is not properly initialized");
            return false;
        }
        
        try {
            // Extract object key from URL
            String objectKey = extractObjectKeyFromUrl(fileUrl);
            if (objectKey == null) {
                logger.warning("Could not extract object key from URL: " + fileUrl);
                return false;
            }
            
            logger.info("Extracted object key: " + objectKey);
            logger.info("Checking if exists in bucket: " + bucketName);
            
            // Check if object exists
            HeadObjectRequest headRequest = HeadObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .build();
            
            HeadObjectResponse response = s3Client.headObject(headRequest);
            logger.info("File exists in R2: " + objectKey + ", size: " + response.contentLength() + " bytes, ETag: " + response.eTag());
            
            return true;
            
        } catch (NoSuchKeyException e) {
            logger.info("File does not exist in R2: " + fileUrl);
            return false;
        } catch (S3Exception e) {
            logger.log(Level.WARNING, "Error checking if file exists in R2: " + fileUrl + " - " + e.getMessage(), e);
            if (e.statusCode() == 404) {
                logger.info("File confirmed not to exist (404 status code)");
                return false;
            }
            e.printStackTrace();
            return false;
        } catch (Exception e) {
            logger.log(Level.WARNING, "Unexpected error checking if file exists: " + e.getMessage(), e);
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * Read file content directly from R2, mainly used for debugging
     * 
     * @param fileUrl The file URL
     * @return byte array of file content, or null if reading fails
     */
    public byte[] getObjectBytes(String fileUrl) {
        logger.info("Attempting to read file content directly from R2: " + fileUrl);
        
        if (s3Client == null) {
            logger.warning("R2 client is not initialized, cannot read file");
            return null;
        }
        
        try {
            // Extract object key from URL
            String objectKey = extractObjectKeyFromUrl(fileUrl);
            if (objectKey == null) {
                logger.warning("Could not extract object key from URL: " + fileUrl);
                return null;
            }
            
            logger.info("Reading object with key: " + objectKey + " from bucket: " + bucketName);
            
            // Create get object request
            GetObjectRequest getRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .build();
            
            // Get object response
            GetObjectResponse getResponse = s3Client.getObject(getRequest, ResponseTransformer.toBytes()).response();
            
            logger.info("Successfully read file from R2. Content length: " + 
                       getResponse.contentLength() + " bytes, ETag: " + getResponse.eTag());
            
            return s3Client.getObject(getRequest, ResponseTransformer.toBytes()).asByteArray();
        } catch (NoSuchKeyException e) {
            logger.warning("File does not exist in R2: " + fileUrl);
            return null;
        } catch (S3Exception e) {
            logger.log(Level.WARNING, "Error reading file from R2: " + fileUrl + " - " + e.getMessage(), e);
            e.printStackTrace();
            return null;
        } catch (Exception e) {
            logger.log(Level.WARNING, "Unexpected error reading file: " + e.getMessage(), e);
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * Extract the object key from a file URL
     * 
     * @param fileUrl The URL of the file
     * @return The object key or null if it couldn't be extracted
     */
    public String extractObjectKeyFromUrl(String fileUrl) {
        logger.fine("Extracting object key from URL: " + fileUrl);
        
        // Handle different URL formats
        
        // If URL contains R2 public domain
        if (fileUrl.startsWith(publicBaseUrl)) {
            // Remove the public base URL
            String path = fileUrl.substring(publicBaseUrl.length());
            // Ensure path starts with /
            if (path.startsWith("/")) {
                path = path.substring(1);
            }
            logger.fine("Extracted key from full URL: " + path);
            return path;
        }
        
        // If URL contains bucket name
        String bucketPrefix = publicBaseUrl + "/" + bucketName + "/";
        if (fileUrl.startsWith(bucketPrefix)) {
            String path = fileUrl.substring(bucketPrefix.length());
            logger.fine("Extracted key from URL with bucket: " + path);
            return path;
        }
        
        // If it's a relative path
        if (fileUrl.startsWith("/uploads/")) {
            String path = "uploads/" + fileUrl.substring("/uploads/".length());
            logger.fine("Extracted key from relative path: " + path);
            return path;
        }
        
        // If it's already in object key format
        if (fileUrl.startsWith("uploads/")) {
            logger.fine("URL is already in object key format: " + fileUrl);
            return fileUrl;
        }
        
        // If it's just a filename
        if (!fileUrl.contains("/")) {
            String path = "uploads/" + fileUrl;
            logger.fine("Extracted key from filename: " + path);
            return path;
        }
        
        logger.warning("Could not extract object key from URL: " + fileUrl);
        return null;
    }
    
    /**
     * Get bucket name
     * @return bucket name
     */
    public String getBucketName() {
        return this.bucketName;
    }
    
    /**
     * Get S3 client instance
     * @return S3 client
     */
    public S3Client getS3Client() {
        return this.s3Client;
    }
} 