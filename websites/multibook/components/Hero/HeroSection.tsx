import Navigation from '@/components/Navigation/Navigation';
import CarouselBackground from './CarouselBackground';
import { HeroSectionProps } from '@/lib/types';

interface HeroProps extends HeroSectionProps {
  logoUrl: string;
  bookConsultationText: string;
  interval: number;
}

export default function HeroSection({
  headline,
  subheadline,
  images,
  logoUrl,
  interval,
  bookConsultationText,
}: HeroProps) {
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Navigation is part of the hero section in the original design */}
      <Navigation logoUrl={logoUrl} bookConsultationText={bookConsultationText} />

      {/* Background Carousel - Behind everything */}
      <CarouselBackground images={images} interval={interval} />

      {/* Hero Content - Overlay on carousel */}
      <section className="relative flex-1 flex items-center z-[500] pointer-events-none">
        <div className="w-full px-8 md:px-12 lg:px-16">
          <div className="max-w-[35rem]">
            <p className="hero-text text-4xl md:text-5xl lg:text-[6.5em] font-bold leading-tight ml-0 md:ml-6 mt-20 md:mt-0">
              {headline}
            </p>
            <p className="hero-text text-lg md:text-[20px] lg:text-[22px] font-medium leading-relaxed mt-4 ml-0 md:ml-6">
              {subheadline}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
