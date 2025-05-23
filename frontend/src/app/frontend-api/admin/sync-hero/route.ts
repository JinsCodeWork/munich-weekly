import { NextRequest, NextResponse } from 'next/server';
import { writeFile, copyFile, access } from 'fs/promises';
import path from 'path';
import { verify } from 'jsonwebtoken';

// 验证管理员权限
async function verifyAdmin(request: NextRequest) {
  try {
    // 从Authorization头或cookie获取token
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const jwtMatch = cookies.match(/jwt=([^;]+)/);
        if (jwtMatch) {
          token = jwtMatch[1];
        }
      }
    }
    
    if (!token) {
      return null;
    }
    
    const decoded = verify(token, process.env.JWT_SECRET || 'default-secret') as any;
    return decoded.role === 'admin' ? decoded : null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }
    
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
      
      if (error.code === 'ENOENT') {
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