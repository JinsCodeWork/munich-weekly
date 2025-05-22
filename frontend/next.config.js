/** @type {import('next').NextConfig} */
const nextConfig = {
  // 配置API代理
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*' // 后端默认端口为8080
      },
      {
        source: '/uploads/:path*',
        destination: 'https://img.munichweekly.art/uploads/:path*' // 使用CDN而不是本地后端
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