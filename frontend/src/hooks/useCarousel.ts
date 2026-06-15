import { useState, useEffect, useCallback, useRef } from 'react';
import { CarouselState } from '@/api/gallery/types';

interface UseCarouselProps {
  itemCount: number;
  autoplayInterval?: number;
  enabled?: boolean;
}

interface UseCarouselReturn extends CarouselState {
  nextSlide: () => void;
  previousSlide: () => void;
  goToSlide: (index: number) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  setHovered: (hovered: boolean) => void;
  resetError: () => void;
}

const clampSlide = (slide: number, itemCount: number) => {
  if (itemCount <= 0) return 0;
  return Math.min(Math.max(slide, 0), itemCount - 1);
};

/**
 * Custom hook for carousel state management and navigation
 */
export function useCarousel({
  itemCount,
  autoplayInterval = 5000,
  enabled = true,
}: UseCarouselProps): UseCarouselReturn {

  const [state, setState] = useState<CarouselState>({
    currentSlide: 0,
    isPlaying: enabled,
    isHovered: false,
    isLoading: false,
    error: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastInteractionRef = useRef<number>(0);

  useEffect(() => {
    lastInteractionRef.current = Date.now();
  }, []);

  // Clear interval helper
  const clearAutoplay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start autoplay helper
  const startAutoplay = useCallback(() => {
    if (!enabled || itemCount <= 1 || state.isHovered) return;

    clearAutoplay();
    intervalRef.current = setInterval(() => {
      // Check if user has interacted recently (within 10 seconds)
      const timeSinceInteraction = Date.now() - lastInteractionRef.current;
      if (timeSinceInteraction < 10000) return;

      setState(prev => {
        const currentSlide = clampSlide(prev.currentSlide, itemCount);

        return {
          ...prev,
          currentSlide: (currentSlide + 1) % itemCount,
        };
      });
    }, autoplayInterval);
  }, [enabled, itemCount, autoplayInterval, state.isHovered, clearAutoplay]);

  // Navigation functions
  const nextSlide = useCallback(() => {
    if (itemCount <= 0) return;

    lastInteractionRef.current = Date.now();
    setState(prev => {
      const currentSlide = clampSlide(prev.currentSlide, itemCount);

      return {
        ...prev,
        currentSlide: (currentSlide + 1) % itemCount,
      };
    });
  }, [itemCount]);

  const previousSlide = useCallback(() => {
    if (itemCount <= 0) return;

    lastInteractionRef.current = Date.now();
    setState(prev => {
      const currentSlide = clampSlide(prev.currentSlide, itemCount);

      return {
        ...prev,
        currentSlide: currentSlide === 0 ? itemCount - 1 : currentSlide - 1,
      };
    });
  }, [itemCount]);

  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < itemCount) {
      lastInteractionRef.current = Date.now();
      setState(prev => ({
        ...prev,
        currentSlide: index,
      }));
    }
  }, [itemCount]);

  // Playback controls
  const play = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: true }));
  }, []);

  const pause = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false }));
    clearAutoplay();
  }, [clearAutoplay]);

  const toggle = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  // Hover state management
  const setHovered = useCallback((hovered: boolean) => {
    setState(prev => ({ ...prev, isHovered: hovered }));
  }, []);

  // Error handling
  const resetError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Autoplay effect
  useEffect(() => {
    if (state.isPlaying && !state.isHovered && itemCount > 1) {
      startAutoplay();
    } else {
      clearAutoplay();
    }

    return clearAutoplay;
  }, [state.isPlaying, state.isHovered, itemCount, startAutoplay, clearAutoplay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAutoplay();
    };
  }, [clearAutoplay]);

  const currentSlide = clampSlide(state.currentSlide, itemCount);

  return {
    ...state,
    currentSlide,
    nextSlide,
    previousSlide,
    goToSlide,
    play,
    pause,
    toggle,
    setHovered,
    resetError,
  };
}

export default useCarousel;
