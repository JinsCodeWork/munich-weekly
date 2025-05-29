"use client";

import { useState, useEffect } from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { MasonryGallery } from '@/components/ui/MasonryGallery';
import { MasonrySubmissionCard } from '@/components/submission/MasonrySubmissionCard';
import { layoutApi } from '@/api';
import { SubmissionStatus, type Submission } from '@/types/submission';

export default function TestBackendMasonryPage() {
  const [testIssueId, setTestIssueId] = useState<number>(1);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  // 加载真实投稿数据
  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        // 这里使用真实的submissionsApi或者简化的mock数据
        const mockSubmissions: Submission[] = [
          {
            id: 1,
            imageUrl: "https://picsum.photos/800/600?random=1",
            description: "测试图片1 - 4:3比例",
            status: SubmissionStatus.APPROVED,
            submittedAt: new Date().toISOString(),
            isCover: false,
            voteCount: 15,
            issue: { 
              id: testIssueId, 
              title: "测试期刊",
              description: "用于测试后端Masonry布局的期刊",
              submissionStart: "2024-01-01T00:00:00Z",
              submissionEnd: "2024-01-31T23:59:59Z",
              votingStart: "2024-02-01T00:00:00Z",
              votingEnd: "2024-02-28T23:59:59Z",
              createdAt: "2024-01-01T00:00:00Z"
            },
            userId: 1,
            userVote: null
          },
          {
            id: 2,
            imageUrl: "https://picsum.photos/1200/600?random=2",
            description: "测试宽图 - 2:1比例",
            status: SubmissionStatus.APPROVED,
            submittedAt: new Date().toISOString(),
            isCover: false,
            voteCount: 23,
            issue: { 
              id: testIssueId, 
              title: "测试期刊",
              description: "用于测试后端Masonry布局的期刊",
              submissionStart: "2024-01-01T00:00:00Z",
              submissionEnd: "2024-01-31T23:59:59Z",
              votingStart: "2024-02-01T00:00:00Z",
              votingEnd: "2024-02-28T23:59:59Z",
              createdAt: "2024-01-01T00:00:00Z"
            },
            userId: 2,
            userVote: null
          }
        ];
        setSubmissions(mockSubmissions);
      } catch (error) {
        console.error('加载投稿数据失败:', error);
        setSubmissions([]);
      }
    };

    loadSubmissions();
  }, [testIssueId]);
  
  const handleSubmissionClick = (submission: Submission) => {
    console.log(`🎯 点击投稿查看详情:`, submission.id);
  };

  const testDirectApi = async () => {
    try {
      console.log('🧪 测试直接API调用...');
      const result = await layoutApi.getMasonryOrdering(testIssueId);
      console.log('✅ 直接API调用成功:', result);
      alert(`API测试成功! 2列序列包含 ${result.order.orderedIds2col.length} 个物品，4列序列包含 ${result.order.orderedIds4col.length} 个物品`);
    } catch (error) {
      console.error('❌ 直接API调用失败:', error);
      alert(`API测试失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testDebugEndpoint = async () => {
    try {
      console.log('🔍 测试Debug端点...');
      // 简化debug调用，不再需要viewport参数
      const response = await fetch('/api/layout/debug?issueId=' + testIssueId);
      const result = await response.json();
      console.log('✅ Debug端点调用成功:', result);
      alert(`Debug测试成功! 查看控制台获取详细信息`);
    } catch (error) {
      console.error('❌ Debug端点调用失败:', error);
      alert(`Debug测试失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Container className="py-8" spacing="standard">
      <div className="space-y-8">
        {/* 标题和控制面板 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            后端Masonry布局测试
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            验证后端布局计算API和组件集成
          </p>
          
          {/* 测试控制 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">测试控制</h3>
            <div className="flex justify-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <label htmlFor="issueId" className="text-sm font-medium text-gray-700">
                  Issue ID:
                </label>
                <input
                  id="issueId"
                  type="number"
                  value={testIssueId}
                  onChange={(e) => setTestIssueId(Number(e.target.value))}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <Button onClick={testDirectApi} variant="secondary" size="sm">
                🧪 测试直接API
              </Button>
              <Button onClick={testDebugEndpoint} variant="secondary" size="sm">
                🔍 测试Debug端点
              </Button>
            </div>
          </div>
        </div>

        {/* 后端Masonry布局展示 */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
            后端布局组件测试
          </h2>
          <p className="text-center text-gray-600 mb-6">
            使用模拟数据测试 MasonryGallery 组件 ({submissions.length} 个物品)
          </p>
          
          <MasonryGallery
            issueId={testIssueId}
            items={submissions}
            getImageUrl={(submission) => submission.imageUrl}
            getSubmissionId={(submission) => submission.id}
            renderItem={(submission, isWide, aspectRatio) => (
              <MasonrySubmissionCard
                submission={submission}
                isWide={isWide}
                aspectRatio={aspectRatio}
                displayContext="voteView"
                onVoteSuccess={(submissionId, newVoteCount) => {
                  console.log(`🗳️ 测试投票成功: submission ${submissionId}, new count: ${newVoteCount}`);
                  // 更新本地状态模拟投票
                  setSubmissions(prev => prev.map(sub => 
                    sub.id === submissionId 
                      ? { ...sub, voteCount: newVoteCount || sub.voteCount }
                      : sub
                  ));
                }}
                onVoteCancelled={(submissionId, newVoteCount) => {
                  console.log(`🗳️ 测试投票取消: submission ${submissionId}, new count: ${newVoteCount}`);
                  // 更新本地状态模拟投票
                  setSubmissions(prev => prev.map(sub => 
                    sub.id === submissionId 
                      ? { ...sub, voteCount: newVoteCount || sub.voteCount }
                      : sub
                  ));
                }}
              />
            )}
            onItemClick={handleSubmissionClick}
            loadingComponent={
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-lg text-gray-600">🔄 正在计算后端布局...</p>
                <p className="mt-2 text-sm text-blue-500">后端精确计算中，请查看服务器日志</p>
              </div>
            }
            emptyComponent={
              <div className="text-center text-gray-500 py-12">
                <p>📭 没有可用的投稿</p>
              </div>
            }
            errorComponent={(errors, onRetry) => (
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">
                  <p className="text-lg font-semibold">❌ 后端布局计算失败</p>
                  {errors.length > 0 && (
                    <p className="text-sm mt-2">{errors[0]}</p>
                  )}
                </div>
                <Button onClick={onRetry} variant="secondary">
                  🔄 重试后端布局计算
                </Button>
              </div>
            )}
          />
        </div>

        {/* 使用说明 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-4">💡 测试说明</h3>
          <div className="text-sm text-yellow-800 space-y-2">
            <p>• 此页面使用模拟数据测试后端Masonry布局API</p>
            <p>• 查看浏览器控制台获取详细的API调用日志</p>
            <p>• 查看后端服务器日志获取算法执行的详细Debug信息</p>
            <p>• 测试不同视口大小的响应式布局</p>
            <p>• 验证投票功能和交互效果</p>
          </div>
        </div>
      </div>
    </Container>
  );
} 