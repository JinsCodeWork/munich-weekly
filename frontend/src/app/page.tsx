"use client";

// app/page.tsx
import { Container } from '@/components/ui/Container';
import { HeroImage } from '@/components/home/HeroImage';
import { AnimatedFooter } from '@/components/home/AnimatedFooter';
import { homePageConfig } from '@/lib/config';
import { useState, useEffect, useCallback } from 'react';

export default function Home() {
  // State management
  const [config, setConfig] = useState(homePageConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [lastConfigUpdate, setLastConfigUpdate] = useState<string | null>(null);

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
          const newConfig = {
            ...config,
            heroImage: {
              ...config.heroImage,
              ...data.config.heroImage
            }
          };
          
          // 检查配置是否真正发生了变化
          const hasConfigChanged = 
            data.config.lastUpdated !== lastConfigUpdate ||
            JSON.stringify(newConfig.heroImage) !== JSON.stringify(config.heroImage);
            
          if (hasConfigChanged) {
            console.log('Config has changed, updating state');
            setConfig(newConfig);
            setLastConfigUpdate(data.config.lastUpdated || new Date().toISOString());
          } else {
            console.log('Config unchanged, keeping current state');
          }
        }
      } else {
        console.error('Config API returned error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setIsLoading(false);
    }
  }, [config, lastConfigUpdate]);

  // 初始加载配置
  useEffect(() => {
    loadConfig();
  }, []);

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
            lastUpdated={lastConfigUpdate}
          />
          
          <Container className="py-16">
            <div className="text-center">
              <h2 className="font-heading text-3xl font-semibold tracking-tight text-gray-900 mb-4">
                {introText.title}
              </h2>
              <p className="font-sans text-lg text-gray-600 max-w-2xl mx-auto">
                {introText.description}
              </p>
            </div>
          </Container>

          {/* Animated footer - only shown on home page */}
          <AnimatedFooter />
        </>
      )}
    </main>
  );
}