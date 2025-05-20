# Munich Weekly Admin Guide

## Home Page Image Management

The large hero image on the home page can be changed as follows:

### Method 1: Via Admin Interface (Recommended)

1. Log in to the system and go to the "Account" page
2. Select "Home Settings" in the admin tools
3. Upload a new image, fill in the description and image caption
4. Click "Save Settings" to apply changes

#### Home Settings Interface Details

The Home Settings interface provides the following capabilities:

- **Image Upload**: 
  - Click "Select New Image" to choose a new hero image
  - Supported formats: JPG and PNG
  - Maximum file size: 30MB
  - Recommended aspect ratio: 16:9 landscape format
  - Image preview is displayed before saving

- **Text Configuration**:
  - **Main Description Text**: The central text that appears when users hover over or tap the image
  - **Image Caption**: Additional information displayed at the bottom of the image (e.g., photographer, location)

- **Preview and Save**:
  - The interface provides a preview of the selected image before saving
  - Changes are applied immediately after clicking "Save Settings"
  - Confirmation message appears when the update is successful

### Method 2: Edit Files Directly (For Developers)

If you need to edit files directly:

1. Prepare a high-quality image, recommended resolution at least 1920x1080 pixels
2. Name the image `hero.jpg` (keep JPEG format)
3. Upload to the `/frontend/public/images/home/` directory on the server
4. Edit the `/frontend/public/config/homepage.json` config file (if exists)

### Image Path Explanation

The home page image is stored at:
```
/images/home/hero.jpg
```

This path is accessible in different environments:
- Development: `http://localhost:3000/images/home/hero.jpg`
- Production: `https://munichweekly.art/images/home/hero.jpg`

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

### More Resources

- For a full overview of the home page design, see [Frontend Overview](./frontend-overview.md)
- For image optimization system, see [Image CDN System](./image-cdn.md) 