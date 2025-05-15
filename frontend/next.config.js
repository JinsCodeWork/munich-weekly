/** @type {import('next').NextConfig} */
const nextConfig = {
  // 配置API代理
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*' // 后端默认端口为8080
      }
    ]
  },
  images: {
    domains: ['picsum.photos']
  }
}

module.exports = nextConfig; 