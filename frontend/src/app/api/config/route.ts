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
    // 尝试从文件读取配置
    const configPath = path.join(process.cwd(), 'public', 'config', 'homepage.json');
    let config;

    try {
      const fileContent = await fs.readFile(configPath, 'utf-8');
      config = JSON.parse(fileContent);
    } catch {
      // 如果文件不存在或无法解析，使用默认配置
      config = { heroImage: homePageConfig.heroImage };
      console.log('未找到配置文件，使用默认配置');
    }
    
    // 创建响应对象并添加缓存控制响应头
    const response = NextResponse.json({
      success: true,
      config
    });
    
    // 设置缓存头，允许浏览器缓存响应24小时
    response.headers.set('Cache-Control', 'public, max-age=86400');
    
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