'use client';

import { Container } from '@/components/ui/Container';

export default function GalleryPage() {
  return (
    <Container className="py-8">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">
          图片画廊
        </h1>
        <div className="max-w-2xl mx-auto">
          <p className="text-xl text-gray-600 mb-8">
            精选摄影作品展示即将上线
          </p>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Coming Soon
            </h2>
            <p className="text-gray-600">
              我们正在精心策划一个美丽的图片画廊，展示社区中最优秀的摄影作品。
              敬请期待！
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
} 