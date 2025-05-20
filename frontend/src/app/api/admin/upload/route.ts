import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { mkdir } from 'fs/promises';

// 处理图片上传
export async function POST(request: NextRequest) {
  try {
    // 解析 multipart/form-data 请求
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadPath = formData.get('path') as string;
    const fileName = formData.get('filename') as string;
    
    if (!file || !uploadPath) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 创建存储路径
    // uploadPath应该是 "images/home"
    console.log('上传路径:', uploadPath);
    const uploadsDir = path.join(process.cwd(), 'public', uploadPath);
    
    try {
      await mkdir(uploadsDir, { recursive: true });
      console.log('创建目录:', uploadsDir);
    } catch (error) {
      console.error('创建目录失败:', error);
    }
    
    // 获取文件字节数据
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // 文件保存路径
    const finalFileName = fileName || file.name;
    const filePath = path.join(uploadsDir, finalFileName);
    console.log('文件将保存至:', filePath);
    
    // 保存文件
    await writeFile(filePath, buffer);
    
    // 返回成功信息和文件URL
    const fileUrl = `/${uploadPath}/${finalFileName}`;
    console.log('文件URL:', fileUrl);
    
    return NextResponse.json({ 
      success: true,
      message: '文件上传成功',
      url: fileUrl 
    });
    
  } catch (error) {
    console.error('文件上传处理错误:', error);
    return NextResponse.json(
      { error: `文件上传失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    );
  }
} 