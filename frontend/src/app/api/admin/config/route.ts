import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// 配置更新API
export async function POST(request: NextRequest) {
  try {
    // 获取请求数据
    const data = await request.json();
    
    if (!data) {
      return NextResponse.json({ error: '无效的请求数据' }, { status: 400 });
    }
    
    // 读取现有配置
    const configPath = path.join(process.cwd(), 'public', 'config', 'homepage.json');
    
    // 确保目录存在
    try {
      await fs.mkdir(path.dirname(configPath), { recursive: true });
    } catch (error) {
      console.error('创建配置目录失败:', error);
    }
    
    // 检查文件是否存在，不存在则创建初始配置
    let currentConfig = {};
    try {
      const fileContent = await fs.readFile(configPath, 'utf-8');
      currentConfig = JSON.parse(fileContent);
    } catch {
      // 文件不存在或无法解析，使用空对象
      console.log('未找到现有配置或配置无效，将创建新配置');
    }
    
    // 合并配置
    const newConfig = {
      ...currentConfig,
      ...data,
      lastUpdated: new Date().toISOString()
    };
    
    // 写入配置文件
    await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2), 'utf-8');
    
    return NextResponse.json({
      success: true,
      message: '配置已更新',
      config: newConfig
    });
    
  } catch (error) {
    console.error('配置更新处理错误:', error);
    return NextResponse.json(
      { error: `配置更新失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    );
  }
} 