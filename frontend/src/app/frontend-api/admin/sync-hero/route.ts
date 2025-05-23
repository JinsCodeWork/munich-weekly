import { NextRequest, NextResponse } from 'next/server';
import { access, writeFile } from 'fs/promises';
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
    
    // 获取请求体，检查是否传递了上传的URL
    let heroImageUrl = null;
    try {
      const body = await request.json();
      heroImageUrl = body.imageUrl;
    } catch {
      // 请求体可能为空，这是正常的
      console.log('No request body provided, will attempt to sync from backend uploads');
    }
    
    let sourceImageData: ArrayBuffer | Buffer | null = null;
    
    if (heroImageUrl && heroImageUrl.startsWith('http')) {
      // 情况1：从R2 URL下载图片
      console.log('Downloading hero image from R2 URL:', heroImageUrl);
      
      try {
        const response = await fetch(heroImageUrl);
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
        }
        
        sourceImageData = await response.arrayBuffer();
        console.log('Successfully downloaded image from R2, size:', sourceImageData.byteLength, 'bytes');
        
      } catch (downloadError) {
        console.error('Failed to download image from R2:', downloadError);
        return NextResponse.json(
          { 
            success: false, 
            error: `Failed to download image from R2: ${downloadError instanceof Error ? downloadError.message : 'Unknown error'}` 
          },
          { status: 500 }
        );
      }
      
    } else {
      // 情况2：从backend本地文件复制（保持原有逻辑）
      const backendHeroPath = path.join(process.cwd(), '..', 'backend', 'uploads', 'hero.jpg');
      console.log('Attempting to copy from backend file:', backendHeroPath);
      
      try {
        // 检查源文件是否存在
        await access(backendHeroPath);
        console.log('Backend hero file exists, reading...');
        
        // 读取文件内容
        const fs = await import('fs/promises');
        sourceImageData = await fs.readFile(backendHeroPath);
        console.log('Successfully read backend hero file, size:', sourceImageData.byteLength, 'bytes');
        
      } catch (readError) {
        console.error('Failed to read backend hero file:', readError);
        
        if (readError instanceof Error && 'code' in readError && (readError as NodeJS.ErrnoException).code === 'ENOENT') {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Hero image not found in backend uploads directory. Please upload a hero image first.' 
            },
            { status: 404 }
          );
        }
        
        throw readError;
      }
    }
    
    // 保存到frontend目录
    const frontendHeroPath = path.join(process.cwd(), 'public', 'images', 'home', 'hero.jpg');
    console.log('Saving hero image to frontend path:', frontendHeroPath);
    
    try {
      // 确保目录存在
      const dir = path.dirname(frontendHeroPath);
      const fs = await import('fs/promises');
      await fs.mkdir(dir, { recursive: true });
      
      // 保存图片数据，处理不同的数据类型
      let bufferToWrite: Buffer;
      if (sourceImageData instanceof ArrayBuffer) {
        bufferToWrite = Buffer.from(sourceImageData);
      } else if (Buffer.isBuffer(sourceImageData)) {
        bufferToWrite = sourceImageData;
      } else {
        throw new Error('Invalid source image data type');
      }
      
      await writeFile(frontendHeroPath, bufferToWrite);
      
      console.log('Hero image synced successfully to frontend');
      
      return NextResponse.json({
        success: true,
        message: 'Hero image synced successfully to frontend',
        localPath: '/images/home/hero.jpg',
        sourceType: heroImageUrl ? 'R2' : 'backend-file'
      });
      
    } catch (saveError) {
      console.error('Failed to save hero image to frontend:', saveError);
      throw saveError;
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