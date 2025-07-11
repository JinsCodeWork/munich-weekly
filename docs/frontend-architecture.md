# Munich Weekly - Frontend Architecture

## Overview

Munich Weekly is a photography-based weekly publication platform where users can submit, view, and vote on photographs. The frontend is built with a modern tech stack, featuring a responsive design that works across all devices.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: JWT-based authentication with secure HTTP-only cookies
- **State Management**: React Context API + Custom Hooks
- **Icons**: Font Awesome
- **UI Components**: Custom components with glassmorphism effects

## Core Components Structure

The frontend is organized into a component-based architecture following the Next.js App Router pattern. Below is the actual project structure:

```
frontend/
├── public/                 # Static assets
│   ├── favicon.png         # Site favicon
│   ├── logo.svg            # Brand logo
│   ├── globe.svg           # UI icons
│   ├── file.svg            # UI icons
│   ├── next.svg            # Next.js logo
│   ├── vercel.svg          # Vercel logo
│   └── window.svg          # UI icons
├── scripts/                # Utility scripts
│   ├── convert-favicon.js  # Favicon conversion tool
│   └── generate-favicon.js # Favicon generation script
├── src/
│   ├── api/                # Modular API directory
│   │   ├── auth/           # Authentication-related APIs
│   │   │   └── index.ts    # Authentication API exports
│   │   ├── issues/         # Issue-related APIs
│   │   │   └── index.ts    # Issue API exports
│   │   ├── submissions/    # Submission-related APIs
│   │   │   └── index.ts    # Submission API exports
│   │   ├── users/          # User-related APIs
│   │   │   └── index.ts    # User API exports
│   │   ├── votes/          # Voting-related APIs
│   │   │   └── index.ts    # Voting API exports
│   │   ├── gallery/        # Gallery-related APIs ✨ **NEW**
│   │   │   ├── index.ts    # Gallery API exports
│   │   │   ├── galleryApi.ts  # Gallery issue management
│   │   │   └── types.ts    # Gallery TypeScript interfaces
│   │   ├── http.ts         # Base HTTP request utilities
│   │   ├── types.ts        # API-related type definitions
│   │   └── index.ts        # Unified API exports
│   ├── app/                # Next.js App Router pages
│   │   ├── account/        # User account section
│   │   │   ├── layout.tsx  # Account layout with sidebar
│   │   │   ├── page.tsx    # Main account page
│   │   │   ├── settings/   # User settings
│   │   │   ├── submissions/# User submissions management
│   │   │   └── manage-submissions/ # Submission management
│   │   ├── admin/          # Admin panel routes
│   │   │   └── submissions/# Admin submission management
│   │   ├── content/        # Content pages
│   │   ├── login/          # Login page
│   │   ├── register/       # Registration page
│   │   ├── submit/         # Photo submission page
│   │   ├── vote/           # Public voting page
│   │   ├── test/           # Test pages
│   │   ├── globals.css     # Global CSS
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Homepage
│   ├── components/         # UI components
│   │   ├── admin/          # Admin components
│   │   │   └── submissions/# Admin submission components
│   │   │       ├── DebugTools.tsx     # Development debugging
│   │   │       ├── SubmissionTable.tsx # Submission table
│   │   │   ├── auth/           # Authentication components
│   │   │   │   ├── LoginForm.tsx   # Login form
│   │   │   │   └── RegisterForm.tsx # Registration form
│   │   │   ├── navigation/     # Navigation components
│   │   │   │   ├── MainNav.tsx     # Desktop navigation
│   │   │   │   └── MobileNav.tsx   # Mobile navigation
│   │   │   ├── submission/     # Submission components
│   │   │   │   ├── ImageGrid.tsx   # Grid layout for images
│   │   │   │   ├── ImageViewer.tsx # Image viewing modal
│   │   │   │   ├── MasonrySubmissionCard.tsx # Masonry-optimized submission card
│   │   │   │   └── SubmissionCard.tsx # Submission card
│   │   │   ├── gallery/        # Gallery components ✨ **NEW**
│   │   │   │   ├── FeaturedCarousel.tsx   # Homepage carousel display
│   │   │   │   ├── GalleryImageViewer.tsx # Full-screen image viewer
│   │   │   │   ├── GalleryIssueCard.tsx   # Gallery issue display card
│   │   │   │   └── GallerySubmissionCard.tsx # Gallery submission presentation
│   │   │   ├── voting/         # Voting components
│   │   │   │   └── VoteButton.tsx  # Interactive voting button
│   │   │   ├── ui/             # Core UI components
│   │   │   │   ├── Button.tsx      # Button component
│   │   │   │   ├── Container.tsx   # Container layout
│   │   │   │   ├── ImageUploader.tsx # Image upload component
│   │   │   │   ├── IssueSelector.tsx # Issue selection component
│   │   │   │   ├── Link.tsx        # Link component
│   │   │   │   ├── LoadingErrorStates.tsx # Loading/error handling
│   │   │   │   ├── Logo.tsx        # Logo component
│   │   │   │   ├── MasonryGallery.tsx # Advanced masonry layout component
│   │   │   │   ├── Modal.tsx       # Modal dialog
│   │   │   │   ├── Pagination.tsx  # Pagination component
│   │   │   │   ├── SubmissionForm.tsx # Submission form
│   │   │   │   └── Thumbnail.tsx   # Image thumbnail
│   │   │   ├── Header.tsx      # Main header component
│   │   │   └── MainHeader.tsx  # Alternative header
│   │   ├── context/            # React Context providers
│   │   │   └── AuthContext.tsx # Authentication context
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useAuth.ts      # Authentication hook
│   │   │   ├── useDebugTools.ts # Development debugging hook
│   │   │   ├── useFileUpload.ts # File upload hook
│   │   │   ├── useImageDimensions.ts # Batch image dimension loading hook
│   │   │   ├── useIssues.ts    # Issues data hook
│   │   │   ├── useSkylineMasonryLayout.ts # Frontend positioning hook for hybrid masonry system
│   │   │   └── useSubmissions.ts # Submissions data hook
│   │   ├── lib/                # Utility functions and constants
│   │   │   ├── constants.ts    # Application constants
│   │   │   └── utils.ts        # Utility helper functions
│   │   ├── styles/             # Style management system
│   │   │   ├── components/     # Component-specific styles
│   │   │   │   ├── form.ts     # Form component styles
│   │   │   │   └── ...         # Other component styles
│   │   │   ├── index.ts        # Style exports
│   │   │   ├── theme.ts        # Theme configuration
│   │   │   └── variants.ts     # Style variants
│   │   ├── theme/              # Theme-related directory (reserved)
│   │   ├── types/              # TypeScript type definitions
│   │   │   └── submission.ts   # Submission-related types
│   │   └── utils/              # Additional utilities
│   │       └── mockData.ts     # Mock data for development
│   │   └── types.ts    # Gallery TypeScript interfaces
```

## Key Features

### Authentication System

A complete JWT-based authentication system is implemented with:

- **User Registration**: Email-based registration with password validation
- **User Login**: Secure login with JWT token storage
- **Password Reset**: Complete password recovery flow with email verification via Mailjet
- **Session Management**: Persistent sessions using localStorage
- **Logout Functionality**: Complete session termination

Authentication components:
- `LoginForm`: A modal-based login form with email/password fields and "Forgot password?" link
- `RegisterForm`: A modal-based registration form with validation
- `ForgotPasswordPage`: Standalone page for initiating password reset
- `ResetPasswordPage`: Token-secured page for setting a new password
- `AuthContext`: React Context for managing authentication state and user data
- `useAuth`: Custom hook for accessing authentication functionality

### Navigation System

A responsive navigation system that adjusts for different screen sizes:

- **MainNav**: Desktop navigation with user account dropdown
- **MobileNav**: Mobile-friendly navigation with sliding menu
- **Logo**: Customizable logo component
- **Header/MainHeader**: Alternative header implementations

### User Account Management

A user account management system with sidebar navigation:

- **Account Layout**: Sidebar navigation with main content area
- **Profile Management**: User profile viewing and editing
- **Submissions Management**: Interface for user photo submissions
- **Account Settings**: Security settings and password management

### Content Management

Components for managing submission content:

- **SubmissionCard**: Displays individual submissions with metadata
- **ImageGrid**: Grid layout for displaying multiple submissions
- **ImageViewer**: Modal for viewing full-size images
- **SubmissionTable**: Admin interface for managing submissions
- **IssueSelector**: Reusable component for selecting publication issues

### Gallery System

A comprehensive gallery system with both featured carousel and issue-based organization:

**Gallery Issue Management:**
- **Issue-based Organization**: Display photography issues with automatic ordering by ID (newest first)
- **Cover Image Management**: Upload and manage cover images for visual appeal
- **Submission Ordering**: Admin control over submission display order with hero image designation
- **Publication Control**: Draft/published status for controlled content release

**Featured Carousel System:**
- **FeaturedCarousel**: Auto-playing carousel with responsive navigation and indicators
- **GalleryImageViewer**: Full-screen image viewer with zoom, pan, and touch gesture support
- **Admin Configuration**: Backend-managed submission curation with display order control
- **Mobile Optimization**: Enhanced mobile experience with direct full-screen viewing

**Gallery Display Components:**
- `GalleryIssueCard`: Issue display with cover images and hover effects
- `GallerySubmissionCard`: Clean image presentation with author attribution
- `FeaturedCarousel`: Homepage carousel with autoplay and navigation
- `GalleryImageViewer`: Full-screen viewer with gallery-specific metadata

**Admin Management Features:**
- **Issue Configuration**: Create, edit, and delete gallery issue configurations
- **Cover Upload**: Drag-and-drop cover image management with instant preview
- **Order Management**: Visual drag-and-drop interface for submission ordering
- **Publication Toggle**: Instant enable/disable of gallery issues
- **Bulk Operations**: Manage multiple configurations simultaneously

**Public Gallery Features:**
- **Clean Design**: Minimal interface highlighting photographic content
- **Hero Presentation**: Large featured images with optimal responsive sizing
- **Full-screen Viewing**: Advanced image viewer with zoom and gesture support
- **Progressive Loading**: Optimized image loading with quality enhancement

### Voting System

A comprehensive anonymous voting system with performance optimization:

- **VotePage**: Public voting interface with current and historical result viewing
- **VoteButton**: Interactive voting component with real-time feedback
- **VoteStatusContext**: Centralized vote state management with batch optimization ✨ **NEW**
- **Batch Vote Checking**: Reduces N individual API requests to 1 batch request (95%+ API call reduction)
- **Anonymous Voting**: Cookie-based visitor identification for anonymous participation
- **Previous Results Access**: Graceful fallback to historical voting results when no current voting period is active
- **State Management**: Smart view switching between current voting and previous results
- **Read-only Historical View**: Past voting results displayed in non-interactive format

### UI Components

Custom UI components designed for consistency and reusability:

- **Modal**: Glassmorphism-style modal with backdrop blur
- **Container**: Responsive container with consistent padding
- **Button**: Styled button component with variants
- **Link**: Enhanced link component with Next.js integration
- **Pagination**: Component for paginating through content
- **Thumbnail**: Image thumbnail component with Next.js Image integration
- **ImageUploader**: Reusable component for image upload with preview and validation
- **SubmissionForm**: Standardized form for photo submissions with validation
- **LoadingErrorStates**: Unified component for handling loading, error, and empty states

### Custom Hooks

The application includes a comprehensive set of custom React hooks for managing complex functionality:

- **useAuth**: Authentication state management with login/logout functionality
- **useFileUpload**: File upload handling with validation and progress tracking
- **useImageDimensions**: Batch image dimension loading with **progressive loading support** (6 image threshold, 24-hour caching) and **mobile connection optimization** (first batch limited to 2 images)
- **useSkylineMasonryLayout**: Frontend positioning for backend-ordered items with **progressive display** and responsive column management
- **useIssues**: Issues data fetching and state management
- **useSubmissions**: Submissions data management with pagination support, multi-selection handling, and admin download functionality
- **useDebugTools**: Development tools for debugging and testing (development mode only)

#### Progressive Loading Architecture ✨ **NEW**

**Mobile Performance Optimization**: The custom hooks now include progressive loading capabilities with mobile connection optimization for significantly improved mobile experience.

**Key Enhancements:**
```typescript
// Progressive loading configuration with mobile optimization
const DEFAULT_CONFIG: ImageDimensionConfig = {
  timeout: 6000, // Reduced from 10s for mobile
  batchSize: 4, // Optimized for mobile networks
  progressiveThreshold: 6, // Display after 6 images
  enableProgressiveLoading: true,
};

// Mobile connection optimization prevents saturation
const loadBatch = async (urls: string[], startIndex: number = 0) => {
  const isMobile = window.innerWidth < 768;
  const isFirstBatch = startIndex === 0;
  
  // Reduce first batch to 2 images on mobile to prevent connection limit issues
  if (isMobile && isFirstBatch) {
    effectiveBatch = batch.slice(0, 2);
  }
  
  // Staggered loading with mobile-specific delays
  const delay = isMobile ? 300 : 100;
};
```

**Performance Impact:**
- **Before**: 8-10+ seconds first content display on mobile
- **After**: 2-4 seconds first content display - **60-75% improvement**
- **Connection stability**: Prevents mobile browser concurrent connection saturation

### Responsive Layout Architecture

Munich Weekly implements a sophisticated responsive layout system designed specifically for photography presentation and optimal user experience across all devices.

#### Container System Architecture

**Core Philosophy**: The container system prioritizes visual hierarchy and content breathing space, with enhanced margins that provide professional appearance while maximizing content visibility.

**Technical Implementation:**
```typescript
// Enhanced container configuration
export const CONTAINER_CONFIG = {
  padding: {
    mobile: 20,     // Upgraded from 16px for better mobile experience
    tablet: 32,     // New breakpoint for medium screens
    desktop: 40,    // Upgraded from 20px for professional desktop layout
    ultrawide: 60,  // Support for modern ultra-wide displays
  },
  maxWidths: {
    default: 1400, narrow: 1000, wide: 1600, ultrawide: 1800, full: '100%'
  }
}
```

#### Responsive Masonry System

**Hybrid Architecture with Progressive Loading**: Combines backend optimization with frontend responsive positioning and progressive display:

- **Backend Ordering**: Server calculates optimal item sequences for 2-column and 4-column layouts
- **Frontend Positioning**: Skyline algorithm handles responsive coordinate calculation and viewport adaptation
- **Progressive Loading**: Content displays after 6 images (40% threshold) for 60-75% faster mobile loading
- **Performance Benefits**: Quality guarantee from backend + Speed guarantee from frontend + Enhanced mobile UX

**Key Features**:
- Dynamic column width calculations with responsive gaps
- Automatic wide image detection and spanning (≥16:9 aspect ratio)  
- **Progressive loading with optimized thresholds** for mobile performance
- Real-time responsive adaptation without backend re-requests
- **Visual loading states** with opacity transitions and progress indicators

#### Account Layout Optimization

**Sidebar Navigation System**: Custom flex-based layout replacing standard containers for optimal space utilization:

```typescript
// Account layout structure
<div className="flex min-h-screen">
  <aside className="pl-3 md:pl-4 lg:pl-6 xl:pl-8 2xl:pl-10">
    {/* Sidebar with minimal left margin for professional appearance */}
  </aside>
  <main className="flex-1 max-w-6xl mx-auto pl-4 pr-4 md:pr-6 lg:pr-8 xl:pr-10 2xl:pr-12">
    {/* Centered main content with balanced margins */}
  </main>
</div>
```

**Key Benefits**:
- Sidebar navigation positioned with minimal page margins for modern appearance
- Main content area centered with maximum width constraints
- Responsive gap management preventing content truncation
- Specialized masonry configurations for different page contexts

This architecture ensures consistent, professional layouts while providing flexibility for different content types and user interface requirements.

### Real-time Update System

The frontend implements a sophisticated real-time update system for immediate content synchronization:

#### Architecture Overview

The real-time update system uses multiple layers of communication:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Admin Interface │    │  Homepage        │    │ Other Tabs      │
│                 │    │                  │    │                 │
│ Config Update   │◄──►│ Auto Refresh     │◄──►│ Cross-tab Sync  │
│ Image Upload    │    │ Cache Busting    │    │ Event Listening │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        ▲                       ▲
         │                        │                       │
         ▼                        ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Event Communication Layer                       │
│  • Custom Events (same tab)                                    │
│  • localStorage Events (cross-tab)                             │
│  • Polling Mechanism (30s fallback)                           │
└─────────────────────────────────────────────────────────────────┘
```

#### Key Components

1. **useConfigAdmin Hook** (`hooks/useConfigAdmin.ts`):
   - Manages homepage configuration state
   - Handles image uploads with real-time sync
   - Implements event-driven updates
   - Auto-clears success states to prevent infinite loops

2. **Homepage Component** (`app/page.tsx`):
   - Listens for configuration updates via multiple channels
   - Implements smart caching with version parameters
   - Updates image URLs with timestamps for cache busting

3. **HeroImage Component** (`components/home/HeroImage.tsx`):
   - Accepts `lastUpdated` prop for cache management
   - Automatically appends version parameters to image URLs
   - Handles both static and dynamic image sources

4. **Admin Settings Page** (`app/account/home-settings/page.tsx`):
   - Provides real-time preview of uploaded images
   - Shows current image with version parameters
   - Triggers system-wide updates on save

#### Update Mechanisms

1. **Event-Driven Updates** (Primary):
   ```typescript
   // Triggered on successful configuration save
   const event = new CustomEvent('configUpdated', { 
     detail: { config: configData, timestamp: Date.now() } 
   });
   window.dispatchEvent(event);
   ```

2. **Cross-Tab Communication**:
   ```typescript
   // Uses localStorage for cross-tab updates
   localStorage.setItem('hero_image_updated', Date.now().toString());
   ```

3. **Polling Mechanism** (Fallback):
   ```typescript
   // 30-second polling as backup
   setInterval(() => {
     loadConfig();
   }, 30000);
   ```

4. **Cache Busting**:
   ```typescript
   // Version parameters force image refresh
   const imageUrl = `/images/home/hero.jpg?v=${timestamp}`;
   ```

#### Configuration API

The system uses dedicated API endpoints for configuration management:

- **Public API** (`/frontend-api/config`):
  - No authentication required
  - Supports ETag caching
  - Force refresh with `_force=1` parameter

- **Admin API** (`/frontend-api/admin/config`):
  - Requires admin authentication
  - Handles configuration updates
  - Stores data in `/frontend/public/config/homepage.json`

#### Performance Optimizations

1. **Smart State Management**:
   - Uses `useCallback` with stable dependencies
   - Implements `useRef` to avoid unnecessary re-renders
   - Function-based state updates prevent stale closures

2. **Debouncing**:
   - Prevents duplicate reload requests
   - Implements timeout-based debouncing for events

3. **Conditional Updates**:
   - Only updates when configuration actually changes
   - Compares `lastUpdated` timestamps
   - JSON comparison for content changes

4. **Success State Management**:
   - Auto-clears success states after 2 seconds
   - Prevents infinite update loops
   - Clean event listener management

#### Error Handling

The system includes comprehensive error handling:

- **Authentication Errors**: Automatic token refresh attempts
- **Network Failures**: Graceful degradation with retry mechanisms  
- **Upload Failures**: Clear error messages with retry options
- **Sync Failures**: Fallback to polling mechanism

#### Troubleshooting

Common issues and solutions:

1. **Updates Not Appearing**:
   - Check browser console for errors
   - Verify admin authentication
   - Wait for 30-second polling cycle

2. **Infinite Loops**:
   - Success states auto-clear after 2 seconds
   - Event listeners properly cleaned up
   - Debouncing prevents duplicate requests

This real-time update system ensures users see changes immediately without manual page refreshes, providing a seamless content management experience.

### Development Tools

Components and hooks for development and debugging:

- **DebugTools**: Interface for testing and debugging functionality
- **useDebugTools**: Hook for accessing debugging utilities
- **LoadingErrorStates**: Components for handling loading and error states
- **mockData**: Mock data utilities for development and testing

### Home Page Components and Architecture

The home page provides an engaging entry point to the platform with the following components:

1. **HeroImage Component**: 
   - Located at `/components/home/HeroImage.tsx`
   - Displays a large, visually engaging image with hover/tap interaction effects
   - Handles responsive behavior automatically (hover for desktop, tap for mobile)
   - Implements transition animations for text visibility
   - Implements image loading error fallback mechanism
   - Uses Next.js Image component for optimized loading

2. **Home Page Component**:
   - Located at `/app/page.tsx`
   - Client-side component with dynamic content loading
   - Fetches configuration from API with cache-busting mechanism
   - Handles loading states for improved user experience
   - Presents intro text and platform description below hero image

3. **Home Settings Admin Interface**:
   - Located at `/app/account/home-settings/page.tsx`
   - Restricted to admin users (implements role-based access control)
   - Features:
     - Image upload with preview functionality
     - Description text editing
     - Image caption editing
     - Server-side image storage management
     - Configuration file updates
   - Implements proper form validation and error handling

4. **Configuration Management**:
   - Default configuration defined in `/lib/config.ts`
   - Dynamic configuration stored in `/public/config/homepage.json`
   - API endpoints:
     - `GET /api/config` - Retrieves current configuration
     - `POST /api/admin/config` - Updates configuration (admin only)

## Recent Architecture Enhancements

### Advanced Image Display System

Significant improvements were made to the image rendering and display logic throughout the platform, focusing on optimal presentation across different device contexts and aspect ratios.

#### Core Enhancements

**Intelligent Aspect Ratio Detection**:
- Implemented precision tolerance system: 16:9 detection (±0.08), other ratios (±0.1)
- Enhanced `detectAspectRatio()` function in `/styles/components/thumbnail.ts`
- Automatic fallback classification for non-standard ratios
- Real-time aspect ratio calculation and logging for debugging

**Responsive Display Strategy**:
- **Desktop (≥768px)**: 
  - 16:9 images: Center-aligned for visual balance
  - Other landscape ratios (4:3, 5:4): Top-aligned to eliminate whitespace
  - Portrait images: Strategic cropping with `object-fit: cover`
- **Mobile (<768px)**:
  - All landscape images: Center-aligned for consistent experience
  - Portrait images: Continue strategic cropping

**Enhanced Object Positioning**:
- Added `objectPositionVariants` to style system supporting top, center, bottom positioning
- Implemented responsive screen size detection with window resize handling
- Type-safe positioning configuration with automatic fallback mechanisms

#### Technical Implementation

**Component Architecture**:
```typescript
// Enhanced Thumbnail component with intelligent positioning
<Thumbnail 
  src={imageUrl}
  autoDetectAspectRatio={true}
  preserveAspectRatio={true}
  objectPosition="auto"  // Automatically determined
  responsivePositioning={true}
/>
```

**Style System Integration**:
- Extended `getThumbnailImageStyles()` function with object-position support
- Centralized positioning logic in `/styles/components/thumbnail.ts`
- Type-safe variant system ensuring consistency across components

**Performance Optimizations**:
- Window resize event listener management for responsive behavior
- Debounced aspect ratio detection to prevent excessive calculations
- Enhanced debugging with detailed parameter logging
- Graceful fallback mechanisms for invalid configurations

#### Impact and Benefits

**User Experience**:
- Eliminated upper whitespace issues on desktop for landscape images
- Improved visual consistency across different device sizes
- Reduced horizontal letterboxing on portrait images
- Better utilization of available display space

**Developer Experience**:
- Comprehensive TypeScript typing for all positioning variants
- Enhanced debugging capabilities with detailed console logging
- Maintainable, centralized logic for image display decisions
- Clear separation of concerns between detection, classification, and positioning

**Cross-Platform Consistency**:
- Unified behavior across mobile and desktop platforms
- Responsive design that adapts to screen size changes
- Consistent handling of edge cases and non-standard aspect ratios

This enhancement represents a significant improvement in the platform's image presentation capabilities, ensuring optimal display quality while maintaining excellent performance and developer experience.

#### Public Voting Page (`/vote`)

Enhanced public voting interface with optimized user experience:

**Core Features:**
- **Simplified Interface**: Direct issue title display without redundant prefixes
- **Dynamic Layout**: Adaptive column width calculation for optimal space utilization
- **Balanced Distribution**: Wide image limiting algorithm prevents consecutive placement
- **Symmetric Margins**: Professional spacing with guaranteed left-right balance

**Technical Enhancements:**
- **Hybrid Layout**: Backend ordering with frontend Skyline positioning for optimal display
- **Container Optimization**: `vote` variant with progressive spacing (px-2 → lg:px-6)
- **Dynamic Sizing**: Real-time column width calculation based on container dimensions

## Performance Optimizations ✨ **ENHANCED**

### Image Dimension Optimization System ✨ **NEW**

**Stored Dimension Strategy:**
- **Upload-time calculation** - Image dimensions computed once during file upload
- **Database persistence** - Width, height, aspect ratio stored in submissions table  
- **API integration** - Dimension data included in all submission endpoints
- **Frontend efficiency** - Direct usage of stored ratios, no calculation needed

**Performance Impact:**
- **60-80% faster** masonry layout calculation
- **Eliminated** redundant image dimension API calls
- **Instant** aspect ratio availability for layout positioning
- **Enhanced mobile** performance with immediate layout rendering

**Implementation Architecture:**
```typescript
// Backend: Enhanced upload process
StorageResult result = storageService.storeFileWithDimensions(file);
submission.setImageDimensions(result.getDimensions());

// API: Enhanced response with dimensions
{
  "imageUrl": "...",
  "imageWidth": 3648,      // ✨ Stored dimension
  "imageHeight": 5472,     // ✨ Stored dimension  
  "aspectRatio": 0.666667  // ✨ Precomputed ratio
}

// Frontend: Direct dimension usage
const aspectRatio = submission.aspectRatio; // ✨ No calculation needed
```

### Progressive Loading with Stored Dimensions ✨ **UPDATED**

**Hybrid Loading Strategy:**
- **Phase 1**: Instant rendering of submissions with stored dimensions (optimized path)
- **Phase 2**: Progressive loading fallback for legacy submissions without dimensions
- **Intelligent detection**: Automatically selects optimal loading strategy per submission

**Mobile Performance Enhancements:**
- **Reduced batch sizes** - 4 concurrent requests (down from 6) for mobile optimization
- **Optimized timeouts** - 6 seconds (down from 10) for faster failure detection
- **Progressive thresholds** - Content appears after 6 images or 40% loaded
- **Connection stability** - Prevents mobile browser request saturation

### Caching and State Management ✨ **ENHANCED**

**Dimension Caching Strategy:**
- **API-level caching** - Stored dimensions cached indefinitely (permanent data)
- **Browser caching** - 24-hour cache for any dynamic dimension calculations
- **Memory efficiency** - No client-side image loading for dimension detection
- **Cache invalidation** - Automatic cleanup of expired entries

**State Management Optimization:**
```typescript
// Optimized submission dimensions hook
const dimensionResult = useSubmissionDimensions(submissions, {
  preferStoredDimensions: true,  // ✨ Prioritize database dimensions
  enableProgressiveLoading: true, // Fallback for legacy data
  batchSize: 4                   // Mobile-optimized concurrency
});

// Performance metrics for admin users
const optimizationStats = {
  storedDimensionsCount: 15,     // Submissions with stored data
  dynamicFetchCount: 0,          // Legacy submissions requiring calculation  
  optimizationPercentage: 100.0  // Percentage using stored dimensions
};
```

### Promotion Module Architecture

The promotion feature is a self-contained module designed for managing marketing campaigns.

- **Admin Interface (`/account/promotion-settings`)**: A client-rendered React component that provides a full suite of tools for admins. It allows for creating, selecting, updating, and deleting promotion configurations and their associated images.
- **Public Page (`/[promotionUrl]`)**: A dynamic, server-rendered page that displays the content of an enabled promotion based on its URL slug.
- **API Layer (`/api/promotion`)**: A unified API service layer that exports both public-facing functions (e.g., `getPromotionPageByUrl`) and admin-only functions (e.g., `updatePromotionConfig`). This consolidates all promotion-related network requests.
- **State Management**: State is managed locally within the admin components using `useState`. There is no global state for promotions, ensuring the module remains decoupled.

## State Management

The primary method for global state management is **React Context**.