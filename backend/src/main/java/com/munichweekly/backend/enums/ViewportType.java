package com.munichweekly.backend.enums;

/**
 * Viewport types for responsive masonry layout calculation.
 * Matches the frontend breakpoint system for consistent behavior.
 */
public enum ViewportType {
    MOBILE("mobile", 2, 4, 165, 768),        // 2 columns, 4px gap, 165px column width, up to 768px screen
    TABLET("tablet", 2, 8, 250, 1024),       // 2 columns, 8px gap, 250px column width, 768-1024px screen
    DESKTOP("desktop", 4, 12, 340, 1920);    // 4 columns, 12px gap, 340px column width, 1024px+ screen

    private final String name;
    private final int defaultColumns;
    private final int defaultGap;
    private final int defaultColumnWidth;
    private final int maxScreenWidth;

    ViewportType(String name, int defaultColumns, int defaultGap, int defaultColumnWidth, int maxScreenWidth) {
        this.name = name;
        this.defaultColumns = defaultColumns;
        this.defaultGap = defaultGap;
        this.defaultColumnWidth = defaultColumnWidth;
        this.maxScreenWidth = maxScreenWidth;
    }

    public String getName() {
        return name;
    }

    public int getDefaultColumns() {
        return defaultColumns;
    }

    public int getDefaultGap() {
        return defaultGap;
    }

    public int getDefaultColumnWidth() {
        return defaultColumnWidth;
    }

    public int getMaxScreenWidth() {
        return maxScreenWidth;
    }

    /**
     * Determine viewport type from string parameter
     */
    public static ViewportType fromString(String viewportStr) {
        if (viewportStr == null) {
            return DESKTOP; // Default fallback
        }
        
        try {
            return ViewportType.valueOf(viewportStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return DESKTOP; // Default fallback for invalid values
        }
    }

    /**
     * Get the representative screen width for this viewport type
     * Used for responsive calculations that depend on screen width
     */
    public int getRepresentativeScreenWidth() {
        switch (this) {
            case MOBILE:
                return 480; // Representative mobile width
            case TABLET:
                return 768; // Representative tablet width
            case DESKTOP:
            default:
                return 1200; // Representative desktop width
        }
    }
} 