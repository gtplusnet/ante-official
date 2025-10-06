'use client';

import { useEffect, useState, useRef } from 'react';
import { CarouselItem } from '@/lib/types';
import { useParallax } from '@/hooks/useParallax';

interface CarouselBackgroundProps {
  images: CarouselItem[];
  interval?: number;
}

export default function CarouselBackground({ images, interval = 5000 }: CarouselBackgroundProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const parallaxOffset = useParallax(containerRef, { speed: 0.2 });

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  if (images.length === 0) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full overflow-hidden">
      {images.map((image, index) => (
        <div
          key={image.id}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            transform: `translateY(${parallaxOffset}px)`,
            height: '110%',
            top: '-5%'
          }}
        >
          <img
            src={image.url}
            alt={image.alt || `Slide ${index + 1}`}
            className="object-cover"
            style={{ position: 'absolute', width: '100%', height: '100%' }}
          />
        </div>
      ))}
    </div>
  );
}
