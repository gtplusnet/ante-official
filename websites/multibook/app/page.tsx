import { Metadata } from 'next';
import {
  anteClient,
  type HeroImage,
  type Feature,
  type NewsletterItem,
  type IndustryLeader,
} from '@/lib/strapi';
import HeroSection from '@/components/Hero/HeroSection';
import FeaturesSection from '@/components/Features/FeaturesSection';
import MarketSection from '@/components/Market/MarketSection';
import PartnersSection from '@/components/Partners/PartnersSection';
import NewsletterSection from '@/components/Newsletter/NewsletterSection';
import CTASection from '@/components/CTA/CTASection';
import { CarouselItem, FeatureCardProps } from '@/lib/types';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const landingPageRes = await anteClient.getLandingPage();
    const landingData = landingPageRes.data;

    return {
      title: 'Home - Multibook',
      description:
        landingData?.attributes?.heroBannerSubHeadline ||
        'Multibook helps businesses streamline their operations with cutting-edge technology solutions.',
    };
  } catch {
    return {
      title: 'Home - Multibook',
      description:
        'Multibook helps businesses streamline their operations with cutting-edge technology solutions.',
    };
  }
}

// Force dynamic rendering (SSR) instead of static generation (SSG)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// This page uses Server Side Rendering (SSR) for SEO
export default async function Home() {
  try {
    // Fetch all data from Strapi in parallel
    const [
      landingPageRes,
      heroImagesRes,
      featuresRes,
      newsletterRes,
      industryLeadersRes,
      navigationData,
    ] = await Promise.all([
      anteClient.getLandingPage(),
      anteClient.getHeroImages(),
      anteClient.getFeatures(),
      anteClient.getNewsletterContent(),
      anteClient.getIndustryLeaders(),
      anteClient.getNavigationData(),
    ]);

    // Process hero images
    const heroImages: CarouselItem[] = (heroImagesRes.data || []).map(
      (item: HeroImage, index: number) => ({
        id: item.id || index,
        url: item.attributes?.backgroundCover?.variants?.xlarge?.webp?.url
          ? anteClient.getMediaUrl(item.attributes.backgroundCover.variants.xlarge.webp.url)
          : '',
        alt:
          item.attributes?.backgroundCover?.variants?.xlarge?.webp?.url ||
          `Hero image ${index + 1}`,
      })
    );

    // Process features - ensure proper serialization
    const features: FeatureCardProps[] = (featuresRes.data || []).map((item: Feature) => {
      const imageUrl = item.attributes?.image?.variants?.medium?.webp?.url || '';
      return {
        image: imageUrl ? anteClient.getMediaUrl(imageUrl) : '',
        title: String(item.attributes?.title || ''),
        description: String(item.attributes?.description || ''),
      };
    });

    // Get logo URL
    const logoUrl = navigationData?.data?.attributes?.logo?.url
      ? anteClient.getMediaUrl(navigationData.data.attributes.logo.url)
      : '/images/logo/desktop/full-color-1.png';

    // Process newsletter items - limit to 6 items for homepage, ensure serialization
    const newsletterItems = (newsletterRes.data || []).slice(0, 6).map((item: NewsletterItem) => {
      // Try both Image and Cover fields for the image
      const imageUrl =
        item.attributes?.Image?.url ||
        item.attributes?.backgroundCover?.variants?.square?.webp?.url ||
        '';

      // Extract description from Content array if Description field is empty
      let description = String(item.attributes?.description || '');
      if (!description && item.attributes?.content && Array.isArray(item.attributes.content)) {
        // Get first paragraph text from content
        const firstParagraph = item.attributes.content.find(
          (block: Record<string, unknown>) =>
            block.type === 'paragraph' &&
            (block.children as Array<Record<string, unknown>>)?.some(
              (child: Record<string, unknown>) => child.text && (child.text as string).trim()
            )
        );
        if (firstParagraph) {
          description = (firstParagraph.children as Array<Record<string, unknown>>)
            .map((child: Record<string, unknown>) => String(child.text || ''))
            .join('')
            .trim();
        }
      }

      return {
        id: String(item.id),
        documentId: String(item.attributes?.documentId || ''),
        image: imageUrl ? anteClient.getMediaUrl(imageUrl) : '',
        title: String(item.attributes?.header || item.attributes?.title || ''),
        description: String(item.attributes?.subtitle || description),
      };
    });

    // Process industry leaders - ensure proper serialization
    const industryLeaders = (industryLeadersRes.data || []).map((item: IndustryLeader) => {
      const logoUrl = item.attributes?.partnerLogo?.variants?.small?.webp?.url || '';
      return {
        id: Number(item.id),
        logo: logoUrl ? anteClient.getMediaUrl(logoUrl) : '',
      };
    });

    return (
      <main>
        {/* Hero Section with Navigation */}
        <HeroSection
          headline={landingPageRes.data?.attributes?.heroBannerHeadline || 'Welcome to Multibook'}
          subheadline={landingPageRes.data?.attributes?.heroBannerSubHeadline}
          interval={landingPageRes.data?.attributes?.carouselSpeedTransition || 5000}
          images={heroImages}
          logoUrl={logoUrl}
          bookConsultationText={
            navigationData?.data?.attributes?.buttonLabel || 'Book a Consultation'
          }
        />

        {/* Features Section */}
        <FeaturesSection
          title={landingPageRes.data?.attributes?.ourFeaturesTitle}
          features={features}
        />

        {/* Market/CTA Section */}
        <MarketSection
          title={landingPageRes.data?.attributes?.marketTitle}
          subtitle={landingPageRes.data?.attributes?.marketSubtitle}
          backgroundImage={
            landingPageRes.data?.attributes?.marketBackgroundCover?.variants?.large?.webp?.url
          }
        />

        {/* Partners Section */}
        <PartnersSection
          title={
            landingPageRes.data?.attributes?.partnerEndorsedBy || 'Endorsed by Industry Leaders'
          }
          scrollSpeed={landingPageRes.data?.attributes?.infiniteScrollSpeedForPartnersLogo?.toLowerCase() as 'slow' | 'normal' | 'fast' | 'very fast'}
          partnerTitle={landingPageRes.data?.attributes?.partnerTitle}
          subtitle={landingPageRes.data?.attributes?.partnerSubtitle}
          partners={industryLeaders}
        />

        {/* Newsletter Section */}
        <NewsletterSection
          title={landingPageRes.data?.attributes?.ourNewsletterTitle}
          items={newsletterItems}
        />

        {/* Final CTA Section */}
        <CTASection />
      </main>
    );
  } catch (error) {
    console.log('🔍 [SERVER] Error fetching homepage data:', error, {
      name: (error as any)?.name,
      message: (error as any)?.message,
      stack: (error as any)?.stack?.substring(0, 500),
    });

    // Proper fallback data with correct structure
    const fallbackFeatures: FeatureCardProps[] = [
      {
        image: '/images/fallback-feature.jpg',
        title: 'Advanced Analytics',
        description: 'Get insights into your business performance with real-time analytics.',
      },
      {
        image: '/images/fallback-feature.jpg',
        title: 'Secure Platform',
        description: 'Enterprise-grade security to protect your sensitive business data.',
      },
      {
        image: '/images/fallback-feature.jpg',
        title: 'Easy Integration',
        description: 'Seamlessly integrate with your existing business tools and workflows.',
      },
    ];

    const fallbackNewsletterItems = [
      {
        id: '1',
        documentId: 'fallback-1',
        image: '/images/fallback-news.jpg',
        title: 'Latest Business Insights',
        description: 'Stay updated with the latest trends in business technology.',
      },
      {
        id: '2',
        documentId: 'fallback-2',
        image: '/images/fallback-news.jpg',
        title: 'Product Updates',
        description: 'Learn about our latest product features and improvements.',
      },
    ];

    const fallbackIndustryLeaders = [
      { id: 1, logo: '/images/fallback-partner.jpg' },
      { id: 2, logo: '/images/fallback-partner.jpg' },
      { id: 3, logo: '/images/fallback-partner.jpg' },
    ];

    const fallbackHeroImages: CarouselItem[] = [
      { id: 'fallback-hero', url: '/images/bg-1.jpg', alt: 'Multibook Platform' },
    ];

    // Fallback content with proper component structure
    return (
      <main>
        <HeroSection
          headline="Welcome to Multibook"
          subheadline="Streamline your business operations with cutting-edge technology"
          images={fallbackHeroImages}
          interval={5000}
          logoUrl="/images/logo/desktop/full-color-1.png"
          bookConsultationText="Book a Consultation"
        />

        <FeaturesSection features={fallbackFeatures} />

        <MarketSection
          title="Transform Your Business Today"
          subtitle="Experience the power of modern business automation"
          backgroundImage="/images/bg-2.jpg"
        />

        <PartnersSection
          title="Endorsed by Industry Leaders"
          subtitle="Trusted by businesses worldwide"
          partners={fallbackIndustryLeaders}
        />

        <NewsletterSection items={fallbackNewsletterItems} />

        <CTASection />
      </main>
    );
  }
}
