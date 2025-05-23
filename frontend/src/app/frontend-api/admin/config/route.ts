import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Helper function to get JWT token from request
function getAuthToken(request: NextRequest): string | null {
  // Try to get token from cookies
  const authCookie = request.cookies.get('jwt')?.value;
  if (authCookie) {
    console.log('Found JWT token in cookies');
    return authCookie;
  }
  
  // If not in cookies, try authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    console.log('Found JWT token in Authorization header');
    return authHeader.substring(7);
  }
  
  console.log('No JWT token found in standard locations');
  return null;
}

// Get configuration API
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = getAuthToken(request);
    if (!token) {
      console.warn('No authentication token found for config GET');
      return NextResponse.json({ error: 'Unauthorized - Please login first' }, { status: 401 });
    }
    
    console.log('Processing admin config GET request');
    
    // Read existing configuration
    const configPath = path.join(process.cwd(), 'public', 'config', 'homepage.json');
    
    let config = {};
    try {
      const fileContent = await fs.readFile(configPath, 'utf-8');
      config = JSON.parse(fileContent);
    } catch {
      console.log('Configuration file not found or invalid, returning empty config');
    }
    
    return NextResponse.json({
      success: true,
      config
    });
    
  } catch (error) {
    console.error('Configuration GET error:', error);
    return NextResponse.json(
      { error: `Failed to retrieve configuration: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// Configuration update API
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = getAuthToken(request);
    if (!token) {
      console.warn('No authentication token found');
      return NextResponse.json({ error: 'Unauthorized - Please login first' }, { status: 401 });
    }
    
    console.log('Processing config update with authentication');
    
    // Get request data
    const data = await request.json();
    
    if (!data) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    
    // Read existing configuration
    const configPath = path.join(process.cwd(), 'public', 'config', 'homepage.json');
    
    // Ensure directory exists
    try {
      await fs.mkdir(path.dirname(configPath), { recursive: true });
    } catch (error) {
      console.error('Failed to create config directory:', error);
    }
    
    // Check if file exists, if not create initial configuration
    let currentConfig = {};
    try {
      const fileContent = await fs.readFile(configPath, 'utf-8');
      currentConfig = JSON.parse(fileContent);
    } catch {
      // File doesn't exist or can't be parsed, use empty object
      console.log('Existing configuration not found or invalid, will create new config');
    }
    
    // Merge configuration
    const newConfig = {
      ...currentConfig,
      ...data,
      lastUpdated: new Date().toISOString()
    };
    
    // Write to configuration file
    await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2), 'utf-8');
    
    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      config: newConfig
    });
    
  } catch (error) {
    console.error('Configuration update error:', error);
    return NextResponse.json(
      { error: `Configuration update failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 