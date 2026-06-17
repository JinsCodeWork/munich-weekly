import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Get JWT token from the Authorization header. Admin frontend APIs do not accept
// JWT cookies so browsers cannot trigger them with ambient credentials.
function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

// Verify user has admin role
async function verifyAdminRole(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return false;
    }

    const user = await response.json();
    return user.role === 'admin';
  } catch {
    return false;
  }
}

// Get configuration API
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - Please login first' }, { status: 401 });
    }

    // Verify admin role
    const isAdmin = await verifyAdminRole(token);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    // Read existing configuration
    const configPath = path.join(process.cwd(), 'public', 'config', 'homepage.json');
    
    let config = {};
    try {
      const fileContent = await fs.readFile(configPath, 'utf-8');
      config = JSON.parse(fileContent);
    } catch {
      // Configuration file not found or invalid, returning empty config
    }
    
    return NextResponse.json({
      success: true,
      config
    });

  } catch (error) {
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
      return NextResponse.json({ error: 'Unauthorized - Please login first' }, { status: 401 });
    }

    // Verify admin role
    const isAdmin = await verifyAdminRole(token);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
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
    } catch {
      // Failed to create config directory
    }
    
    // Check if file exists, if not create initial configuration
    let currentConfig = {};
    try {
      const fileContent = await fs.readFile(configPath, 'utf-8');
      currentConfig = JSON.parse(fileContent);
    } catch {
      // File doesn't exist or can't be parsed, use empty object
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
    return NextResponse.json(
      { error: `Configuration update failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
