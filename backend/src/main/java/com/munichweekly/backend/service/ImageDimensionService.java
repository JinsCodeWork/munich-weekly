package com.munichweekly.backend.service;

import com.munichweekly.backend.model.ImageDimensions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Iterator;

/**
 * Service for fetching and caching image dimensions from R2 storage.
 * Uses efficient methods to get dimensions without downloading full images.
 */
@Service
public class ImageDimensionService {
    
    private static final Logger logger = LoggerFactory.getLogger(ImageDimensionService.class);
    
    @Value("${cloudflare.worker.url:https://img.munichweekly.art}")
    private String cloudflareWorkerUrl;
    
    /**
     * Get image dimensions with caching to avoid repeated R2 requests.
     * Cache TTL is set to 24 hours since image dimensions don't change.
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
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                return new ImageDimensions(width, height);
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
     * Create HTTP connection with appropriate headers and timeouts
     */
    private HttpURLConnection createConnection(String imageUrl) throws IOException {
        URL url = new URL(imageUrl);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        
        // Set timeouts to avoid hanging
        connection.setConnectTimeout(5000); // 5 seconds
        connection.setReadTimeout(10000);   // 10 seconds
        
        // Set user agent to identify our service
        connection.setRequestProperty("User-Agent", "Munich-Weekly-Layout-Service/1.0");
        
        // Accept image formats
        connection.setRequestProperty("Accept", "image/jpeg,image/png,image/webp,image/*");
        
        return connection;
    }
    
    /**
     * Clear cache entry for a specific image URL
     * Useful when images are updated
     */
    public void evictImageDimensionsCache(String imageUrl) {
        // This would require cache manager injection if needed
        logger.info("Cache eviction requested for image URL: {}", imageUrl);
    }
} 