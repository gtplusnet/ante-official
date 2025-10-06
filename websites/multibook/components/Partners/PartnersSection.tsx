'use client';

interface Partner {
  id: number;
  logo: string;
}

interface PartnersSectionProps {
  title?: string;
  partnerTitle?: string;
  subtitle?: string;
  partners?: Partner[];
  scrollSpeed?: 'slow' | 'normal' | 'fast' | 'very fast';
}

const defaultPartners: Partner[] = [
  { id: 1, logo: '/images/logo/disney.png' },
  { id: 2, logo: '/images/logo/southern-comp.png' },
  { id: 3, logo: '/images/logo/upwork.png' },
  { id: 4, logo: '/images/logo/crazy.png' },
  { id: 5, logo: '/images/logo/zomato.png' },
  { id: 6, logo: '/images/logo/facebook.png' },
  { id: 7, logo: '/images/logo/linkedin.png' },
];

export default function PartnersSection({
  title,
  partnerTitle,
  subtitle,
  partners = defaultPartners,
  scrollSpeed = 'normal',
}: PartnersSectionProps) {
  // Duplicate partners for seamless infinite scroll effect
  const duplicatedPartners = [...partners, ...partners];

  // Map speed to animation class
  const speedClasses = {
    slow: 'animate-infinite-scroll-slow',
    normal: 'animate-infinite-scroll',
    fast: 'animate-infinite-scroll-fast',
    'very fast': 'animate-infinite-scroll-very-fast',
  };

  return (
    <section className="bg-white py-24 lg:py-32 overflow-hidden">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-oxford-blue">{title}</h2>
        <p className="mt-4 text-4xl md:text-7xl font-medium text-multibook-red">{partnerTitle}</p>
        {subtitle && (
          <p className="mt-4 text-lg px-4 md:text-2xl font-medium text-oxford-blue">{subtitle}</p>
        )}
      </div>

      {/* Infinite Scroll Container */}
      <div className="relative overflow-hidden">
        <div
          className={`flex ${speedClasses[scrollSpeed]} hover:[animation-play-state:paused] w-max`}
        >
          {duplicatedPartners.map((partner, index) => (
            <div key={`${partner.id}-${index}`} className="flex-shrink-0 px-8 md:px-12 inline-flex">
              <div>
                <img
                  src={partner.logo}
                  alt="partner logo"
                  className="h-12 md:h-16 w-auto object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
