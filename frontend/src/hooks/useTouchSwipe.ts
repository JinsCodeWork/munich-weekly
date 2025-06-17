import { useRef, useCallback } from 'react';
import { SwipeData } from '@/api/gallery/types';

interface UseTouchSwipeProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
  threshold?: number; // Minimum distance for swipe
  velocityThreshold?: number; // Minimum velocity for swipe
  enabled?: boolean;
}

interface UseTouchSwipeReturn {
  onTouchStart: (event: React.TouchEvent) => void;
  onTouchMove: (event: React.TouchEvent) => void;
  onTouchEnd: (event: React.TouchEvent) => void;
}

/**
 * Custom hook for handling touch swipe gestures
 * Supports left/right swipes and tap detection
 */
export function useTouchSwipe({
  onSwipeLeft,
  onSwipeRight,
  onTap,
  threshold = 50,
  velocityThreshold = 0.3,
  enabled = true,
}: UseTouchSwipeProps): UseTouchSwipeReturn {
  
  const swipeDataRef = useRef<SwipeData | null>(null);
  const isSwipingRef = useRef(false);

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    if (!enabled || event.touches.length !== 1) return;

    const touch = event.touches[0];
    swipeDataRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      endX: touch.clientX,
      endY: touch.clientY,
      startTime: Date.now(),
      endTime: Date.now(),
    };
    
    isSwipingRef.current = false;
  }, [enabled]);

  const onTouchMove = useCallback((event: React.TouchEvent) => {
    if (!enabled || !swipeDataRef.current || event.touches.length !== 1) return;

    const touch = event.touches[0];
    swipeDataRef.current.endX = touch.clientX;
    swipeDataRef.current.endY = touch.clientY;
    swipeDataRef.current.endTime = Date.now();

    // Calculate distance moved
    const deltaX = Math.abs(touch.clientX - swipeDataRef.current.startX);
    const deltaY = Math.abs(touch.clientY - swipeDataRef.current.startY);

    // If horizontal movement is significant, consider it a swipe
    if (deltaX > 10 && deltaX > deltaY) {
      isSwipingRef.current = true;
      // Prevent scrolling during horizontal swipe
      event.preventDefault();
    }
  }, [enabled]);

  const onTouchEnd = useCallback(() => {
    if (!enabled || !swipeDataRef.current) return;

    const swipeData = swipeDataRef.current;
    const deltaX = swipeData.endX - swipeData.startX;
    const deltaY = swipeData.endY - swipeData.startY;
    const distance = Math.abs(deltaX);
    const duration = swipeData.endTime - swipeData.startTime;
    const velocity = distance / duration; // pixels per millisecond

    // Check if this qualifies as a swipe
    const isHorizontalSwipe = distance > threshold && 
                             Math.abs(deltaY) < distance / 2 && // More horizontal than vertical
                             velocity > velocityThreshold;

    if (isHorizontalSwipe) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    } else if (!isSwipingRef.current && distance < 10 && duration < 300) {
      // Consider it a tap if minimal movement and quick
      if (onTap) {
        onTap();
      }
    }

    // Reset state
    swipeDataRef.current = null;
    isSwipingRef.current = false;
  }, [enabled, threshold, velocityThreshold, onSwipeLeft, onSwipeRight, onTap]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}

export default useTouchSwipe; 