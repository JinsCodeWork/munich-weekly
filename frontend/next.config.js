/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  experimental: {
    // Allow proxied multipart uploads (> default 10MB) to reach backend
    proxyClientMaxBodySize: '30mb'
  },
  turbopack: {
    root: __dirname
  },
  // 配置API代理
  async rewrites() {
    // 根据环境确定API后端地址
    const apiDestination = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

    // Dev: proxy /uploads to backend (LOCAL storage). Prod: CDN (do not break production).
    const uploadsBase =
      process.env.NODE_ENV === 'development'
        ? apiDestination.replace(/\/api\/?$/, '')
        : 'https://img.munichweekly.art';
    const uploadsDestination = `${uploadsBase}/uploads/:path*`;

    return [
      // 所有 /api/* 请求都代理到后端（简单方案）
      // 前端自己的API使用 /frontend-api/* 前缀来避免冲突
      {
        source: '/api/:path*',
        destination: `${apiDestination}/:path*`
      },
      {
        source: '/uploads/:path*',
        destination: uploadsDestination
      }
      // 注意：/images/*路径不需要rewrite，因为这是本地public目录中的静态文件
    ]
  },
  images: {
    // 允许使用本地静态图片
    unoptimized: process.env.NODE_ENV === 'development', // 开发环境不优化图片，直接使用静态文件
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos'
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        pathname: '/uploads/**'
      },
      {
        protocol: 'https',
        hostname: 'pub-42cc142968d044e0b7182fa9177333cf.r2.dev',
        pathname: '/munichweekly-photoupload/**'
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'img.munichweekly.art',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com'
      }
    ]
  }
}

module.exports = nextConfig;
