# 🖼️ Image CDN System Documentation

This document describes the image optimization and delivery architecture for the Munich Weekly photography platform, implemented using Cloudflare Workers and Image Resizing.

## Overview

The Munich Weekly platform utilizes a sophisticated image delivery pipeline that provides:

1. **On-demand image optimization** - Resize, compress and convert images as needed
2. **Format-aware delivery** - Serve modern formats (WebP, AVIF) to supported browsers
3. **Responsive loading** - Deliver appropriately sized images for different devices
4. **Bandwidth optimization** - Minimize data transfer with smart loading strategies
5. **Security layer** - Hide direct R2 access behind a CDN abstraction

This system ensures fast loading times while maintaining high image quality and efficient resource utilization.

---

## Architecture

The image delivery architecture consists of three main components:

1. **Storage Layer** - Cloudflare R2 bucket containing original high-resolution images
2. **Processing Layer** - Cloudflare Worker that handles image retrieval and transformation
3. **Delivery Layer** - Cloudflare's global CDN that caches and serves optimized images

### Flow Diagram

```
┌────────────┐    Request    ┌────────────┐    If not in cache    ┌────────────┐
│  Browser/  │ ────────────> │ Cloudflare │ ───────────────────> │  Worker    │
│  Client    │               │    CDN     │                      │            │
└────────────┘               └────────────┘                      └─────┬──────┘
                                   ^                                   │
                                   │                                   v
                                   │                            ┌────────────┐
                                   │       Optimized Image      │    R2      │
                                   └───────────────────────────┤  Storage    │
                                                               └────────────┘
```

---

## Cloudflare Worker Implementation

The Worker acts as a middleware between the CDN and R2 storage, processing image requests and applying transformations.

### Key Functions

- **Path Parsing** - Extract object keys from URL paths
- **Parameter Processing** - Parse and validate transformation parameters
- **Format Detection** - Determine optimal output format based on client capabilities
- **R2 Integration** - Retrieve original images from private storage
- **Error Handling** - Provide graceful fallbacks for missing images or invalid requests
- **Caching Configuration** - Set appropriate cache headers for optimized delivery

### Code Structure

The Worker code is organized into modular functions:

- `handleImageRequest()` - Main entry point for image processing requests
- `getImageFromR2()` - Retrieves images from R2 storage
- `extractImageParams()` - Parses URL query parameters
- `detectBestImageFormat()` - Analyzes Accept headers for format selection
- `setDefaultImageParams()` - Applies sensible defaults to processing parameters
- `handleHealthCheck()` - Provides status information for monitoring

### Content Type Handling

The Worker includes sophisticated content type handling to ensure proper image processing:

- Auto-detection of image MIME types based on file extensions
- Fallback to standard image types when content type information is missing
- Explicit content type headers for processed images

---

## URL Structure and Parameters

Images are requested using a standardized URL structure:

```
https://img.munichweekly.art/uploads/issues/{issueId}/submissions/{fileName}?[parameters]
```

### Transformation Parameters

| Parameter | Description | Example Values | Default |
|-----------|-------------|----------------|---------|
| `width` | Target width in pixels | `300`, `800` | Original width |
| `height` | Target height in pixels | `200`, `600` | Original height |
| `quality` | Compression level (1-100) | `80`, `95` | `85` |
| `fit` | Resizing behavior | `cover`, `contain`, `scale-down` | `scale-down` |
| `format` | Output format | `auto`, `webp`, `avif`, `jpeg`, `png` | `auto` |
| `dpr` | Device pixel ratio | `1`, `2`, `3` | Browser default |

### Example URLs

**Thumbnail in list view:**
```
/uploads/issues/1/submissions/2_5.jpg?width=300&height=200&quality=80&fit=cover
```

**Medium-sized image with maintained aspect ratio:**
```
/uploads/issues/1/submissions/2_5.jpg?width=800&format=auto&quality=85
```

**Full-size high-quality viewing:**
```
/uploads/issues/1/submissions/2_5.jpg?quality=95&format=auto
```

---

## Frontend Integration

The frontend uses utility functions and components to work with the image CDN:

### Utility Functions

**`getImageUrl()`** - Transforms storage URLs to CDN URLs:
```typescript
export function getImageUrl(url: string): string {
  // For R2 public URLs, convert to CDN URLs
  if (url.includes('.r2.dev/')) {
    const objectKey = extractObjectKey(url);
    return `https://img.munichweekly.art/uploads/${objectKey}`;
  }

  // For local paths, add CDN domain in production
  if (url.startsWith('/uploads/')) {
    return isProduction
      ? `https://img.munichweekly.art${url}`
      : url;
  }

  return url;
}
```

**`createImageUrl()`** - Adds transformation parameters based on context:
```typescript
export function createImageUrl(url: string, options: ImageOptions = {}): string {
  const baseUrl = getImageUrl(url);

  if (Object.keys(options).length === 0) {
    return baseUrl;
  }

  const params = new URLSearchParams();
  if (options.width) params.append('width', options.width.toString());
  if (options.height) params.append('height', options.height.toString());
  // ... other parameters

  return `${baseUrl}?${params.toString()}`;
}
```

### React Components

**Thumbnail Component**
Advanced thumbnail component with intelligent aspect ratio handling and responsive positioning:
```tsx
<Thumbnail
  src={imageUrl}
  width={300}
  height={200}
  objectFit="contain"  // Smart selection based on aspect ratio
  objectPosition="top" // Responsive positioning (top on desktop, center on mobile)
  quality={80}
  useImageOptimization={true}
  autoDetectAspectRatio={true}
  preserveAspectRatio={true}
/>
```

**Key Features:**
- **Intelligent Object Fit**: Automatically selects `contain` for landscape images and `cover` for portraits
- **Responsive Positioning**: Desktop uses top-alignment for non-16:9 landscapes, mobile centers all images
- **Precise Aspect Ratio Detection**: 16:9 detection with ±0.08 tolerance, other ratios with ±0.1 tolerance
- **Type-safe Configuration**: Full TypeScript support with comprehensive prop validation

**ImageViewer Component**
Designed for full-size viewing with high quality and original aspect ratio:
```tsx
<ImageViewer
  imageUrl={imageUrl}
  description={description}
  isOpen={isViewerOpen}
  onClose={handleCloseViewer}
/>
```

---

## On-Demand Loading Strategy

The platform uses a strategic approach to image loading that balances quality with performance:

### Thumbnail View (List/Grid)
- Lower resolution (typically 300×200px)
- Medium quality compression (80%)
- Cropped to fit display area (fit=cover)
- Format auto-detection based on browser support

### Detail View (Single Image)
- Higher resolution (up to screen constraints)
- Higher quality compression (95%)
- Maintain aspect ratio (fit=contain)
- Format auto-detection for optimal quality/size ratio

This approach ensures that:
1. Initial page loads are fast, with minimal bandwidth usage
2. Original high-quality images are only loaded when explicitly requested
3. Images are appropriately sized for the viewing context

---

## Deployment and Configuration

### Worker Deployment

The Image Worker requires Node.js 22 or newer and is deployed using Wrangler,
Cloudflare's command-line tool:

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy the worker
cd image-worker
wrangler deploy
```

### Worker Configuration (wrangler.toml)

```toml
name = "image-worker"
main = "src/index.js"
compatibility_date = "2025-05-19"

[observability]
enabled = true

[[r2_buckets]]
binding = "PHOTO_BUCKET"
bucket_name = "munichweekly-photoupload"
preview_bucket_name = "munichweekly-photoupload"

[vars]
BUCKET_NAME = "munichweekly-photoupload"
```

Debug routes are disabled by default. For local diagnostics only, set
`DEBUG_ROUTES_ENABLED=true` and configure a `DEBUG_AUTH_SECRET` of at least 32
characters in the Worker environment, then send it as the `x-debug-secret`
request header. Do not put debug secrets in query strings.

### Custom Domain Configuration

To use a custom domain (e.g., img.munichweekly.art):

1. Add the domain to your Cloudflare account
2. Create a CNAME record pointing to your Worker
3. Configure the Worker route pattern in the Cloudflare dashboard:
   - Route: `img.munichweekly.art/*`
   - Worker: `image-worker`

---

## Performance Considerations

### Caching Strategy

The Worker implements the following caching strategy:

- **Cache Duration**: 24 hours (86400 seconds) for transformed images
- **Cache Validation**: ETag headers for cache revalidation
- **Vary Header**: Used with format=auto to cache different formats
- **Cache Keys**: Include all transformation parameters

### Bandwidth Optimization

Bandwidth usage is minimized through:

- Serving appropriately sized images for different contexts
- Using modern formats (WebP, AVIF) when supported
- Applying context-appropriate quality levels
- Avoiding unnecessary loading of full-resolution images

---

## Security Considerations

The image CDN adds several security benefits:

1. **Origin Hiding** - R2 bucket details are not exposed to clients
2. **Access Control** - Worker can implement custom authorization logic
3. **Request Validation** - Parameters are validated before processing
4. **Resource Limits** - Prevents abuse through size and request limits
5. **CORS Control** - Worker manages cross-origin resource sharing policies

---

## Monitoring and Debugging

### Health Endpoint

The Worker provides a `/health` endpoint that returns status information:

```json
{
  "status": "ok",
  "service": "Munich Weekly Image Worker",
  "timestamp": "2025-05-19T12:34:56Z"
}
```

### Debug Endpoints

`/debug-params`, `/debug-auth`, and `/debug-request` return `404` unless debug
mode is deliberately enabled with `DEBUG_ROUTES_ENABLED=true` and
`DEBUG_AUTH_SECRET` is configured. When enabled, requests without the correct
`x-debug-secret` header return `403`.

Debug responses are intentionally bounded. They do not list R2 object keys,
reflect all request headers, return authorization or cookie headers, or expose
stack traces. Use Worker logs for detailed operational errors.

---

## Best Practices

When working with the image CDN:

1. **Always use utility functions** - Don't construct image URLs manually
2. **Specify appropriate dimensions** - Request the size needed for the context
3. **Set reasonable quality levels** - 80% for thumbnails, 95% for detail views
4. **Use format=auto** - Let the CDN choose the best format for the client
5. **Set appropriate width/height attributes** - Avoid layout shifts during loading

Following these practices ensures optimal performance and visual quality.

---

## Future Enhancements

Planned improvements to the image processing pipeline:

1. **Smart cropping** - Content-aware focus points for thumbnails
2. **Watermarking** - Optional watermarks for copyright protection
3. **Metadata handling** - Preservation of EXIF data when relevant
4. **Image effects** - Filters and adjustments for creative purposes
5. **Advanced caching** - More granular control of cache behaviors

These enhancements will further improve the platform's image handling capabilities.
