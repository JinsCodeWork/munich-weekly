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

# Cloudflare Worker CDN
cloudflare.worker.url=${CLOUDFLARE_WORKER_URL:https://img.munichweekly.art}
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

## Cloudflare Worker Image CDN

To enhance image delivery performance and enable on-demand image transformations, Munich Weekly implements a Cloudflare Worker as a CDN layer between clients and the R2 storage.

### Image Worker Architecture

The Image Worker serves as a processing middleware that:

1. Receives image requests from clients
2. Retrieves original images from R2 private storage
3. Applies real-time transformations based on URL parameters
4. Delivers optimized images with appropriate caching headers

### Key Features

- **On-demand Image Resizing** - Dynamically resize images based on client requirements
- **Format Optimization** - Convert images to modern formats like WebP and AVIF based on browser support
- **Quality Control** - Adjust compression levels for different use cases
- **Responsive Delivery** - Serve appropriately sized images for different devices
- **Bandwidth Optimization** - Reduce data transfer by delivering optimized images
- **Edge Caching** - Leverage Cloudflare's global CDN for faster delivery

### URL Structure and Parameters

Images are served from the worker domain (img.munichweekly.art) with the following pattern:

```
https://img.munichweekly.art/uploads/issues/{issueId}/submissions/{fileName}?width=300&height=200&quality=80&fit=cover
```

Supported transformation parameters include:

| Parameter | Description | Example |
|-----------|-------------|---------|
| width     | Target width in pixels | `width=300` |
| height    | Target height in pixels | `height=200` |
| quality   | Compression quality (1-100) | `quality=80` |
| fit       | Resizing strategy | `fit=cover`, `fit=contain`, `fit=scale-down` |
| format    | Output format | `format=webp`, `format=auto` |
| dpr       | Device pixel ratio | `dpr=2` |

### Worker Configuration

The Image Worker is configured using `wrangler.toml`:

```toml
name = "image-worker"
main = "src/index.js"
compatibility_date = "2025-05-19"

# R2 bucket binding
[[r2_buckets]]
binding = "PHOTO_BUCKET"
bucket_name = "munichweekly-photoupload"
preview_bucket_name = "munichweekly-photoupload"
```

### Implementation Details

The Worker code handles various aspects of image processing:

- **Path Parsing** - Extracts object keys from request paths
- **Parameter Extraction** - Parses transformation parameters from URL query
- **Format Detection** - Identifies optimal image formats based on Accept headers
- **Content-Type Handling** - Ensures correct MIME types for transformed images
- **Error Handling** - Gracefully handles missing images or invalid parameters
- **Caching Strategy** - Sets appropriate cache headers for optimized delivery

### Frontend Integration

The frontend uses utility functions to generate appropriate image URLs:

1. `getImageUrl()` - Transforms raw storage URLs to CDN URLs
2. `createImageUrl()` - Adds transformation parameters based on display context

Implementation example:

```tsx
// For thumbnails in lists
<Thumbnail 
  src={getImageUrl(imageUrl)}
  width={300}
  height={200}
  quality={80}
  fit="cover"
  useImageOptimization={true}
/>

// For full-size viewing
<ImageViewer
  imageUrl={getImageUrl(imageUrl)}
  useHighQuality={true}
/>
```

### On-Demand Loading Strategy

The platform implements an on-demand image loading strategy:

1. **Thumbnail View** - Small, optimized images are loaded in list views
   - Lower resolution (e.g., 300×200)
   - Medium quality (e.g., 80%)
   - Cropped to fit display area

2. **Full Image View** - High-quality images are loaded only when explicitly requested
   - Higher resolution (up to original size)
   - Higher quality (95%)
   - Preserved aspect ratio

This approach significantly reduces bandwidth usage while maintaining excellent user experience.

## Frontend Integration

The frontend uses a consistent API for image uploads and display, regardless of the backend storage implementation.

### Upload Process
1. Create a submission record via API
2. Receive an upload URL in the response
3. Upload the image directly to that URL

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

### Error Handling

Both implementations provide robust error handling for common issues:
- Invalid file types
- File size exceeding limits
- Storage service unavailability
- Permission errors

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