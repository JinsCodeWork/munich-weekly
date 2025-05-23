import { NextRequest, NextResponse } from 'next/server';
import { copyFile, access } from 'fs/promises';
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

export async function POST(request: NextRequest) {
  try {
    // 简化的身份验证检查，与其他admin API保持一致
    const token = getAuthToken(request);
    if (!token) {
      console.warn('No authentication token found for sync-hero');
      return NextResponse.json({ error: 'Unauthorized - Please login first' }, { status: 401 });
    }
    
    console.log('Processing hero image sync with authentication');
    
    // 后端uploads目录的hero图片路径（需要根据实际部署情况调整）
    const backendHeroPath = path.join(process.cwd(), '..', 'backend', 'uploads', 'hero.jpg');
    const frontendHeroPath = path.join(process.cwd(), 'public', 'images', 'home', 'hero.jpg');
    
    console.log('Attempting to sync hero image:');
    console.log('  Source:', backendHeroPath);
    console.log('  Target:', frontendHeroPath);
    
    try {
      // 检查源文件是否存在
      await access(backendHeroPath);
      console.log('Source file exists, copying...');
      
      // 复制文件
      await copyFile(backendHeroPath, frontendHeroPath);
      
      console.log('Hero image synced successfully');
      
      return NextResponse.json({
        success: true,
        message: 'Hero image synced successfully from backend to frontend',
        localPath: '/images/home/hero.jpg'
      });
      
    } catch (error) {
      console.error('Failed to sync hero image:', error);
      
      if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Hero image not found in backend uploads directory' 
          },
          { status: 404 }
        );
      }
      
      throw error;
    }
    
  } catch (error) {
    console.error('Sync hero error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
} 