package com.munichweekly.backend.model;

/**
 * Represents image dimensions for masonry layout calculations.
 * Used to cache image width/height data to avoid repeated R2 requests.
 */
public class ImageDimensions {
    
    private final int width;
    private final int height;
    private final double aspectRatio;
    
    public ImageDimensions(int width, int height) {
        if (width <= 0 || height <= 0) {
            throw new IllegalArgumentException("Image dimensions must be positive values");
        }
        
        this.width = width;
        this.height = height;
        this.aspectRatio = (double) width / height;
    }
    
    public int getWidth() {
        return width;
    }
    
    public int getHeight() {
        return height;
    }
    
    public double getAspectRatio() {
        return aspectRatio;
    }
    
    /**
     * Determine if this image is considered "wide" based on the given threshold
     * @param threshold The aspect ratio threshold (e.g., 16/9 = 1.778)
     * @return true if aspect ratio >= threshold
     */
    public boolean isWide(double threshold) {
        return aspectRatio >= threshold;
    }
    
    /**
     * Calculate the height of this image when rendered at a specific width
     * while maintaining aspect ratio
     */
    public int getHeightAtWidth(int targetWidth) {
        return (int) Math.round(targetWidth / aspectRatio);
    }
    
    /**
     * Calculate the width of this image when rendered at a specific height
     * while maintaining aspect ratio
     */
    public int getWidthAtHeight(int targetHeight) {
        return (int) Math.round(targetHeight * aspectRatio);
    }
    
    @Override
    public String toString() {
        return String.format("ImageDimensions{width=%d, height=%d, aspectRatio=%.3f}", 
                           width, height, aspectRatio);
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        
        ImageDimensions that = (ImageDimensions) obj;
        return width == that.width && height == that.height;
    }
    
    @Override
    public int hashCode() {
        return 31 * width + height;
    }
} 