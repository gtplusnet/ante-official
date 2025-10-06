'use client';

import { useRef } from 'react';
import { useParallax } from '@/hooks/useParallax';

interface CompanyDefinitionProps {
  body?: string;
  backgroundImage: string;
}

export default function CompanyDefinition({ body, backgroundImage }: CompanyDefinitionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const parallaxOffset = useParallax(sectionRef, { speed: 0.2 });

  return (
    <section ref={sectionRef} className="relative min-h-[400px] sm:min-h-[600px] md:min-h-[800px] py-16 sm:py-20 md:py-24 flex items-center overflow-hidden">
      {/* Parallax Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          transform: `translateY(${parallaxOffset}px)`,
          height: '120%',
          top: '-10%'
        }}
      >
        <img
          src={backgroundImage}
          alt="About Us background"
          className="object-cover"
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="max-w-3xl mx-auto">
          {body ? (
            <div className="space-y-8">
              {(() => {
                // Split by double line breaks first, if not enough paragraphs, split by single line breaks
                let paragraphs = body.split('\n\n').filter(p => p.trim());
                if (paragraphs.length < 2) {
                  paragraphs = body.split('\n').filter(p => p.trim());
                }
                // If still one long paragraph, split by sentences into 4 parts
                if (paragraphs.length === 1) {
                  const sentences = body.match(/[^.!?]+[.!?]+/g) || [body];
                  const chunkSize = Math.ceil(sentences.length / 4);
                  paragraphs = [];
                  for (let i = 0; i < sentences.length; i += chunkSize) {
                    paragraphs.push(sentences.slice(i, i + chunkSize).join(' ').trim());
                  }
                }
                return paragraphs.slice(0, 4).map((paragraph, index) => (
                  <p key={index} className="text-white text-base sm:text-lg md:text-xl leading-relaxed mx-auto text-left">
                    {paragraph.trim()}
                  </p>
                ));
              })()}
            </div>
          ) : (
            <p className="text-white text-base sm:text-lg md:text-xl leading-relaxed text-left">
              Multibook is a comprehensive business management platform designed to streamline your operations and drive growth.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
