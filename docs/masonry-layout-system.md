# Munich Weekly - Masonry Layout System

## Overview

Munich Weekly implements a **hybrid masonry layout system** for displaying photo submissions in a Pinterest-style grid. The system combines backend optimization with frontend responsiveness:

- **Backend**: Calculates optimal item ordering using advanced algorithms
- **Frontend**: Handles responsive positioning with Skyline algorithm
- **Benefits**: Quality guarantee from backend + Performance guarantee from frontend

## Architecture

### Current Implementation: Hybrid Approach

The masonry layout system consists of three core components:

1. **MasonryGallery** - Main display component with absolute positioning
2. **useSkylineMasonryLayout** - Frontend positioning with backend ordering
3. **useImageDimensions** - Batch image dimension loading with caching

### Data Flow

```
Backend: Optimal Ordering → Frontend: Responsive Positioning
```

1. **Frontend requests**: `/api/layout/order?issueId=${id}`
2. **Backend returns**: `{ orderedIds2col: [...], orderedIds4col: [...] }`
3. **Frontend applies**: Skyline algorithm for pixel-perfect positioning
4. **Result**: Optimal layout across all devices

## Core Features

### Backend Ordering Service

**High-Quality Algorithm Features:**
- **Dynamic Item Selection**: Greedy Best-Fit with weighted scoring
- **Wide Image Limiting**: Prevents consecutive wide image placement
- **Balanced Distribution**: Ensures fair alternation between wide and narrow images
- **Dual Column Support**: Optimized orderings for 2-col and 4-col layouts

### Frontend Skyline Positioning

**Responsive Layout Features:**
- **Dynamic Column Height Tracking** - Real-time calculation
- **Absolute Positioning** - Precise pixel-level placement
- **Wide Image Spanning** - Aspect ratio ≥16:9 spans 2 columns automatically
- **Responsive Design** - 2 columns mobile, 4 columns desktop

### Content Height Calculation

**Synchronized Algorithm (Frontend ↔ Backend):**
```typescript
// Wide images: larger font, more space, up to 3 lines
if (isWide) {
  const fontSizeBase = isTabletOrLarger ? 20 : 16; // text-base/lg
  const maxLines = 3;
  const charsPerLine = Math.floor(realWidth / (fontSizeBase * 0.6));
  const estimatedLines = Math.min(maxLines, Math.ceil(titleLength / charsPerLine));
  titleHeight = estimatedLines * (fontSizeBase + 4) + 8;
}

// Regular images: smaller font, 2 lines max  
else {
  const fontSizeBase = isTabletOrLarger ? 16 : 14; // text-sm/base
  const maxLines = 2;
  const charsPerLine = Math.floor(realWidth / (fontSizeBase * 0.6));
  const estimatedLines = Math.min(maxLines, Math.ceil(titleLength / charsPerLine));
  titleHeight = estimatedLines * (fontSizeBase + 4) + 8;
}
```

**Total Height**: `imageHeight + basePadding + titleHeight + metadataHeight + safetyMargin`

## Implementation

### Skyline Hook: useSkylineMasonryLayout

**Input Parameters:**
- `items`: Array of data items to layout
- `issueId`: Required for backend ordering API
- `config`: Layout configuration (responsive breakpoints, gaps)
- `getDimensions`: Function to extract image dimensions

**Output:**
- `layoutItems`: Array with (x, y) coordinates and dimensions
- `containerHeight`: Total height needed
- `isLayoutReady`: Boolean for loading state
- `orderingSource`: '2col' | '4col' | 'fallback'

### Caching Strategy

**Backend Caching:**
- Results cached per `issueId`
- Cache includes ordering quality metadata
- Automatic invalidation on submission changes

**Frontend Caching:**
- Image dimensions cached for 24 hours
- Layout calculations cached until data changes
- Progressive loading with batch optimization

## Component Integration

### MasonryGallery Component

**Required Props:**
```typescript
<MasonryGallery
  issueId={issueId}                    // Required for backend ordering
  items={submissions}
  getImageUrl={(item) => item.imageUrl}
  getSubmissionId={(item) => item.id}  // Required for ordering lookup
  renderItem={(item, isWide, aspectRatio) => <Card ... />}
/>
```

### MasonrySubmissionCard Integration

**Wide Image Handling:**
- Dynamic text sizing based on `isWide` prop
- Content height synchronized with backend calculation
- Responsive typography: wide images use larger fonts

## Configuration

### Responsive Container Configuration

```typescript
const CONTAINER_CONFIG = {
  voteMasonry: {
    // Dynamic width calculation
    margins: { mobile: 8, tablet: 16, desktop: 24 },
    gap: { mobile: 4, tablet: 8, desktop: 12 },
    columns: { mobile: 2, tablet: 2, desktop: 4 }
  }
}
```

**Dynamic Width Calculation:**
- Container: `max-w-[1600px]` with responsive margins
- Column width: `(containerWidth - totalGaps) / columnCount`
- Perfect space utilization across all devices

## Migration Benefits

### Before: Multiple Competing Approaches
- Frontend-only masonry (performance issues)
- Backend full-calculation (responsiveness issues)
- Complex configuration management

### After: Unified Hybrid System
- **Single Source of Truth**: One ordering algorithm
- **Optimal Performance**: Backend quality + Frontend speed
- **Simplified API**: No viewport parameters needed
- **60%+ Code Reduction**: Removed redundant implementations

## Troubleshooting

### Layout Issues
- Verify `issueId` and `getSubmissionId` props are provided
- Check image URL processing in `getImageUrl` utility
- Monitor ordering API response in network tab

### Performance Issues
- Check batch loading size for large image sets
- Verify ordering cache is working (check `isFromCache`)
- Monitor container width calculations

## Related Documentation

- **[Frontend Architecture](./frontend-architecture.md)** - Overall structure
- **[UI Components](./ui-components.md)** - Component library
- **[Style System](./style-system.md)** - Styling conventions

---

*This hybrid masonry system provides optimal visual presentation with guaranteed performance across all devices and screen sizes.* 