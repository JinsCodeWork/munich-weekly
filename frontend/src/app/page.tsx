"use client";

// app/page.tsx
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { HeroImage } from '@/components/home/HeroImage';
import { AnimatedFooter } from '@/components/home/AnimatedFooter';
import { homePageConfig } from '@/lib/config';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

export default function Home() {
  // State management
  const [config, setConfig] = useState(homePageConfig);
  const [isLoading, setIsLoading] = useState(true);
  const lastConfigUpdateRef = useRef<string | null>(null);

  // 创建可重复调用的配置加载函数
  const loadConfig = useCallback(async (forceRefresh = false) => {
    try {
      // 强制刷新时添加时间戳参数以绕过缓存
      const timestamp = Date.now();
      const url = forceRefresh 
        ? `/frontend-api/config?_t=${timestamp}&_force=1`
        : `/frontend-api/config?_t=${timestamp}`;
      
      const response = await fetch(url, {
        // 强制刷新时禁用缓存
        cache: forceRefresh ? 'no-store' : 'default',
        headers: forceRefresh ? {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        } : {}
      });
      
      console.log('Config API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded config data:', data);
        
        if (data.success && data.config?.heroImage) {
          // 使用函数式更新避免依赖当前state
          setConfig(prevConfig => {
            const newConfig = {
              ...prevConfig,
              heroImage: {
                ...prevConfig.heroImage,
                ...data.config.heroImage
              }
            };
            
            // 检查配置是否真正发生了变化
            const hasConfigChanged = 
              data.config.lastUpdated !== lastConfigUpdateRef.current ||
              JSON.stringify(newConfig.heroImage) !== JSON.stringify(prevConfig.heroImage);
              
            if (hasConfigChanged) {
              console.log('Config has changed, updating state');
              lastConfigUpdateRef.current = data.config.lastUpdated || new Date().toISOString();
              return newConfig;
            } else {
              console.log('Config unchanged, keeping current state');
              return prevConfig;
            }
          });
        }
      } else {
        console.error('Config API returned error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setIsLoading(false);
    }
  }, []); // 移除所有依赖，使用函数式更新避免依赖state

  // 初始加载配置
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // 添加定期轮询配置更新（每30秒检查一次）
  useEffect(() => {
    const pollingInterval = setInterval(() => {
      console.log('Polling for config updates...');
      loadConfig();
    }, 30000); // 30秒轮询一次

    return () => clearInterval(pollingInterval);
  }, [loadConfig]);

  // 监听 localStorage 变化，检测管理员上传
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hero_image_updated') {
        console.log('Detected hero image update event, force refreshing config...');
        // 延迟一秒后刷新，确保后端处理完成
        setTimeout(() => {
          loadConfig(true);
        }, 1000);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadConfig]);

  // 监听自定义事件（用于同一标签页内的通信）
  useEffect(() => {
    const handleConfigUpdate = () => {
      console.log('Detected config update event, refreshing...');
      loadConfig(true);
    };

    window.addEventListener('configUpdated', handleConfigUpdate);
    return () => window.removeEventListener('configUpdated', handleConfigUpdate);
  }, [loadConfig]);

  // Get home page content from config
  const { heroImage, introText } = config;

  return (
    <main className="min-h-screen bg-gray-50">
      {!isLoading && (
        <>
          <HeroImage 
            imageUrl={heroImage.imageUrl} 
            description={heroImage.description} 
            imageCaption={heroImage.imageCaption}
            // 传递配置更新时间，用于强制刷新图片缓存
            lastUpdated={lastConfigUpdateRef.current}
          />
          
          <Container className="py-16" spacing="standard">
            <div className="text-center">
              <h2 className="font-heading text-3xl font-semibold tracking-tight text-gray-900 mb-4">
                {introText.title}
              </h2>
              <p className="font-sans text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                {introText.description}
              </p>
              
              {/* Vote button */}
              <Link href="/vote">
                <Button 
                  variant="ghost" 
                  size="lg"
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all duration-200"
                >
                  Go to Vote
                </Button>
              </Link>
            </div>
          </Container>

          {/* Animated footer - only shown on home page */}
          <AnimatedFooter />
        </>
      )}
    </main>
  );
}