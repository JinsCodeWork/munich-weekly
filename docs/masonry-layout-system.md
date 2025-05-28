# Munich Weekly - Masonry Layout System

## Overview

Munich Weekly implements an advanced JavaScript-based masonry layout system for displaying photo submissions in a Pinterest-style grid. This system replaced the previous simple grid layout, providing dynamic column height calculation, wide image spanning, and optimal space utilization through intelligent item placement algorithms.

## Architecture Overview

The masonry layout system consists of three core components working together:

1. **MasonryGallery** - Main display component with absolute positioning
2. **useMasonryLayout** - Core layout calculation hook with Greedy Best-Fit algorithm  
3. **useImageDimensions** - Batch image dimension loading with caching

## Core Features

### JavaScript-Based Dynamic Layout

Unlike CSS-based solutions (CSS Grid or CSS Columns), this system uses JavaScript for pixel-perfect layout calculation:

- **Dynamic Column Height Tracking** - Real-time calculation of each column's height
- **Absolute Positioning** - Precise pixel-level item placement 
- **Wide Image Spanning** - Images with aspect ratio ≥16:9 automatically span 2 columns
- **Responsive Design** - 2 columns on mobile, 4 columns on desktop
- **Gap Management** - Consistent spacing between items

### Greedy Best-Fit Algorithm with Wide Image Limiting

The system implements an enhanced intelligent item placement algorithm that minimizes gaps, maximizes visual appeal, and ensures balanced distribution of wide and narrow images:

**Enhanced Algorithm Features:**
- **Dynamic Item Selection**: Chooses items from remaining pool based on optimal Y position
- **Wide Image Streak Limiting**: Prevents consecutive wide image placement
- **Adaptive Candidate Filtering**: Forces narrow image insertion when needed
- **Balanced Layout Distribution**: Ensures fair alternation between wide and narrow images

**Wide Image Limiting Mechanism:**
```typescript
let wideStreak = 0;           // Counter for consecutive wide images
const maxWideStreak = 1;      // Maximum consecutive wide images allowed

// If too many consecutive wide images and narrow images available,
// limit candidates to narrow images only
if (wideStreak >= maxWideStreak && pool.some(item => !item.isWide)) {
  candidates = pool.filter(item => !item.isWide);
}
```

**Algorithm Flow:**
1. **Wide Image Placement**: Increment `wideStreak` counter
2. **Streak Check**: If `wideStreak >= maxWideStreak` and narrow images available
3. **Forced Insertion**: Next iteration considers only narrow images
4. **Narrow Image Placement**: Reset `wideStreak = 0`
5. **Balanced Alternation**: Continues optimal placement with fair distribution

### Wide Image Detection and Handling

**Automatic Detection:**
- Threshold: aspect ratio ≥ 16:9 (1.778)
- Common wide formats: 16:9, 21:9, ultra-wide panoramas

**Smart Spanning Logic:**
- Wide images span 2 columns automatically
- Column availability checking before placement
- Fallback to single column on mobile when space is limited

### Intelligent Content Height Calculation

The system calculates total card height including image and content areas:

**Dynamic Text Height Analysis:**
```typescript
// Wide images: larger font, more lines allowed
if (isWide) {
  const fontSizeBase = screenWidth >= breakpoint ? 20 : 16; // text-base/lg
  const maxLines = 3;
  const charsPerLine = Math.floor(realWidth / (fontSizeBase * 0.6));
  const estimatedLines = Math.min(maxLines, Math.ceil(titleLength / charsPerLine));
  titleHeight = estimatedLines * (fontSizeBase + 4) + 8;
}

// Regular images: smaller font, 2 lines max  
else {
  const fontSizeBase = screenWidth >= breakpoint ? 16 : 14; // text-sm/base
  const maxLines = 2;
  const charsPerLine = Math.floor(realWidth / (fontSizeBase * 0.6));
  const estimatedLines = Math.min(maxLines, Math.ceil(titleLength / charsPerLine));
  titleHeight = estimatedLines * (fontSizeBase + 4) + 8;
}
```

**Total Height Calculation:**
- Image height: `realWidth / aspectRatio`
- Content height: padding + title + metadata + safety margin
- Prevents card overlapping and maintains proper spacing

## Technical Implementation

### Core Hook: useMasonryLayout

**Input Parameters:**
- `items`: Array of data items to layout
- `config`: Layout configuration (column width, gap, breakpoints)
- `getDimensions`: Function to extract image dimensions

**Output:**
- `layoutItems`: Array of positioned items with x, y coordinates
- `containerHeight`: Total height needed for the layout
- `isLayoutReady`: Boolean indicating when layout calculation is complete

**Algorithm Flow:**
1. **Preparation Phase**: Calculate real render dimensions for each item
2. **Pool Creation**: Create array of items available for placement
3. **Best-Fit Selection**: For each position, find item with lowest Y placement
4. **Absolute Positioning**: Calculate exact x, y coordinates
5. **Height Update**: Update column heights for affected columns

### Image Dimension Management

**Batch Loading with Caching:**
```typescript
const {
  dimensions,
  loadingProgress,
  isAllLoaded,
  errors,
  retryFailedImages,
} = useImageDimensions(imageUrls);
```

**Features:**
- Concurrent loading with controlled batch sizes
- 24-hour browser cache for dimension data
- Progress tracking (0-100%)
- Error handling and retry mechanisms
- Memory-efficient Map-based storage

### Container System Integration

**Responsive Container Configuration:**
```typescript
export const CONTAINER_CONFIG = {
  masonry: {
    columnWidth: 300,  // Optimized card width
    gap: 20,          // Consistent spacing
    columns: {
      mobile: 2,      // 2 columns on mobile
      desktop: 4,     // 4 columns on desktop
    }
  }
} as const;
```

**Mathematical Precision:**
- Container width: 1400px maximum
- Content width: 4×300 + 3×20 = 1260px
- Horizontal margins: (1400-1260)/2 = 70px each side
- Prevents content overflow and maintains centering

### Multi-Configuration System

Munich Weekly implements specialized masonry configurations optimized for different page contexts and user experiences:

#### Vote Page Configuration - Dynamic Column Width
```typescript
voteMasonry: {
  // Dynamic width calculation based on container
  adaptiveColumnWidth: true,    // Enable dynamic calculation
  margins: {
    mobile: 8,      // px-2 for comfortable mobile spacing
    tablet: 16,     // md:px-4 for balanced tablet layout
    desktop: 24,    // lg:px-6 for professional desktop appearance
  },
  gap: {
    mobile: 4,      // Compact mobile spacing for content density
    tablet: 8,      // Balanced tablet spacing
    desktop: 12,    // Optimized desktop spacing
  },
  columns: { mobile: 2, tablet: 2, desktop: 4 }
}
```

**Dynamic Width Calculation:**
- Container width: `max-w-[1600px]` with responsive margins
- Effective width: `containerWidth - (margin × 2)`
- Column width: `(effectiveWidth - totalGaps) / columnCount`
- Result: Perfect space utilization with symmetric margins

#### Account Pages Configuration  
```typescript
accountMasonry: {
  columnWidth: {
    mobile: 160,    // Compact mobile layout for sidebar context
    tablet: 180,    // Medium tablet sizing
    desktop: 240,   // Optimized for account page sidebar layout
  },
  gap: {
    mobile: 8,      // Minimal gap for maximum content density
    tablet: 12,     // Progressive gap increase
    desktop: 16,    // Professional spacing
  },
  columns: { mobile: 2, tablet: 2, desktop: 4 }
}
```

#### Responsive Algorithm Enhancement

**Three-Breakpoint System:**
- **Mobile** (<768px): Optimized for single-hand usage and portrait orientation
- **Tablet** (768px-1024px): Balanced layout for medium screens and landscape tablets
- **Desktop** (≥1024px): Full-featured layout with maximum visual impact

**Dynamic Configuration Selection:**
```typescript
// Hook automatically selects appropriate configuration
const currentColumnWidth = useMemo(() => {
  if (screenWidth < mobileBreakpoint) return config.columnWidth.mobile;
  if (screenWidth < tabletBreakpoint) return config.columnWidth.tablet;
  return config.columnWidth.desktop;
}, [screenWidth, config]);
```

**Benefits of Multi-Configuration Approach:**
- **Content-Specific Optimization**: Each page context gets layout parameters optimized for its specific needs
- **Improved Mobile Experience**: Smaller gaps and appropriate column widths for mobile content consumption
- **Professional Desktop Layout**: Larger images and generous spacing for desktop photography viewing
- **Flexible Architecture**: Easy to add new configurations for future page types

## Component Integration

### MasonryGallery Component

**Props Interface:**
```typescript
interface MasonryGalleryProps<T> {
  items: T[];
  getImageUrl: (item: T) => string;
  renderItem: (item: T, isWide: boolean, aspectRatio: number) => React.ReactNode;
  className?: string;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  errorComponent?: (errors: string[], onRetry: () => void) => React.ReactNode;
  onItemClick?: (item: T) => void;
}
```

**Usage Example:**
```tsx
<MasonryGallery
  items={submissions}
  getImageUrl={(submission) => submission.imageUrl}
  renderItem={(submission, isWide, aspectRatio) => (
    <MasonrySubmissionCard
      submission={submission}
      isWide={isWide}
      aspectRatio={aspectRatio}
      displayContext="voteView"
    />
  )}
  onItemClick={handleSubmissionClick}
/>
```

### MasonrySubmissionCard Integration

**Wide Image Handling:**
- Receives `isWide` prop for conditional styling
- Adjusts text size: wide images use larger fonts
- Dynamic line clamping: 3 lines for wide, 2 for regular
- Responsive text size based on available width

**Aspect Ratio Integration:**
- Uses provided `aspectRatio` for container styling
- Maintains proper image proportions
- Prevents layout shifts during loading

## Performance Optimizations

### Loading States and Error Handling

**Progressive Loading:**
- Shows skeleton while images load
- Progress indicator with percentage
- Graceful error handling for failed images
- Retry mechanism for failed loads

**Memory Management:**
- Efficient dimension caching system
- Cleanup of event listeners on unmount
- Optimized re-render cycles

### Responsive Performance

**Breakpoint Management:**
- Single breakpoint at 768px for tablet optimization
- Efficient column count recalculation
- Minimal re-layouts on resize

## Pages Using Masonry Layout

### Vote Page (`/vote`)
- **Context**: Public voting interface
- **Features**: Vote buttons, anonymous voting support
- **Layout**: 4 columns desktop, 2 columns mobile
- **Special handling**: Previous results view with read-only cards

### User Submissions Page (`/account/submissions`)
- **Context**: Personal submission management
- **Features**: Management mode with delete buttons
- **Layout**: Same responsive grid configuration
- **Special handling**: Overlay delete buttons in management mode

### Test Page (`/test-masonry`)
- **Context**: Development testing and debugging
- **Features**: Multiple layout configurations for testing
- **Layout**: Various column counts and configurations
- **Special handling**: Debug information and layout statistics

## Configuration and Customization

### Layout Configuration

**Default Configuration:**
```typescript
const DEFAULT_CONFIG: MasonryConfig = {
  columnWidth: 300,
  gap: 20,
  wideImageThreshold: 16 / 9,
  mobileColumns: 2,
  desktopColumns: 4,
  breakpoint: 768,
};
```

**Customization Options:**
- Column width adjustment for different card sizes
- Gap modification for spacing preferences  
- Threshold tuning for wide image detection
- Breakpoint adjustment for responsive behavior

### Styling Integration

**Container Variants:**
- Uses centralized container system
- Viewport overflow protection
- Mathematical precision for layout bounds

**Card Styling:**
- Dynamic text sizing based on image width
- Consistent spacing and typography
- Hover effects and interactive states

## Migration from Previous System

### Before: Simple Grid Layout
- CSS Grid with fixed column structure
- No wide image support
- Manual gap management
- Limited responsive options

### After: Dynamic Masonry Layout
- JavaScript-calculated positioning
- Automatic wide image spanning
- Intelligent gap filling
- Advanced responsive design

### Migration Benefits
- **Better Space Utilization**: Gaps are filled optimally
- **Enhanced Visual Appeal**: Wide images create visual interest
- **Improved User Experience**: Smoother loading with progress indicators
- **Greater Flexibility**: Easy customization and configuration

## Troubleshooting and Debugging

### Common Issues

**Images Not Loading:**
- Check image URL processing in `getImageUrl` utility
- Verify CORS settings for external images
- Enable error retry mechanism

**Layout Calculation Errors:**
- Ensure all images have valid dimensions
- Check for zero-width or zero-height images
- Verify aspect ratio calculations

**Performance Issues:**
- Monitor batch loading size for large image sets
- Check for memory leaks in dimension caching
- Optimize re-render cycles

### Debug Tools

**Development Logging:**
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('MasonryLayout Debug:', {
    totalItems,
    loadedItems,
    layoutReady: isLayoutReady,
    containerHeight,
  });
}
```

**Test Page Utilities:**
- Layout statistics display
- Column count verification
- Aspect ratio analysis
- Performance metrics

## Future Enhancements

### Planned Improvements
- **Virtual Scrolling**: For handling large image sets
- **Lazy Loading**: Progressive image loading as user scrolls
- **Animation Support**: Smooth transitions during layout changes
- **Column Balancing**: Advanced algorithms for even column heights

### Configuration Extensions
- **Custom Breakpoints**: Multiple responsive breakpoints
- **Variable Column Widths**: Different column sizes within same layout
- **Advanced Spacing**: Non-uniform gaps and margins

## Related Documentation

- **[Frontend Architecture](./frontend-architecture.md)** - Overall frontend structure
- **[UI Components](./ui-components.md)** - Component library documentation
- **[Style System](./style-system.md)** - Styling framework and conventions
- **[Storage System](./storage.md)** - Image storage and processing
- **[Image CDN System](./image-cdn.md)** - Image optimization and delivery

---

*This masonry layout system provides the foundation for Munich Weekly's visual presentation of photography submissions, ensuring optimal display across all devices and screen sizes.* 