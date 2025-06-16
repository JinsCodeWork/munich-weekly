package com.munichweekly.backend.service;

import com.munichweekly.backend.model.Submission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.URI;
import java.net.URL;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.logging.Logger;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class FileDownloadService {

    private static final Logger logger = Logger.getLogger(FileDownloadService.class.getName());
    
    @Autowired(required = false)
    private R2StorageService r2StorageService;

    /**
     * Create a ZIP file containing all images from selected submissions
     * Downloads original uncompressed images directly from storage
     * @param submissions List of selected submissions
     * @param issueTitle Title of the issue for naming
     * @return Path to the created ZIP file
     */
    public Path createZipFromSubmissions(List<Submission> submissions, String issueTitle) throws IOException {
        // Create temporary directory for ZIP file
        Path tempDir = Files.createTempDirectory("selected_submissions");
        String sanitizedTitle = sanitizeFileName(issueTitle);
        Path zipPath = tempDir.resolve(sanitizedTitle + "_selected_submissions.zip");

        try (ZipOutputStream zipOut = new ZipOutputStream(new FileOutputStream(zipPath.toFile()))) {
            int successCount = 0;
            int failureCount = 0;

            for (Submission submission : submissions) {
                try {
                    if (submission.getImageUrl() != null && !submission.getImageUrl().isEmpty()) {
                        downloadAndAddToZip(submission, zipOut, successCount + 1);
                        successCount++;
                        logger.info("Successfully added submission " + submission.getId() + " to ZIP");
                    }
                } catch (Exception e) {
                    failureCount++;
                    logger.warning("Failed to download submission " + submission.getId() + ": " + e.getMessage());
                }
            }

            // Add a summary file
            addSummaryToZip(zipOut, submissions, successCount, failureCount, issueTitle);
            
            logger.info("ZIP creation completed. Success: " + successCount + ", Failures: " + failureCount);
        }

        return zipPath;
    }

    /**
     * Download original image directly from storage and add to ZIP with proper naming
     * Bypasses CDN to ensure we get the uncompressed original file
     */
    private void downloadAndAddToZip(Submission submission, ZipOutputStream zipOut, int index) throws IOException {
        String imageUrl = submission.getImageUrl();
        
        // Determine file extension
        String extension = getFileExtension(imageUrl);
        if (extension.isEmpty()) {
            extension = ".jpg"; // Default extension
        }

        // Create filename: 001_UserNickname_SubmissionId.jpg
        String fileName = String.format("%03d_%s_%d%s", 
            index,
            sanitizeFileName(submission.getUser().getNickname()),
            submission.getId(),
            extension
        );

        // Download original image directly from storage (bypassing CDN)
        byte[] imageData = downloadOriginalImageFromStorage(imageUrl);
        
        // Add to ZIP
        ZipEntry zipEntry = new ZipEntry(fileName);
        zipOut.putNextEntry(zipEntry);
        zipOut.write(imageData);
        zipOut.closeEntry();
    }

    /**
     * Download original image data directly from storage source
     * This method ensures we get the uncompressed original file by:
     * 1. For R2 storage: accessing the original file directly from R2 bucket
     * 2. For local storage: reading the original file from local filesystem
     * 3. Bypassing CDN URLs that may serve optimized/compressed versions
     */
    private byte[] downloadOriginalImageFromStorage(String imageUrl) throws IOException {
        logger.info("Downloading original image from storage: " + imageUrl);
        
        // Check if this is a CDN URL that needs to be converted to original storage path
        if (imageUrl.contains("img.munichweekly.art")) {
            // This is a CDN URL, extract the path and get original from storage
            String objectPath = extractObjectPathFromCdnUrl(imageUrl);
            return readOriginalFromStorage(objectPath);
        }
        
        // Handle direct storage URLs
        if (imageUrl.startsWith("/")) {
            // This is a relative path, read from local storage
            return readOriginalFromStorage(imageUrl);
        } else if (imageUrl.contains(".r2.dev/") || imageUrl.contains("r2.cloudflarestorage.com")) {
            // This is a direct R2 URL, extract path and read from storage
            String objectPath = extractObjectPathFromR2Url(imageUrl);
            return readOriginalFromStorage(objectPath);
        } else if (imageUrl.startsWith("http")) {
            // This might be a direct URL, but prefer storage access if possible
            try {
                String objectPath = extractObjectPathFromUrl(imageUrl);
                return readOriginalFromStorage(objectPath);
            } catch (Exception e) {
                // Fallback to direct URL download
                logger.warning("Failed to extract object path from URL, falling back to direct download: " + e.getMessage());
                return downloadFromUrl(imageUrl);
            }
        } else {
            // Treat as local file path
            return readOriginalFromStorage(imageUrl);
        }
    }
    
    /**
     * Read original file directly from storage using StorageService
     * This ensures we get the uncompressed original file
     */
    private byte[] readOriginalFromStorage(String objectPath) throws IOException {
        logger.info("Reading original file from storage: " + objectPath);
        
        // First try R2 storage if available (for production)
        if (r2StorageService != null) {
            logger.info("Using R2StorageService to read original file");
            try {
                // For R2, we need to construct the proper URL format
                String r2Url = constructR2Url(objectPath);
                logger.info("Attempting to read from R2 with URL: " + r2Url);
                
                byte[] r2Data = r2StorageService.getObjectBytes(r2Url);
                if (r2Data != null) {
                    logger.info("Successfully read original file from R2: " + objectPath + " (" + r2Data.length + " bytes)");
                    return r2Data;
                } else {
                    logger.warning("R2StorageService returned null for: " + objectPath);
                }
            } catch (Exception e) {
                logger.warning("Failed to read from R2: " + e.getMessage());
                // Continue to try local storage as fallback
            }
        }
        
        // Fallback to local storage
        logger.info("Attempting to read from local storage");
        String cleanPath = objectPath.startsWith("/") ? objectPath.substring(1) : objectPath;
        
        // Try different possible locations for local storage
        String[] possiblePaths = {
            "uploads/" + cleanPath,
            cleanPath,
            "../frontend/public/" + cleanPath,
            "./" + cleanPath
        };

        for (String possiblePath : possiblePaths) {
            Path path = Paths.get(possiblePath);
            if (Files.exists(path)) {
                logger.info("Reading original file from local storage: " + path);
                return Files.readAllBytes(path);
            }
        }
        
        throw new IOException("Original file not found in any storage location: " + objectPath);
    }
    
    /**
     * Construct proper R2 URL from object path
     * This method ensures we use the correct format for R2StorageService.getObjectBytes()
     */
    private String constructR2Url(String objectPath) {
        // Clean the path
        String cleanPath = objectPath.startsWith("/") ? objectPath.substring(1) : objectPath;
        
        // R2StorageService.getObjectBytes() expects either:
        // 1. A full R2 URL (with public base URL)
        // 2. An object key (path starting with "uploads/")
        
        // If it already starts with "uploads/", return as is
        if (cleanPath.startsWith("uploads/")) {
            return cleanPath;
        }
        
        // Otherwise, prepend "uploads/"
        return "uploads/" + cleanPath;
    }
    
    /**
     * Extract object path from CDN URL
     * Example: https://img.munichweekly.art/uploads/issues/1/submissions/file.jpg
     * Returns: uploads/issues/1/submissions/file.jpg
     */
    private String extractObjectPathFromCdnUrl(String cdnUrl) {
        String path = cdnUrl.replace("https://img.munichweekly.art/", "");
        // Remove query parameters
        int queryIndex = path.indexOf('?');
        if (queryIndex != -1) {
            path = path.substring(0, queryIndex);
        }
        return path;
    }
    
    /**
     * Extract object path from R2 URL
     * Example: https://pub-123.r2.dev/uploads/issues/1/submissions/file.jpg
     * Returns: uploads/issues/1/submissions/file.jpg
     */
    private String extractObjectPathFromR2Url(String r2Url) {
        // Find the bucket part and extract the object path
        String[] parts = r2Url.split("/");
        StringBuilder pathBuilder = new StringBuilder();
        boolean foundUploads = false;
        
        for (String part : parts) {
            if (foundUploads) {
                pathBuilder.append(part).append("/");
            } else if ("uploads".equals(part)) {
                foundUploads = true;
                pathBuilder.append(part).append("/");
            }
        }
        
        String path = pathBuilder.toString();
        if (path.endsWith("/")) {
            path = path.substring(0, path.length() - 1);
        }
        
        // Remove query parameters
        int queryIndex = path.indexOf('?');
        if (queryIndex != -1) {
            path = path.substring(0, queryIndex);
        }
        
        return path;
    }
    
    /**
     * Generic method to extract object path from any URL
     */
    private String extractObjectPathFromUrl(String url) {
        if (url.contains("img.munichweekly.art")) {
            return extractObjectPathFromCdnUrl(url);
        } else if (url.contains(".r2.dev/") || url.contains("r2.cloudflarestorage.com")) {
            return extractObjectPathFromR2Url(url);
        } else {
            // Try to extract path from generic URL
            try {
                URI uri = URI.create(url);
                String path = uri.getPath();
                if (path.startsWith("/")) {
                    path = path.substring(1);
                }
                return path;
            } catch (Exception e) {
                throw new RuntimeException("Unable to parse URL: " + url, e);
            }
        }
    }

    /**
     * Add a summary text file to the ZIP
     */
    private void addSummaryToZip(ZipOutputStream zipOut, List<Submission> submissions, 
                                int successCount, int failureCount, String issueTitle) throws IOException {
        StringBuilder summary = new StringBuilder();
        summary.append("Selected Submissions Summary\n");
        summary.append("===========================\n\n");
        summary.append("Issue: ").append(issueTitle).append("\n");
        summary.append("Total Selected: ").append(submissions.size()).append("\n");
        summary.append("Successfully Downloaded: ").append(successCount).append("\n");
        summary.append("Failed Downloads: ").append(failureCount).append("\n");
        summary.append("Generated: ").append(java.time.LocalDateTime.now()).append("\n\n");
        
        summary.append("Submission Details:\n");
        summary.append("==================\n");
        for (int i = 0; i < submissions.size(); i++) {
            Submission sub = submissions.get(i);
            summary.append(String.format("%03d. %s (ID: %d) - %s\n", 
                i + 1,
                sub.getUser().getNickname(),
                sub.getId(),
                sub.getDescription() != null ? sub.getDescription() : "No description"
            ));
        }

        ZipEntry summaryEntry = new ZipEntry("_SUMMARY.txt");
        zipOut.putNextEntry(summaryEntry);
        zipOut.write(summary.toString().getBytes("UTF-8"));
        zipOut.closeEntry();
    }



    /**
     * Read local file from storage
     */
    @SuppressWarnings("unused")
    private byte[] readLocalFile(String filePath) throws IOException {
        // Remove leading slash if present
        String cleanPath = filePath.startsWith("/") ? filePath.substring(1) : filePath;
        
        // Try different possible locations
        String[] possiblePaths = {
            "uploads/" + cleanPath,
            cleanPath,
            "../frontend/public/" + cleanPath
        };

        for (String possiblePath : possiblePaths) {
            Path path = Paths.get(possiblePath);
            if (Files.exists(path)) {
                return Files.readAllBytes(path);
            }
        }

        throw new IOException("File not found: " + filePath);
    }

    /**
     * Download file from HTTP URL (fallback method)
     */
    private byte[] downloadFromUrl(String urlString) throws IOException {
        logger.warning("Downloading from URL as fallback (may not be original quality): " + urlString);
        try {
            URI uri = URI.create(urlString);
            URL url = uri.toURL();
            try (InputStream in = url.openStream();
                 ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = in.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                }
                return out.toByteArray();
            }
        } catch (MalformedURLException e) {
            throw new IOException("Invalid URL format: " + urlString, e);
        }
    }

    /**
     * Get file extension from URL or filename
     */
    private String getFileExtension(String url) {
        if (url == null || url.isEmpty()) {
            return "";
        }
        
        // Remove query parameters
        int queryIndex = url.indexOf('?');
        if (queryIndex != -1) {
            url = url.substring(0, queryIndex);
        }
        
        int dotIndex = url.lastIndexOf('.');
        if (dotIndex != -1 && dotIndex < url.length() - 1) {
            return url.substring(dotIndex);
        }
        return "";
    }

    /**
     * Sanitize filename by removing invalid characters
     */
    private String sanitizeFileName(String fileName) {
        if (fileName == null) return "unknown";
        return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    /**
     * Clean up temporary files
     */
    public void cleanupTempFile(Path filePath) {
        try {
            Files.deleteIfExists(filePath);
            // Also try to delete parent directory if it's empty
            Path parent = filePath.getParent();
            if (parent != null && Files.exists(parent)) {
                try {
                    Files.deleteIfExists(parent);
                } catch (Exception e) {
                    // Ignore if directory is not empty
                }
            }
        } catch (IOException e) {
            logger.warning("Failed to cleanup temp file: " + filePath + " - " + e.getMessage());
        }
    }
} 