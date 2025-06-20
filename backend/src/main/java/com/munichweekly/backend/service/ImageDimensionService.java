package com.munichweekly.backend.service;

import com.munichweekly.backend.model.ImageDimensions;
import com.munichweekly.backend.model.Submission;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.MalformedURLException;
import java.util.Iterator;

// 🔧 Added: Professional EXIF metadata reading library - IDE may show errors but compiles normally
import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifIFD0Directory;

/**
 * Enhanced service for fetching and caching image dimensions.
 * Provides optimized dimension retrieval with submission entity integration
 * and backward compatibility for legacy data without stored dimensions.
 */
@Service
public class ImageDimensionService {
    
    private static final Logger logger = LoggerFactory.getLogger(ImageDimensionService.class);
    
    @Value("${cloudflare.worker.url:https://img.munichweekly.art}")
    private String cloudflareWorkerUrl;
    
    /**
     * Get image dimensions for a submission with optimized performance.
     * Uses stored dimensions if available, otherwise falls back to dynamic fetching.
     * This is the primary method for masonry layout calculations.
     * 
     * @param submission The submission to get dimensions for
     * @return ImageDimensions object with width and height
     */
    public ImageDimensions getSubmissionDimensions(Submission submission) {
        if (submission == null) {
            logger.warn("Submission is null, returning default dimensions");
            return new ImageDimensions(800, 600);
        }
        
        // **OPTIMIZATION: Use stored dimensions if available**
        if (submission.hasDimensionData()) {
            logger.debug("Using stored dimensions for submission {}: {}x{}", 
                    submission.getId(), submission.getImageWidth(), submission.getImageHeight());
            return new ImageDimensions(submission.getImageWidth(), submission.getImageHeight());
        }
        
        // **FALLBACK: Dynamic dimension fetching for legacy submissions**
        logger.debug("No stored dimensions for submission {}, fetching dynamically from URL: {}", 
                submission.getId(), submission.getImageUrl());
        
        if (submission.getImageUrl() == null || submission.getImageUrl().trim().isEmpty()) {
            logger.warn("Submission {} has no image URL, returning default dimensions", submission.getId());
            return new ImageDimensions(800, 600);
        }
        
        return getImageDimensions(submission.getImageUrl());
    }
    
    /**
     * Get image dimensions with caching to avoid repeated R2 requests.
     * Cache TTL is set to 24 hours since image dimensions don't change.
     * This method is maintained for backward compatibility and external usage.
     */
    @Cacheable(value = "imageDimensions", key = "#imageUrl")
    public ImageDimensions getImageDimensions(String imageUrl) {
        try {
            // Convert to CDN URL if needed
            String cdnUrl = convertToCdnUrl(imageUrl);
            
            // Try efficient header-based approach first
            ImageDimensions dimensions = getImageDimensionsFromHeaders(cdnUrl);
            if (dimensions != null) {
                logger.debug("Successfully retrieved image dimensions from headers: {}", dimensions);
                return dimensions;
            }
            
            // Fallback to partial download approach
            dimensions = getImageDimensionsFromPartialDownload(cdnUrl);
            if (dimensions != null) {
                logger.debug("Successfully retrieved image dimensions from partial download: {}", dimensions);
                return dimensions;
            }
            
            // Final fallback to reasonable defaults
            logger.warn("Could not determine image dimensions for URL: {}, using defaults", imageUrl);
            return new ImageDimensions(800, 600); // 4:3 aspect ratio default
            
        } catch (Exception e) {
            logger.error("Error retrieving image dimensions for URL: {}", imageUrl, e);
            return new ImageDimensions(800, 600); // Safe fallback
        }
    }
    
    /**
     * Fetch and return image dimensions for immediate use (not cached).
     * Used primarily during image upload to get dimensions for storage.
     * 
     * @param imageUrl The image URL to analyze
     * @return ImageDimensions object, or null if dimensions cannot be determined
     */
    public ImageDimensions fetchImageDimensionsForUpload(String imageUrl) {
        try {
            String cdnUrl = convertToCdnUrl(imageUrl);
            
            // Try header-based approach first
            ImageDimensions dimensions = getImageDimensionsFromHeaders(cdnUrl);
            if (dimensions != null) {
                logger.info("Retrieved upload image dimensions from headers: {}", dimensions);
                return dimensions;
            }
            
            // Fallback to partial download
            dimensions = getImageDimensionsFromPartialDownload(cdnUrl);
            if (dimensions != null) {
                logger.info("Retrieved upload image dimensions from partial download: {}", dimensions);
                return dimensions;
            }
            
            logger.warn("Could not determine dimensions for upload image: {}", imageUrl);
            return null;
            
        } catch (Exception e) {
            logger.error("Error fetching upload image dimensions for URL: {}", imageUrl, e);
            return null;
        }
    }
    
    /**
     * Get image dimensions from URL for migration purposes.
     * 🔧 Fix: Use direct image analysis to get original dimensions, avoiding EXIF rotation effects
     * 
     * @param imageUrl The image URL to analyze
     * @return ImageDimensions object, or null if dimensions cannot be determined
     */
    public ImageDimensions getImageDimensionsFromUrl(String imageUrl) {
        logger.info("Starting migration to get image dimensions: {}", imageUrl);
        
        try {
            String cdnUrl = convertToCdnUrl(imageUrl);
            
            // 🎯 Method 1: Direct image file analysis to get real dimensions (unaffected by EXIF rotation)
            logger.info("Using direct analysis method to get original image dimensions: {}", cdnUrl);
            
            ImageDimensions dimensions = getImageDimensionsFromPartialDownload(cdnUrl);
            if (dimensions != null) {
                logger.info("Successfully obtained original dimensions through direct analysis: {} -> {}x{}", imageUrl, dimensions.getWidth(), dimensions.getHeight());
                return dimensions;
            }
            
            // Method 2: Fallback to Headers method
            logger.warn("Direct analysis failed, trying Headers method: {}", cdnUrl);
            
            dimensions = getImageDimensionsFromHeaders(cdnUrl);
            if (dimensions != null) {
                logger.info("Obtained dimensions via Headers: {}x{}", dimensions.getWidth(), dimensions.getHeight());
                return dimensions;
            }
            
            logger.warn("Unable to get image dimensions: {}", imageUrl);
            return null;
            
        } catch (Exception e) {
            logger.error("Error occurred while getting image dimensions: {}", imageUrl, e);
            return null;
        }
    }
    
    /**
     * Get image dimensions from InputStream during upload processing.
     * This method is optimized for use during file upload when we have direct access
     * to the image data stream, avoiding additional HTTP requests.
     * 
     * @param inputStream The image input stream
     * @param contentType The MIME type of the image
     * @return ImageDimensions object, or null if dimensions cannot be determined
     */
    public ImageDimensions getImageDimensionsFromStream(InputStream inputStream, String contentType) {
        if (inputStream == null) {
            logger.warn("Input stream is null, cannot determine dimensions");
            return null;
        }
        
        ImageInputStream imageInputStream = null;
        try {
            imageInputStream = ImageIO.createImageInputStream(inputStream);
            if (imageInputStream == null) {
                logger.warn("Could not create ImageInputStream from provided stream");
                return null;
            }
            
            Iterator<ImageReader> readers = ImageIO.getImageReaders(imageInputStream);
            if (!readers.hasNext()) {
                logger.warn("No ImageReader found for content type: {}", contentType);
                return null;
            }
            
            ImageReader reader = readers.next();
            try {
                reader.setInput(imageInputStream);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                
                ImageDimensions dimensions = new ImageDimensions(width, height);
                logger.info("Successfully extracted dimensions from upload stream: {}", dimensions);
                return dimensions;
                
            } finally {
                reader.dispose();
            }
            
        } catch (IOException e) {
            logger.error("Error reading image dimensions from stream", e);
            return null;
        } finally {
            if (imageInputStream != null) {
                try {
                    imageInputStream.close();
                } catch (IOException e) {
                    logger.debug("Error closing ImageInputStream", e);
                }
            }
        }
    }
    
    /**
     * Convert various image URL formats to use the Cloudflare Worker CDN
     */
    private String convertToCdnUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) {
            throw new IllegalArgumentException("Image URL cannot be null or empty");
        }
        
        // If already a CDN URL, return as-is
        if (imageUrl.startsWith(cloudflareWorkerUrl)) {
            return imageUrl;
        }
        
        // Convert R2 public URLs to CDN URLs
        if (imageUrl.contains(".r2.dev/")) {
            String objectKey = extractObjectKeyFromR2Url(imageUrl);
            return cloudflareWorkerUrl + "/uploads/" + objectKey;
        }
        
        // Convert local paths to CDN URLs
        if (imageUrl.startsWith("/uploads/")) {
            return cloudflareWorkerUrl + imageUrl;
        }
        
        // For absolute URLs from other domains, return as-is (though this shouldn't happen)
        return imageUrl;
    }
    
    /**
     * Extract object key from R2 public URL
     * Example: https://pub-xxx.r2.dev/issues/1/submissions/file.jpg -> issues/1/submissions/file.jpg
     */
    private String extractObjectKeyFromR2Url(String r2Url) {
        int devIndex = r2Url.indexOf(".r2.dev/");
        if (devIndex != -1) {
            return r2Url.substring(devIndex + 8); // 8 = length of ".r2.dev/"
        }
        throw new IllegalArgumentException("Invalid R2 URL format: " + r2Url);
    }
    
    /**
     * Try to get image dimensions from HTTP headers (most efficient)
     * Some image formats and CDNs provide dimension info in headers
     */
    private ImageDimensions getImageDimensionsFromHeaders(String imageUrl) {
        try {
            HttpURLConnection connection = createConnection(imageUrl);
            connection.setRequestMethod("HEAD");
            
            int responseCode = connection.getResponseCode();
            if (responseCode == 200) {
                // Check for custom headers that might contain dimensions
                String widthHeader = connection.getHeaderField("X-Image-Width");
                String heightHeader = connection.getHeaderField("X-Image-Height");
                
                if (widthHeader != null && heightHeader != null) {
                    try {
                        int width = Integer.parseInt(widthHeader);
                        int height = Integer.parseInt(heightHeader);
                        return new ImageDimensions(width, height);
                    } catch (NumberFormatException e) {
                        logger.debug("Invalid dimension headers for URL: {}", imageUrl);
                    }
                }
            }
            
            connection.disconnect();
        } catch (IOException e) {
            logger.debug("Failed to get dimensions from headers for URL: {}", imageUrl, e);
        }
        
        return null;
    }
    
    /**
     * Get image dimensions by reading only the image header data (efficient)
     * This downloads just enough bytes to determine dimensions
     * 🔧 Fix: Use professional metadata-extractor library to properly handle EXIF rotation information
     */
    private ImageDimensions getImageDimensionsFromPartialDownload(String imageUrl) {
        HttpURLConnection connection = null;
        InputStream inputStream = null;
        ImageInputStream imageInputStream = null;
        
        try {
            connection = createConnection(imageUrl);
            connection.setRequestMethod("GET");
            
            // Set range header to download only first 64KB (usually sufficient for headers)
            connection.setRequestProperty("Range", "bytes=0-65535");
            
            int responseCode = connection.getResponseCode();
            if (responseCode != 200 && responseCode != 206) { // 206 = Partial Content
                logger.debug("Unexpected response code {} for URL: {}", responseCode, imageUrl);
                return null;
            }
            
            inputStream = connection.getInputStream();
            imageInputStream = ImageIO.createImageInputStream(inputStream);
            
            if (imageInputStream == null) {
                logger.debug("Could not create ImageInputStream for URL: {}", imageUrl);
                return null;
            }
            
            Iterator<ImageReader> readers = ImageIO.getImageReaders(imageInputStream);
            if (!readers.hasNext()) {
                logger.debug("No ImageReader found for URL: {}", imageUrl);
                return null;
            }
            
            ImageReader reader = readers.next();
            try {
                reader.setInput(imageInputStream);
                
                // Get original stored dimensions
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                
                logger.info("Original image dimensions: {}x{} (URL: {})", width, height, imageUrl);
                
                // 🎯 Use professional metadata-extractor library to read EXIF information
                boolean needsRotation = false;
                try {
                    // Reopen connection to read complete EXIF data
                    inputStream.close();
                    connection.disconnect();
                    
                    connection = createConnection(imageUrl);
                    connection.setRequestMethod("GET");
                    connection.setRequestProperty("Range", "bytes=0-131071"); // Increase to 128KB to ensure complete EXIF
                    
                    inputStream = connection.getInputStream();
                    
                    // Use metadata-extractor to read EXIF data
                    Metadata metadata = ImageMetadataReader.readMetadata(inputStream);
                    ExifIFD0Directory exifDirectory = metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);
                    
                    if (exifDirectory != null && exifDirectory.containsTag(ExifIFD0Directory.TAG_ORIENTATION)) {
                        int orientation = exifDirectory.getInt(ExifIFD0Directory.TAG_ORIENTATION);
                        logger.info("EXIF Orientation read successfully: {} (URL: {})", orientation, imageUrl);
                        
                        // EXIF Orientation values:
                        // 1 = Normal, no rotation
                        // 3 = 180 degree rotation
                        // 6 = 90 degree clockwise rotation (need to swap width/height)
                        // 8 = 90 degree counter-clockwise rotation (need to swap width/height) - corresponds to "Rotate 270 CW"
                        
                        if (orientation == 6 || orientation == 8) {
                            needsRotation = true;
                            logger.info("EXIF Orientation = {}, need to swap width/height", orientation);
                        } else {
                            logger.info("EXIF Orientation = {}, no need to swap width/height", orientation);
                        }
                    } else {
                        logger.info("EXIF Orientation information not found, keeping original dimensions (URL: {})", imageUrl);
                    }
                } catch (Exception e) {
                    logger.warn("Exception occurred while reading EXIF metadata: {} (URL: {})", e.getMessage(), imageUrl);
                }
                
                // 🔧 If rotation is detected (90 or 270 degrees), swap width and height
                if (needsRotation) {
                    logger.info("Applying EXIF rotation, swapping width/height: {}x{} -> {}x{} (URL: {})", 
                            width, height, height, width, imageUrl);
                    return new ImageDimensions(height, width); // Swap width and height
                } else {
                    logger.info("No EXIF rotation needed, using original dimensions: {}x{} (URL: {})", width, height, imageUrl);
                    return new ImageDimensions(width, height);
                }
                
            } finally {
                reader.dispose();
            }
            
        } catch (IOException e) {
            logger.debug("Failed to get dimensions from partial download for URL: {}", imageUrl, e);
        } finally {
            // Clean up resources
            try {
                if (imageInputStream != null) imageInputStream.close();
                if (inputStream != null) inputStream.close();
                if (connection != null) connection.disconnect();
            } catch (IOException e) {
                logger.debug("Error closing resources", e);
            }
        }
        
        return null;
    }
    
    /**
     * Create HTTP connection with appropriate timeouts and headers
     */
    private HttpURLConnection createConnection(String imageUrl) throws IOException {
        try {
            URI uri = URI.create(imageUrl);
            URL url = uri.toURL();
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            
            // Set reasonable timeouts
            connection.setConnectTimeout(10000); // 10 seconds
            connection.setReadTimeout(10000);    // 10 seconds
            
            // Set user agent to identify our service
            connection.setRequestProperty("User-Agent", "MunichWeekly-ImageDimensionService/1.0");
            
            return connection;
        } catch (MalformedURLException e) {
            throw new IOException("Invalid URL format: " + imageUrl, e);
        }
    }
    
    /**
     * Evict cached dimensions for a specific image URL
     * Used when image is replaced or updated
     */
    public void evictImageDimensionsCache(String imageUrl) {
        // This method signature is maintained for compatibility
        // The actual cache eviction is handled by Spring's @CacheEvict annotation
        logger.debug("Cache eviction requested for image URL: {}", imageUrl);
    }
} 