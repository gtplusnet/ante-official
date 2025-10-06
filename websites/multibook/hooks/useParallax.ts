'use client';

import { useEffect, useState, RefObject } from 'react';

interface UseParallaxOptions {
  speed?: number;
  offset?: number;
}

export function useParallax(
  ref: RefObject<HTMLElement | null>,
  options: UseParallaxOptions = {}
): number {
  const { speed = 0.5, offset = 0 } = options;
  const [translateY, setTranslateY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate if element is in viewport
      const elementTop = rect.top;
      const elementBottom = rect.bottom;
      
      // Only apply parallax when element is visible
      if (elementBottom >= 0 && elementTop <= windowHeight) {
        // Calculate the parallax offset
        const scrolled = window.pageYOffset;
        const elementOffsetTop = ref.current.offsetTop;
        const parallaxOffset = (scrolled - elementOffsetTop + offset) * speed;
        
        setTranslateY(parallaxOffset);
      }
    };

    // Initial calculation
    handleScroll();

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [ref, speed, offset]);

  return translateY;
}