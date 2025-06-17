# Munich Weekly Admin Guide

## Image Dimension Data Migration ✨ **NEW**

### Overview

The platform now includes an **image dimension optimization system** that stores image dimensions during upload for enhanced performance. For existing submissions uploaded before this optimization, a migration tool is available to populate dimension data.

### Accessing Migration Tools

1. Log in as an admin user
2. Navigate to "Account" → "Data Migration"
3. The migration interface provides analysis and execution tools

### Migration Features

#### Analysis Mode
- **Review requirements**: See how many submissions need migration
- **Optimization metrics**: View current optimization percentage
- **Estimated duration**: Understand migration time requirements
- **Safe preview**: Analysis doesn't modify any data

#### Migration Execution
- **Batch processing**: Configurable batch sizes (1-20 submissions)
- **Rate limiting**: Adjustable delays (1-30 seconds) between batches
- **Real-time monitoring**: Progress tracking with success/failure counts
- **Pauseable operation**: Stop migration at any time safely
- **Safe operation**: Only adds dimension data, never deletes existing records

### Migration Process

#### Step 1: Analysis
1. Click "Analyze Migration Requirements"
2. Review the statistics:
   - Total submissions in system
   - Submissions already optimized
   - Submissions requiring migration
   - Current optimization percentage

#### Step 2: Configuration
1. Set **Batch Size** (1-20 submissions per batch)
   - Smaller batches: Safer, slower processing
   - Larger batches: Faster processing, higher resource usage
2. Set **Delay** (1-30 seconds between batches)
   - Longer delays: Reduced server load
   - Shorter delays: Faster completion

#### Step 3: Execution
1. Click "Start Migration"
2. Monitor real-time progress:
   - Items processed / total items
   - Success and failure counts
   - Percentage complete
   - Estimated time remaining
3. Use "Stop Migration" if needed to halt the process

### Performance Impact

**After Migration:**
- **60-80% faster** masonry layout rendering
- **Eliminated** redundant image dimension API calls
- **Instant** aspect ratio availability for layout calculations
- **Enhanced mobile** performance with immediate layout

### Safety Features

- **Non-destructive**: Migration only adds data, never removes existing information
- **Atomic operations**: Each submission is processed individually
- **Error recovery**: Failed items don't affect successful processing
- **Real-time monitoring**: Full visibility into migration progress
- **Pauseable**: Can be stopped safely at any time

### Troubleshooting Migration

**If migration fails:**
1. **Check network connectivity** - Ensure stable connection to image storage
2. **Verify storage access** - Confirm R2/local storage is accessible
3. **Review error logs** - Check server logs for specific error details
4. **Retry after fixing** - Re-run migration after resolving issues

**Performance considerations:**
- **Run during low traffic** - Execute migration when site usage is minimal
- **Monitor server resources** - Watch CPU/memory usage during execution
- **Use conservative settings** - Start with smaller batches and longer delays

---

## Home Page Image Management

The large hero image on the home page can be changed as follows:

### Method 1: Via Admin Interface (Recommended)

1. Log in to the system and go to the "Account" page
2. Select "Home Settings" in the admin tools
3. Upload a new image, fill in the description and image caption
4. Click "Save Settings" to apply changes
5. **Changes are applied instantly** - both the homepage and admin interface update automatically

#### Home Settings Interface Details

The Home Settings interface provides the following capabilities:

- **Image Upload**: 
  - Click "Select New Image" to choose a new hero image
  - Supported formats: JPG and PNG
  - Maximum file size: 30MB
  - Recommended aspect ratio: 16:9 landscape format
  - **Real-time preview** is displayed before saving
  - **Current image automatically updates** to show the latest uploaded version

- **Text Configuration**:
  - **Main Description Text**: The central text that appears when users hover over or tap the image
  - **Image Caption**: Additional information displayed at the bottom of the image (e.g., photographer, location)

- **Real-time Updates**:
  - **Instant sync**: Changes appear immediately on the homepage
  - **Auto-refresh**: Admin interface updates to show current image
  - **Cross-tab sync**: Updates visible across multiple browser tabs
  - **Cache bypass**: New images load immediately without manual refresh

- **Preview and Save**:
  - The interface provides a preview of the selected image before saving
  - Changes are applied immediately after clicking "Save Settings"
  - Confirmation message appears when the update is successful
  - **No page refresh required** - everything updates automatically

### Real-time Update System

The system uses multiple mechanisms to ensure instant updates:

- **Event-driven updates**: Components communicate via custom events
- **Polling mechanism**: Automatic check for updates every 30 seconds (fallback)
- **Cache busting**: Images include version parameters to bypass browser cache
- **Smart sync**: Only updates when configuration actually changes

### Method 2: Edit Files Directly (For Developers)

If you need to edit files directly:

1. Prepare a high-quality image, recommended resolution at least 1920x1080 pixels
2. Name the image `hero.jpg` (keep JPEG format)
3. Upload to the `/frontend/public/images/home/` directory on the server
4. Edit the `/frontend/public/config/homepage.json` config file (if exists)
5. **Note**: Direct file edits may not trigger real-time updates

### Image Path Explanation

The home page image is stored at:
```
/images/home/hero.jpg?v={timestamp}
```

- Version parameter `?v={timestamp}` ensures cache busting
- This path is accessible in different environments:
  - Development: `http://localhost:3000/images/home/hero.jpg`
  - Production: `https://munichweekly.art/images/home/hero.jpg`

### Configuration Storage

Homepage configuration is stored in:
```
/frontend/public/config/homepage.json
```

Structure:
```json
{
  "heroImage": {
    "imageUrl": "/images/home/hero.jpg",
    "description": "Main description text",
    "imageCaption": "Image caption text"
  },
  "lastUpdated": "2024-01-01T00:00:00.000Z"
}
```

### Image Best Practices

- Use landscape images, aspect ratio about 16:9
- Choose high-resolution, clear images (1920x1080 or higher recommended)
- Consider the effect of text on a dark background (a semi-transparent black overlay appears on hover)
- The image theme should be relevant to the website (photography works, cameras, photographers, etc.)
- Avoid overly complex or bright images, which may affect hover effect and text readability

### Image Text Management

Via the admin interface, you can set the following text content:

1. **Central Description Text**: Main text displayed in the center of the image on hover
2. **Image Caption**: Additional info displayed at the bottom of the image on hover (e.g. photographer, location, etc.)

### Troubleshooting

If updates don't appear immediately:

1. **Check console logs** for any error messages
2. **Wait 30 seconds** for the polling mechanism to trigger
3. **Refresh the page** manually as a last resort
4. **Verify authentication** - ensure you're logged in as admin

### Technical Details

- **Backend sync**: Images uploaded to `/backend/uploads/hero.jpg`
- **Frontend sync**: Automatically copied to `/frontend/public/images/home/hero.jpg`
- **API endpoints**: `/frontend-api/config` for public access, `/frontend-api/admin/config` for admin operations
- **Event system**: Uses `configUpdated` events and localStorage for cross-tab communication

### More Resources

- For a full overview of the home page design, see [Frontend Overview](./frontend-overview.md)
- For image optimization system, see [Image CDN System](./image-cdn.md)
- For frontend architecture details, see [Frontend Architecture](./frontend-architecture.md)

## Submission Management

### Managing Submissions Status

When reviewing submissions, you have three action options:

- **Approve**: Mark the submission as approved for public viewing
- **Reject**: Mark the submission as rejected 
- **Select**: Mark the submission as selected/featured for the issue

#### Multiple Selection Support

As of the latest update, **multiple submissions can be selected for the same issue**. This allows:

- Selecting multiple high-quality submissions as featured content
- Creating curated collections for each issue
- More flexible content management for different presentation needs

### Downloading Selected Submissions

For content management and backup purposes, you can download all selected submissions for an issue:

1. Navigate to "Account" → "Manage Submissions"
2. Select the desired issue from the dropdown
3. Ensure some submissions are marked as "Selected"
4. Click the **"Download Selected Submissions"** button

#### Download Features

- **Original Quality**: Downloads original uncompressed images directly from storage (bypassing CDN optimization)
- **Organized Naming**: Files are automatically renamed with format: `001_UserNickname_SubmissionID.jpg`
- **Summary Report**: Includes a `_SUMMARY.txt` file with submission details and download statistics
- **ZIP Format**: All files are packaged in a ZIP file named `{IssueTitle}_selected_submissions.zip`

#### Download Process

The download process:
1. Validates admin permissions
2. Retrieves all selected submissions for the issue
3. Downloads original images from storage (R2/local)
4. Packages everything into a organized ZIP file
5. Automatically starts the download in your browser

#### Troubleshooting Downloads

If downloads fail:
- Ensure you have admin permissions
- Check that the issue has selected submissions
- Verify storage connectivity (check server logs)
- Try refreshing the page and attempting again

### Technical Notes

- The system supports both local storage and Cloudflare R2 storage
- Original image quality is preserved by bypassing CDN optimization
- Download functionality requires admin authentication
- Large downloads may take time depending on the number and size of selected images 

## Promotion Management

Admins can create and manage promotional campaigns, which appear as special pages on the site.

### Accessing Promotion Settings

- Navigate to **Account -> Promotion Settings**.

### Features

- **Configuration Management**: Create new promotion configurations or select existing ones from a dropdown. Each configuration has a unique title, URL slug, and optional description.
- **Enable/Disable**: Toggle promotions on or off. An enabled promotion will display a link in the main navigation bar.
- **Image Management**: Upload, order, and delete images for each promotion.
- **Deletion**: Completely delete a promotion configuration and all of its associated images from the database and cloud storage.

## Gallery Management ✨ **NEW**

The Gallery system allows admins to curate and manage featured submissions that appear in the homepage carousel.

### Accessing Gallery Settings

1. Log in as an admin user
2. Navigate to "Account" → "Gallery Settings"
3. Access the featured submissions configuration interface

### Gallery Configuration Features

#### Creating a Gallery Configuration

1. **Submission Selection**: Choose from approved submissions across all issues
2. **Display Order**: Arrange submissions in preferred viewing sequence
3. **Autoplay Settings**: Configure carousel transition intervals (default: 5 seconds)
4. **Metadata Management**: Set configuration title and description for admin reference

#### Configuration Management

- **Active Configuration**: Only one configuration can be active at a time
- **Multiple Configurations**: Create and save multiple configurations for different themes
- **Instant Updates**: Changes appear immediately on the homepage carousel
- **Preview System**: Preview submissions before adding to featured carousel

#### Submission Selection Process

1. **Search by ID**: Enter submission ID to preview and add specific submissions
2. **Validation**: System verifies submission exists and is approved
3. **Duplicate Prevention**: Cannot add the same submission multiple times
4. **Status Check**: Verify if submissions are already featured in active configuration

#### Display Order Management

- **Drag and Drop**: Reorder submissions using intuitive drag-and-drop interface
- **Numerical Order**: Each submission gets a display order number (1, 2, 3, ...)
- **Preview**: See how the carousel will appear before saving

### Gallery Administration Tools

#### Configuration List View

- **View All Configurations**: Browse all saved gallery configurations
- **Status Indicators**: Clearly identify the active configuration
- **Quick Actions**: Activate, edit, or delete configurations
- **Creation Timestamps**: Track when configurations were created and last modified

#### Configuration Actions

- **Activate**: Set a configuration as the active featured carousel
- **Edit**: Modify submission selection and display order
- **Delete**: Remove configuration (includes confirmation dialog)
- **Duplicate**: Create a copy of existing configuration for modifications

### Featured Submissions Requirements

Submissions must meet the following criteria to be featured:

- **Approval Status**: Must be approved by admin
- **Image Quality**: Must have valid image URLs and dimensions
- **Accessibility**: Must be publicly viewable

### Gallery Display Features

The gallery carousel on the homepage provides:

- **Auto-playing Slideshow**: Smooth transitions with configurable timing
- **Interactive Navigation**: Arrow buttons and dot indicators
- **Responsive Design**: Optimized for desktop and mobile viewing
- **Full-screen Viewing**: Click/tap to open high-quality image viewer
- **Submission Information**: Author, issue, and description display

### Technical Implementation

#### Backend Configuration

- **Database Storage**: Gallery configurations stored in `gallery_featured_config` table
- **Submission Links**: Manages relationships between configurations and submissions
- **Automatic Deactivation**: System ensures only one active configuration

#### Frontend Integration

- **Real-time Updates**: Configuration changes appear immediately
- **Mobile Optimization**: Touch-friendly navigation and full-screen viewing
- **Performance**: Lazy loading and optimized image delivery
- **User Experience**: Seamless transitions between carousel and full viewer

### Best Practices

#### Submission Selection

- **Quality**: Choose high-resolution, visually striking photographs
- **Variety**: Mix different photography styles and subjects
- **Balance**: Consider aspect ratios for optimal carousel display
- **Representation**: Showcase diverse photographers and issues

#### Configuration Management

- **Descriptive Titles**: Use clear, descriptive names for configurations
- **Regular Updates**: Refresh featured content periodically
- **Performance**: Limit to 3-7 submissions for optimal loading
- **Mobile Testing**: Verify carousel works well on mobile devices

### Troubleshooting Gallery Issues

#### Common Issues

**Submissions not appearing:**
1. Verify submission is approved status
2. Check if submission ID exists
3. Ensure configuration is set as active
4. Clear browser cache if needed

**Configuration not saving:**
1. Verify admin authentication
2. Check all required fields are completed
3. Ensure at least one submission is selected
4. Review server logs for errors

**Carousel not updating:**
1. Refresh homepage to see changes
2. Verify configuration is marked as active
3. Check browser developer tools for JavaScript errors
4. Confirm submission images are accessible

#### Performance Optimization

- **Image Quality**: Featured submissions automatically use optimized delivery
- **Loading States**: Carousel includes loading indicators for smooth UX
- **Cache Management**: System handles cache invalidation automatically
- **Error Handling**: Graceful fallbacks for missing or broken images

## Data Migration

The admin dashboard includes a powerful data migration tool.

Admins can manage user roles, view user details, and manually verify or deactivate accounts. 