import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { homePageConfig } from '@/lib/config';

// 获取主页配置 - 公开API，不需要身份验证
export async function GET() {
  try {
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
    
    return NextResponse.json({
      success: true,
      config
    });
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