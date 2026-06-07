# 📦 Storage System Documentation

This document describes the storage architecture for the Munich Weekly photography platform, which includes both local file storage and cloud storage options.

## Overview

The platform implements a flexible storage strategy with two main implementations:

1. **Local Storage** - Used primarily for development and testing environments
2. **Cloudflare R2 Storage** - Used for production environments
3. **Cloudflare Worker Image CDN** - Optimizes image delivery and processing

The storage implementation is selected based on configuration, allowing seamless switching between different storage providers without changing application code.

---

## Storage Configuration

Storage mode is selected by the Spring `storage.mode` property, which can be
overridden by environment variables. Keep the variable list and defaults in
[Environment Variables](./environment.md); keep this document focused on storage
behavior and operational consequences.

---

## Storage Service Interface

Both storage implementations adhere to the `StorageService` interface:

```java
public interface StorageService {
    String storeFile(MultipartFile file, String issueId, String userId, String submissionId) throws IOException;
    StorageResult storeFileWithDimensions(MultipartFile file, String issueId, String userId, String submissionId) throws IOException;
    boolean deleteFile(String fileUrl);
    boolean fileExists(String fileUrl);
}
```

This abstraction enables the application to use any storage provider without modifying the business logic.

---

## Local Storage Implementation

The `LocalStorageService` class:

- Stores files in a local directory structure
- Uses relative URLs for file access
- Creates a directory structure based on issue and submission IDs
- Validates file extensions, content types, and file size
- Provides basic file operations (store, delete, check existence)

**File Path Structure:**
```
/uploads/issues/{issueId}/submissions/{userId}_{submissionId}_{timestamp}.{extension}
```

This implementation is ideal for development and testing environments where cloud storage is not necessary or practical.

---

## Cloudflare R2 Storage Implementation

The `R2StorageService` class:

- Stores files in Cloudflare R2 object storage
- Accessed via S3-compatible API
- Creates an optimized URL structure for efficient storage and retrieval
- Validates endpoint configuration and credentials at startup
- Supports all the same operations as local storage
- Automatically creates required buckets if they don't exist

**Key Features:**

- **Automatic Bucket Creation** - Creates the storage bucket if it doesn't exist
- **Public URL Generation** - Creates publicly accessible URLs for stored images
- **AWS S3 Compatible** - Uses standard AWS S3 SDK for operations
- **Fallback Mechanism** - Falls back to local storage if R2 is unavailable

**Advantages of R2 Storage:**

1. **Scalability** - Handles large volumes of image uploads
2. **Reliability** - Redundant storage with high availability
3. **Performance** - Global CDN for faster image delivery
4. **Cost Efficiency** - Optimized for storing and serving static content
5. **Security** - Secure storage with access controls

---

## Cloudflare Worker Image CDN

Munich Weekly uses a Cloudflare Worker in front of stored images for optimized
delivery and transformations. Keep worker URL formats, transformation
parameters, cache behavior, deployment, and debugging details in
[Image CDN System](./image-cdn.md). This storage document only records that
stored image URLs may be transformed for delivery through that CDN layer.

## Frontend Integration

The frontend uses a consistent API for image uploads and display, regardless of the backend storage implementation.

### Upload Process

### Image Upload with Dimension Optimization

The upload process now includes **automatic image dimension extraction** for performance optimization:

```typescript
// Enhanced upload flow with dimension extraction
POST /api/submissions/{submissionId}/upload
```

**Upload Process Steps:**
1. **File validation** - Format, size, and content verification
2. **Dimension extraction** ✨ **NEW** - Width, height, and aspect ratio computed from upload stream
3. **Storage operation** - File saved to local/R2 storage
4. **Database update** - Submission record updated with URL and dimensions
5. **Response** - Returns success with stored dimension data

**Performance Benefits:**
- **Single computation** - Dimensions calculated once during upload
- **Database storage** - Width, height, aspect ratio persisted permanently
- **API optimization** - Dimension data included in submission responses
- **Frontend efficiency** - Eliminates client-side calculation overhead

### Admin Gallery Custom Image Uploads

Issue galleries can also contain administrator-managed custom images that are not user submissions:

```typescript
POST /api/gallery/admin/issues/{issueId}/custom-images
```

**Storage behavior:**
1. The backend validates the uploaded image through the same storage rules as submissions.
2. The image is stored with `issueId`, `userId=admin`, and a generated `submissionId` such as `custom-{uuid}`.
3. `storeFileWithDimensions()` extracts width, height, and aspect ratio during upload.
4. The resulting URL and dimensions are persisted on the `gallery_submission_order` row.
5. When a custom image is removed from the gallery order, the associated storage file is deleted through `StorageService.deleteFile()`.

Custom gallery images are admin-managed visual material. They appear in the public gallery without submitter attribution and do not participate in submission ownership or voting workflows.

### StorageService Enhancement ✨ **NEW**

```typescript
// New method with dimension extraction
public StorageResult storeFileWithDimensions(MultipartFile file) {
    // Extract dimensions from file stream before storage
    ImageDimensions dimensions = extractImageDimensions(file.getBytes());

    // Store file using existing logic
    String url = storeFile(file);

    // Return both URL and dimensions
    return new StorageResult(url, dimensions);
}

// Response container
public class StorageResult {
    private final String url;
    private final ImageDimensions dimensions;

    // Constructor and getters...
}
```

### Dimension Extraction Implementation

**Local Storage (Development):**
```java
// Direct extraction from byte array
BufferedImage image = ImageIO.read(new ByteArrayInputStream(fileBytes));
int width = image.getWidth();
int height = image.getHeight();
double aspectRatio = (double) width / height;
```

**R2 Storage (Production):**
```java
// Extract before upload to avoid re-downloading
byte[] fileBytes = file.getBytes();
ImageDimensions dimensions = extractImageDimensions(fileBytes);

// Upload to R2 using the same byte array
PutObjectRequest request = PutObjectRequest.builder()
    .bucket(bucketName)
    .key(fileName)
    .build();
s3Client.putObject(request, RequestBody.fromBytes(fileBytes));
```

**Key Advantages:**
- **Single file read** - Dimensions extracted from upload stream
- **No redundant downloads** - Avoids re-fetching uploaded files
- **Immediate availability** - Dimensions available as soon as upload completes

### Image Display Process
1. Receive image URL from the backend (either local path or R2 URL)
2. Transform URLs to use the Image CDN for production environments
3. Add appropriate transformation parameters based on display context
4. Load optimized images through Next.js Image component

### Key Frontend Components

- **Thumbnail Component** - Displays optimized thumbnails with appropriate size/quality
- **ImageViewer Component** - Shows high-quality images when users request full view
- **URL Utility Functions** - Handle URL transformations and parameter additions

This integration ensures efficient image loading across different environments and use cases.

---

## Storage Selection Logic

The `StorageConfig` class determines which storage implementation to use:

```java
@Configuration
public class StorageConfig {
    @Value("${storage.mode:R2}")
    private String storageMode;

    @Bean
    @Primary
    public StorageService storageService() {
        if ("R2".equalsIgnoreCase(storageMode)) {
            if (r2StorageService != null) {
                return r2StorageService;
            } else {
                return localStorageService; // fallback
            }
        }
        return localStorageService; // default
    }
}
```

This configuration allows you to switch storage providers by changing a single configuration value.

---

## Cloud-Only Storage Migration

As of the latest update, the platform has migrated to exclusively use cloud storage (Cloudflare R2) for production environments. This migration brings several advantages:

1. **Enhanced Scalability** - Better handling of growing storage needs
2. **Improved Performance** - Faster global access through CDN
3. **Higher Reliability** - Redundant storage with automated backups
4. **Simplified Operations** - Consistent storage mechanism across all deployments

Local storage is now reserved exclusively for development and testing environments.

---

## GDPR Compliance and Data Deletion

The platform implements comprehensive data deletion capabilities to comply with the European General Data Protection Regulation (GDPR) and other privacy regulations. These features ensure that user data can be completely removed from the system upon request.

### Submission Deletion

When a submission is deleted, the system:

1. **Removes Database Records** - Deletes the submission entry from the database
2. **Deletes Associated Votes** - Removes all votes related to the submission
3. **Removes Cloud Storage Files** - Permanently deletes the image file from Cloudflare R2 storage
4. **Logs Deletion Activities** - Records all deletion actions for audit purposes

Users can delete their own submissions through the user interface, and administrators can delete any submission through the admin panel.

### User Account Deletion

When a user requests account deletion, the system executes a comprehensive deletion process:

1. **Submission Cleanup** - Identifies and deletes all submissions by the user
   - For each submission, deletes associated votes
   - For each submission, removes the image file from cloud storage

2. **Personal Data Removal** - Removes all personal information:
   - Deletes all votes cast by the user
   - Removes third-party authentication bindings
   - Purges personal profile information

3. **Account Termination** - Finally deletes the user account record

This multi-step process ensures complete data removal across the system and cloud storage, meeting GDPR requirements for the "right to be forgotten."

### Implementation

The deletion process is implemented as transactional operations to ensure atomicity:

```java
@Transactional
public void deleteCurrentUser() {
    // Get authenticated user
    Long userId = CurrentUserUtil.getUserIdOrThrow();
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    // Delete user's submissions and associated cloud storage files
    List<Submission> userSubmissions = submissionRepository.findByUserId(userId);
    for (Submission submission : userSubmissions) {
        // Delete votes for this submission
        voteRepository.deleteBySubmission(submission);

        // Delete image file from cloud storage
        if (submission.getImageUrl() != null && !submission.getImageUrl().isEmpty()) {
            storageService.deleteFile(submission.getImageUrl());
        }
    }

    // Delete the submissions from database
    submissionRepository.deleteAll(userSubmissions);

    // Delete votes cast by the user
    voteRepository.deleteByUserId(userId);

    // Delete third-party auth bindings
    authProviderRepository.deleteByUser(user);

    // Delete the user account
    userRepository.delete(user);
}
```

### User Interface

The frontend provides intuitive interfaces for these deletion operations:

1. **Submission Management** - Users can manage and delete their submissions from the "My Submissions" page
2. **Account Deletion** - Users can request account deletion from account settings
3. **Confirmation Dialogs** - Clear warnings about the permanent nature of deletion actions

These features ensure the platform maintains compliance with data protection regulations while giving users control over their data.

---

## Implementation Details

### File Naming Strategy

Both implementations use a consistent file naming strategy:
```
{userId}_{submissionId}_{timestamp}.{extension}
```

### Supported File Types

The storage services validate files based on:
- **Extensions**: jpg, jpeg, png
- **Content Types**: image/jpeg, image/png
- **Maximum Size**: 20MB

### URL Path Structure

URLs follow different patterns depending on the storage implementation:

- **Local Storage**: `/uploads/issues/{issueId}/submissions/{fileName}`
- **R2 Storage**: `{publicBaseUrl}/issues/{issueId}/submissions/{fileName}`

Submission uploads, gallery cover images, and admin custom gallery images all use this issue-scoped path format. Cover images use `admin_cover` identifiers, while custom gallery images use `admin_custom-{uuid}` identifiers in the generated file name.

### Error Handling

Both implementations provide robust error handling for common issues:
- Invalid file types
- File size exceeding limits
- Storage service unavailability
- Permission errors

---

## Configuring R2 Storage

To configure Cloudflare R2 storage, create a Cloudflare R2 bucket, issue an API
token with appropriate permissions, and set the R2 variables listed in
[Environment Variables](./environment.md). Production deployment wiring belongs
in [Deployment Guide](./deployment.md).

---

## Testing Storage Implementations

You can verify both storage implementations with:

1. **Local Storage**: Set `storage.mode=LOCAL` and upload a test image
2. **R2 Storage**: Set `storage.mode=R2` with valid R2 credentials and upload a test image

Each implementation logs detailed information during initialization and operations, which can be helpful for debugging.

---

## Migrating Between Storage Systems

To migrate existing images from local storage to R2:

1. Set up R2 storage configuration
2. Run a database query to get all existing image URLs
3. For each image:
   - Download from the local path
   - Upload to R2 using the same relative path
   - Update the database record with the new URL

Note: A migration utility tool is planned for future releases.

---

## FileDownloadService

The platform includes a specialized `FileDownloadService` for downloading original image files directly from storage, bypassing CDN optimization to ensure uncompressed quality.

### Purpose

The service is used primarily for administrative functions:
- Downloading selected submissions as ZIP archives
- Ensuring original image quality (bypassing CDN compression)
- Organizing files with meaningful names for content management

### Key Features

1. **Storage-Agnostic Design** - Works with both R2 and local storage
2. **Original Quality** - Bypasses CDN to access uncompressed images
3. **Intelligent Naming** - Renames files for better organization: `001_UserNickname_SubmissionID.jpg`
4. **Summary Generation** - Creates detailed reports of download operations

### Implementation

The service automatically detects the storage backend and uses the appropriate method:

```java
@Service
public class FileDownloadService {
    @Autowired
    private StorageService storageService;

    @Autowired(required = false)
    private R2StorageService r2StorageService;

    // Downloads original images directly from storage
    private byte[] readOriginalFromStorage(String objectPath) throws IOException {
        // Try R2 storage first if available
        if (r2StorageService != null) {
            byte[] r2Data = r2StorageService.getObjectBytes(constructR2Url(objectPath));
            if (r2Data != null) {
                return r2Data;
            }
        }

        // Fallback to local storage
        return readLocalFile(cleanPath);
    }
}
```

### URL Processing

The service handles various URL formats:
- **CDN URLs**: `https://img.munichweekly.art/uploads/issues/1/submissions/file.jpg`
- **R2 URLs**: `https://pub-123.r2.dev/uploads/issues/1/submissions/file.jpg`
- **Relative paths**: `/uploads/issues/1/submissions/file.jpg`

It automatically extracts the object path and reads from the appropriate storage backend.

### ZIP Archive Creation

When creating ZIP archives, the service:

1. **Validates permissions** - Ensures admin authentication
2. **Retrieves original files** - Downloads from storage (not CDN)
3. **Organizes content** - Renames files with sequential numbering
4. **Generates summary** - Creates detailed report of included files
5. **Packages everything** - Creates a single ZIP file for download

### Error Handling

The service provides comprehensive error handling:
- Missing files in storage
- Network connectivity issues
- Permission errors
- Storage service unavailability

Failed downloads are logged and reported in the summary file, ensuring transparency about what was successfully archived.

### Usage

The service is primarily used through the admin interface:
- Navigate to "Account" → "Manage Submissions"
- Select an issue with submissions marked as "Selected"
- Click "Download Selected Submissions"
- ZIP file downloads automatically with original quality images
