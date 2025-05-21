"use client";

// app/page.tsx
import { Container } from '@/components/ui/Container';
import { HeroImage } from '@/components/home/HeroImage';
import { AnimatedFooter } from '@/components/home/AnimatedFooter';
import { homePageConfig } from '@/lib/config';
import { useState, useEffect } from 'react';

export default function Home() {
  // State management
  const [config, setConfig] = useState(homePageConfig);
  const [isLoading, setIsLoading] = useState(true);

  // Load config from API
  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Add random query param to prevent cache
        const response = await fetch(`/api/config?t=${new Date().getTime()}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.config?.heroImage) {
            setConfig(prevConfig => ({
              ...prevConfig,
              heroImage: {
                ...prevConfig.heroImage,
                ...data.config.heroImage
              }
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load config:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []); // Empty dependency array, only run once on mount

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