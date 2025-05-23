import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { homePageConfig } from '@/lib/config';

// 获取主页配置 - 公开API，不需要身份验证
export async function GET(request: NextRequest) {
  try {
    // 打印cookie和头信息用于调试
    console.log('Config API cookies:', [...request.cookies.getAll()].map(c => c.name));
    console.log('Config API headers:', [...request.headers.entries()].map(([key, value]) => 
      `${key}: ${key.toLowerCase() === 'authorization' ? 'REDACTED' : value}`));
    
    // 检查是否强制刷新
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('_force') === '1';
    console.log('Force refresh requested:', forceRefresh);
    
    // 尝试从文件读取配置
    const configPath = path.join(process.cwd(), 'public', 'config', 'homepage.json');
    let config;
    let lastModified = new Date().toISOString(); // 默认当前时间

    try {
      const fileContent = await fs.readFile(configPath, 'utf-8');
      config = JSON.parse(fileContent);
      
      // 获取文件修改时间
      const stats = await fs.stat(configPath);
      lastModified = stats.mtime.toISOString();
    } catch {
      // 如果文件不存在或无法解析，使用默认配置
      config = { heroImage: homePageConfig.heroImage };
      console.log('未找到配置文件，使用默认配置');
    }
    
    // 生成基于内容和修改时间的ETag
    const etag = `"${Buffer.from(lastModified + JSON.stringify(config)).toString('base64').slice(0, 16)}"`;
    
    // 强制刷新时跳过缓存检查
    if (!forceRefresh) {
      // 检查客户端缓存
      const clientETag = request.headers.get('if-none-match');
      if (clientETag === etag) {
        return new NextResponse(null, { status: 304 }); // 未修改，返回304
      }
    }
    
    // 创建响应对象并添加缓存控制响应头
    const response = NextResponse.json({
      success: true,
      config
    });
    
    // 强制刷新时设置无缓存头，否则使用正常缓存策略
    if (forceRefresh) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      console.log('Set no-cache headers for force refresh');
    } else {
      // 设置缓存头和ETag，配置更新后会自动失效缓存
      response.headers.set('Cache-Control', 'public, max-age=3600'); // 1小时缓存
      response.headers.set('ETag', etag);
    }
    
    response.headers.set('Last-Modified', lastModified);
    
    return response;
  } catch (error) {
    console.error('获取配置失败:', error);
    return NextResponse.json(
      { 
        error: `获取配置失败: ${error instanceof Error ? error.message : '未知错误'}`,
        // 返回默认配置作为回退
        config: { heroImage: homePageConfig.heroImage }
      },
      { status: 500 }
    );
  }
} 