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

  // Create reusable configuration loading function
  const loadConfig = useCallback(async (forceRefresh = false) => {
    try {
              // Add timestamp parameter when force refreshing to bypass cache
      const timestamp = Date.now();
      const url = forceRefresh 
        ? `/frontend-api/config?_t=${timestamp}&_force=1`
        : `/frontend-api/config?_t=${timestamp}`;
      
      const response = await fetch(url, {
        // Disable cache when force refreshing
        cache: forceRefresh ? 'no-store' : 'default',
        headers: forceRefresh ? {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        
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
              lastConfigUpdateRef.current = data.config.lastUpdated || new Date().toISOString();
              return newConfig;
            } else {
              return prevConfig;
            }
          });
        }
      }
    } catch {
      // Failed to load config
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial config load
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Poll for config updates every 30 seconds
  useEffect(() => {
    const pollingInterval = setInterval(() => {
      loadConfig();
    }, 30000);

    return () => clearInterval(pollingInterval);
  }, [loadConfig]);

  // Listen for localStorage changes to detect admin uploads
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hero_image_updated') {
        // Delay refresh by one second to ensure backend processing is complete
        setTimeout(() => {
          loadConfig(true);
        }, 1000);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadConfig]);

  // Listen for custom events (for communication within the same tab)
  useEffect(() => {
    const handleConfigUpdate = () => {
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
            // Pass configuration update time for forced image cache refresh
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