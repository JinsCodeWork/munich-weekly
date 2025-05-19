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
        destination: 'http://localhost:8080/uploads/:path*' // 添加对上传文件的代理
      }
    ]
  },
  images: {
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
      }
    ]
  }
}

module.exports = nextConfig; 