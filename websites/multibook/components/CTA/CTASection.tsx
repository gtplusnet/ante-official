'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useParallax } from '@/hooks/useParallax';
import { anteClient } from '@/lib/strapi';

interface CTASectionProps {
  buttonText?: string;
  buttonLink?: string;
}

export default function CTASection({ buttonText, buttonLink = '/contact-us' }: CTASectionProps) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const isFeaturesPage = pathname === '/services/features';

  // Set default buttonText based on the current page
  const defaultButtonText = isLandingPage ? 'Get Started' : 'Book A Consultation';
  const displayButtonText = buttonText || defaultButtonText;
  const sectionRef = useRef<HTMLElement>(null);
  const parallaxOffset = useParallax(sectionRef, { speed: 0.2 });
  const [backgroundImage, setBackgroundImage] = useState<string>(
    '/images/multibook landing page assets-12.png'
  );

  useEffect(() => {
    const fetchCTACover = async () => {
      try {
        const ctaCover = await anteClient.getCTACover();
        if (ctaCover?.data?.attributes?.backgroundCover?.url) {
          setBackgroundImage(anteClient.getMediaUrl(ctaCover.data.attributes.backgroundCover.url));
        }
      } catch (error) {
        console.error('Error fetching CTA cover:', error);
      }
    };
    fetchCTACover();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[55vh] flex items-center justify-center overflow-hidden"
    >
      {/* Background Image with Parallax */}
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
          alt="CTA background"
          className="object-cover"
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />
        {/* Dark Overlay */}
        {isFeaturesPage && <div className="absolute inset-0 bg-black/40" />}
      </div>

      {/* CTA Button - Only show on features page */}
      {isFeaturesPage && (
        <div className="relative z-[2]">
          <Link
            href={buttonLink}
            className="inline-block bg-[#f1f06c] hover:bg-[#f1f177] active:bg-[#E8D03A] text-oxford-blue font-bold text-[20px] px-[50px] py-[15px] rounded-[50px] transition-all duration-300 shadow-[0_4px_15px_rgba(0,0,0,0.2)] hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)] active:translate-y-0 active:shadow-[0_2px_10px_rgba(0,0,0,0.15)]"
          >
            {displayButtonText}
          </Link>
        </div>
      )}
    </section>
  );
}
