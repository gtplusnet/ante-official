'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useParallax } from '@/hooks/useParallax';

interface MarketSectionProps {
  backgroundImage?: string;
  title?: string;
  subtitle?: string;
}

export default function MarketSection({
  backgroundImage = '/images/bg-2.jpg',
  title = 'Try it out today.',
  subtitle = '',
}: MarketSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const parallaxOffset = useParallax(sectionRef, { speed: 0.4 });

  return (
    <section
      ref={sectionRef}
      className="relative h-[80vh] md:h-[700px] flex items-center overflow-hidden"
    >
      {/* Background Image with Parallax Effect */}
      <div
        className="absolute inset-0 z-0"
        style={{
          transform: `translateY(${parallaxOffset}px)`,
          height: '120%',
          top: '-10%',
        }}
      >
        <img
          src={backgroundImage}
          alt="Market background"
          className="object-cover"
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full h-full flex items-center px-8 md:px-12 lg:px-16">
        <div className="w-full md:w-1/2">
          {subtitle && <h4 className="text-white text-lg mb-4 mt-12">{subtitle}</h4>}
          <h1
            className="text-white text-[clamp(2rem,5vw,4rem)] w-full md:w-[80%] font-bold leading-tight mb-10"
            style={{ letterSpacing: '-1.5px' }}
          >
            {title}
          </h1>
        </div>
      </div>
    </section>
  );
}
