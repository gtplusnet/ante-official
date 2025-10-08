'use client';

import { useEffect, useCallback, useState } from 'react';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { FeatureCardProps } from '@/lib/types';

interface FeaturesSectionProps {
  features: FeatureCardProps[];
  title?: string;
}

export default function FeaturesSection({ features, title }: FeaturesSectionProps) {
  // Debug: Log what data this component receives
  useEffect(() => {
    console.log('🔍 FeaturesSection received:', {
      featuresCount: features?.length || 0,
      features: features,
      hasValidFeatures: features && Array.isArray(features) && features.length > 0,
    });
  }, [features]);

  const [autoplayPlugin] = useState(() => Autoplay({ delay: 4000, stopOnInteraction: false }));
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: 'start',
      slidesToScroll: 1,
      containScroll: false,
    },
    [autoplayPlugin]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Safety check: ensure features is a valid array
  const validFeatures = features && Array.isArray(features) ? features : [];

  // If no features, show a message
  if (validFeatures.length === 0) {
    return (
      <section
        id="features"
        className="relative bg-white rounded-t-[60px] -mt-20 z-[750] pt-[70px] pb-8"
      >
        <div className="w-full">
          <h2 className="text-5xl md:text-6xl lg:text-[70px] font-bold text-center text-oxford-blue pb-5">
            {title}
          </h2>
          <div className="text-center py-20">
            <p className="text-xl text-gray-600">No features available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="features"
      className="relative bg-white rounded-t-[60px] -mt-20 z-[750] py-[40px] lg:py-[70px]"
    >
      <div className="w-full">
        {/* Title */}
        <h2 className="text-5xl md:text-6xl lg:text-[70px] font-bold text-center text-oxford-blue pb-5">
          {title}
        </h2>

        {/* Dots Navigation - Above carousel like original */}
        <div className="flex justify-center gap-[10px] pb-4 md:pb-10">
          {validFeatures.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`w-3 h-3 rounded-full border border-gray-800 cursor-pointer transition-all ${
                index === selectedIndex ? 'bg-gray-800' : 'bg-transparent hover:bg-gray-800/20'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Previous Button */}
          <button
            onClick={scrollPrev}
            className="absolute left-2 md:left-5 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 rounded-[4px] h-10 w-6 md:w-10 flex items-center justify-center transition-all"
            aria-label="Previous slide"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Carousel */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex mx-[5px]">
              {validFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] min-w-0 px-[15px] py-[20px]"
                >
                  <div
                    className="group relative overflow-hidden rounded-2xl bg-gray-100 h-[350px] transition-transform duration-300 ease-in-out hover:scale-[1.04]"
                    onMouseEnter={() => autoplayPlugin.stop()}
                    onMouseLeave={() => autoplayPlugin.play()}
                  >
                    {/* Image */}
                    <div className="relative w-full h-full">
                      {feature.image && (
                        <img
                          src={feature.image}
                          alt={feature.title}
                          className="object-cover"
                          style={{ position: 'absolute', width: '100%', height: '100%' }}
                        />
                      )}
                    </div>

                    {/* Content Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-black/20 to-transparent flex flex-col justify-center items-center p-6 text-center">
                      {/* Title and Description */}
                      <div>
                        <h3 className="text-white text-3xl font-bold mb-4">{feature.title}</h3>

                        {/* Description - always visible */}
                        <div className="overflow-hidden">
                          <p className="text-white w-64 md:w-80 text-sm leading-relaxed mb-4">
                            {feature.description}
                          </p>
                        </div>
                      </div>

                      {/* Divider */}
                      <div
                        className={`w-64 h-[1px] bg-white/50 mb-4 transition-all duration-300`}
                      ></div>

                      {/* Read More Link */}
                      <div className="relative z-10">
                        <Link
                          href="/services/features"
                          className="text-white text-sm font-medium hover:!text-multibook-yellow transition-colors duration-300 inline-block"
                        >
                          Read More
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={scrollNext}
            className="absolute right-2 md:right-5 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 rounded-[4px] h-10 w-6 md:w-10 flex items-center justify-center transition-all"
            aria-label="Next slide"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
