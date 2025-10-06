'use client';

import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

interface CoreValue {
  id: number;
  title: string;
  description: string;
  image: string;
}

interface CoreValuesProps {
  values: CoreValue[];
  title?: string;
}

export default function CoreValues({ values, title }: CoreValuesProps) {
  const [autoplayPlugin] = useState(() => Autoplay({ delay: 4000, stopOnInteraction: false }));
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: 'start',
      slidesToScroll: 1,
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

  if (values.length === 0) return null;

  return (
    <section id="features" className="relative bg-white z-[750] pt-[70px]">
      <div className="w-full">
        {/* Title */}
        <h2 className="text-5xl md:text-6xl lg:text-[70px] font-bold text-center text-oxford-blue pb-5">
          {title}
        </h2>

        {/* Dots Navigation - Above carousel like original */}
        <div className="flex justify-center gap-[10px] pb-4 md:pb-10">
          {values.map((_, index) => (
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
              {values.map((value, index) => (
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
                      <img
                        src={value.image}
                        alt={value.title}
                        className="object-cover"
                        style={{ position: 'absolute', width: '100%', height: '100%' }}
                      />
                    </div>

                    {/* Content Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-black/20 to-transparent flex flex-col justify-center items-center p-6 text-center">
                      {/* Title and Description Wrapper - now always visible */}
                      <div className="cursor-pointer">
                        <h3 className="text-white text-3xl font-bold mb-4">{value.title}</h3>

                        {/* Divider */}
                        <div className="w-64 h-[1px] mx-auto bg-white/50 mb-4"></div>

                        {/* Description - always visible */}
                        <div className="overflow-hidden max-h-40 opacity-100 transition-all duration-300">
                          <p className="text-white w-64 md:w-80 text-sm leading-relaxed mb-4">
                            {value.description}
                          </p>
                        </div>
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
