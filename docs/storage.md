# 📦 Storage System Documentation

This document describes the storage architecture for the Munich Weekly photography platform, which includes both local file storage and cloud storage options.

## Overview

The platform implements a flexible storage strategy with two main implementations:

1. **Local Storage** - Used primarily for development and testing environments
2. **Cloudflare R2 Storage** - Used for production environments

The storage implementation is selected based on configuration, allowing seamless switching between different storage providers without changing application code.

---

## Storage Configuration

Storage settings are defined in `application.properties`:

```properties
# Storage configuration - set to 'R2' for cloud storage, or 'LOCAL' for local storage
storage.mode=R2

# Upload directory configuration (for local storage)
uploads.directory=${UPLOADS_DIR:./uploads}

# Cloudflare R2 configuration (for cloud storage)
cloudflare.r2.access-key=${CLOUDFLARE_R2_ACCESS_KEY:}
cloudflare.r2.secret-key=${CLOUDFLARE_R2_SECRET_KEY:}
cloudflare.r2.endpoint=${CLOUDFLARE_R2_ENDPOINT:}
cloudflare.r2.bucket=${CLOUDFLARE_R2_BUCKET:munichweekly-photoupload}
cloudflare.r2.public-url=${CLOUDFLARE_R2_PUBLIC_URL:}
```

These settings can be overridden through environment variables in your Docker configuration.

---

## Storage Service Interface

Both storage implementations adhere to the `StorageService` interface:

```java
public interface StorageService {
    String storeFile(MultipartFile file, String issueId, String userId, String submissionId) throws IOException;
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

### Error Handling

Both implementations provide robust error handling for common issues:
- Invalid file types
- File size exceeding limits
- Storage service unavailability
- Permission errors

---

## Frontend Integration

The frontend uses a consistent API for image uploads, regardless of the backend storage implementation. The upload process:

1. Create a submission record via API
2. Receive an upload URL in the response
3. Upload the image directly to that URL
4. Images are served from their respective URLs in the UI

The frontend components are designed to handle both local and cloud storage URLs seamlessly, with special handling for local uploads when needed.

---

## Configuring R2 Storage

To configure Cloudflare R2 storage:

1. Create a Cloudflare R2 account
2. Create an API token with appropriate permissions
3. Set the environment variables in your Docker deployment
4. Set `storage.mode=R2` in your configuration

Example Docker environment configuration:

```yaml
environment:
  - CLOUDFLARE_R2_ACCESS_KEY=your-access-key
  - CLOUDFLARE_R2_SECRET_KEY=your-secret-key
  - CLOUDFLARE_R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
  - CLOUDFLARE_R2_BUCKET=munichweekly-photoupload
  - CLOUDFLARE_R2_PUBLIC_URL=https://pub-your-account.r2.dev
  - STORAGE_MODE=R2
```

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