import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { homePageConfig } from '@/lib/config';

// Get homepage configuration - Public API, no authentication required
export async function GET(request: NextRequest) {
  try {
    // Print cookie and header information for debugging
    console.log('Config API cookies:', [...request.cookies.getAll()].map(c => c.name));
    console.log('Config API headers:', [...request.headers.entries()].map(([key, value]) => 
      `${key}: ${key.toLowerCase() === 'authorization' ? 'REDACTED' : value}`));
    
    // Check if force refresh is requested
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('_force') === '1';
    console.log('Force refresh requested:', forceRefresh);
    
    // Try to read configuration from file
    const configPath = path.join(process.cwd(), 'public', 'config', 'homepage.json');
    let config;
    let lastModified = new Date().toISOString(); // Default to current time

    try {
      const fileContent = await fs.readFile(configPath, 'utf-8');
      config = JSON.parse(fileContent);
      
      // Get file modification time
      const stats = await fs.stat(configPath);
      lastModified = stats.mtime.toISOString();
    } catch {
      // If file doesn't exist or cannot be parsed, use default configuration
      config = { heroImage: homePageConfig.heroImage };
      console.log('Configuration file not found, using default configuration');
    }
    
    // Generate ETag based on content and modification time
    const etag = `"${Buffer.from(lastModified + JSON.stringify(config)).toString('base64').slice(0, 16)}"`;
    
    // Skip cache check if force refresh is requested
    if (!forceRefresh) {
      // Check client cache
      const clientETag = request.headers.get('if-none-match');
      if (clientETag === etag) {
        return new NextResponse(null, { status: 304 }); // Not modified, return 304
      }
    }
    
    // Create response object and add cache control response headers
    const response = NextResponse.json({
      success: true,
      config
    });
    
    // Set no-cache headers if force refresh is requested, otherwise use normal cache strategy
    if (forceRefresh) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      console.log('Set no-cache headers for force refresh');
    } else {
      // Set cache headers and ETag, cache will automatically expire when configuration is updated
      response.headers.set('Cache-Control', 'public, max-age=3600'); // 1 hour cache
      response.headers.set('ETag', etag);
    }
    
    response.headers.set('Last-Modified', lastModified);
    
    return response;
  } catch (error) {
    console.error('Failed to get configuration:', error);
    return NextResponse.json(
      { 
        error: `Failed to get configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        // Return default configuration as fallback
        config: { heroImage: homePageConfig.heroImage }
      },
      { status: 500 }
    );
  }
} 