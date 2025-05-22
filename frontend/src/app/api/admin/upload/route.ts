import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { mkdir } from 'fs/promises';

// Check if in production environment
const isProduction = process.env.NODE_ENV === 'production';
// Backend API base URL - Use environment variables or default
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api';
// Remove trailing slash if present to ensure correct URL concatenation
const NORMALIZED_API_URL = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

// 改进的获取JWT token的函数，与用户上传保持一致的认证机制
function getAuthToken(request: NextRequest): string | null {
  // 优先使用Authorization头中的token，这与前端getAuthHeader()函数生成的头一致
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    console.log('Found JWT token in Authorization header');
    return authHeader.substring(7);
  }
  
  // 再尝试从cookies获取token
  const authCookie = request.cookies.get('jwt')?.value;
  if (authCookie) {
    console.log('Found JWT token in cookies');
    return authCookie;
  }
  
  console.log('No JWT token found in standard locations');
  return null;
}

// Handle image upload
export async function POST(request: NextRequest) {
  try {
    // Parse multipart/form-data request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadPath = formData.get('path') as string;
    const fileName = formData.get('filename') as string;
    
    // Also check for token in form data (as a fallback)
    const tokenFromForm = formData.get('token') as string;
    
    if (!file || !uploadPath) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // In production environment, forward request to backend API
    if (isProduction) {
      console.log('Production environment: Forwarding upload request to backend API');
      
      // 获取认证token，使用与用户上传相同的逻辑
      let token = getAuthToken(request);
      
      // 仅当没有获取到token时才使用表单数据中的token作为后备
      if (!token && tokenFromForm) {
        console.log('Using token from form data (fallback)');
        token = tokenFromForm;
      }
      
      if (!token) {
        console.warn('No authentication token found in headers, cookies, or form data');
        // 记录请求信息用于调试
        console.log('Available cookies:', [...request.cookies.getAll()].map(c => c.name));
        console.log('Available headers:', [...request.headers.entries()].map(([key, value]) => `${key}: ${key.toLowerCase() === 'authorization' ? 'REDACTED' : value}`));
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      } else {
        console.log('Authentication token found, length:', token.length);
      }
      
      // Create new FormData to forward the request
      const newFormData = new FormData();
      newFormData.append('file', file);
      newFormData.append('path', uploadPath);
      if (fileName) {
        newFormData.append('filename', fileName);
      }
      
      try {
        // Ensure correct API path
        const uploadEndpoint = `${NORMALIZED_API_URL}/submissions/admin/upload`;
        console.log('Using upload endpoint:', uploadEndpoint);
        
        // Prepare headers with authentication
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Call backend API for upload
        const response = await fetch(uploadEndpoint, {
          method: 'POST',
          body: newFormData,
          headers,
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Backend upload API returned error:', response.status, errorText);
          return NextResponse.json({ 
            error: `Upload failed: Server returned ${response.status}` 
          }, { status: response.status });
        }
        
        // Return backend API response
        const result = await response.json();
        return NextResponse.json(result);
      } catch (error) {
        console.error('Failed to call backend upload API:', error);
        return NextResponse.json({ 
          error: `Failed to upload to backend server: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }, { status: 500 });
      }
    }
    
    // Local development environment: Save to local filesystem
    console.log('Development environment: Saving file to local filesystem');
    
    // Create storage path
    console.log('Upload path:', uploadPath);
    const uploadsDir = path.join(process.cwd(), 'public', uploadPath);
    
    try {
      await mkdir(uploadsDir, { recursive: true });
      console.log('Created directory:', uploadsDir);
    } catch (error) {
      console.error('Failed to create directory:', error);
    }
    
    // Get file byte data
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // File save path
    const finalFileName = fileName || file.name;
    const filePath = path.join(uploadsDir, finalFileName);
    console.log('File will be saved to:', filePath);
    
    // Save file
    await writeFile(filePath, buffer);
    
    // Return success info and file URL
    const fileUrl = `/${uploadPath}/${finalFileName}`;
    console.log('File URL:', fileUrl);
    
    return NextResponse.json({ 
      success: true,
      message: 'File uploaded successfully',
      url: fileUrl 
    });
    
  } catch (error) {
    console.error('File upload processing error:', error);
    return NextResponse.json(
      { error: `File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 