import { Metadata } from 'next';
import { anteClient } from '@/lib/strapi';
import NavigationWrapper from '@/components/Navigation/NavigationWrapper';
import FAQsHero from '@/components/FAQs/FAQsHero';
import FAQsList from '@/components/FAQs/FAQsList';
import PageHeader from '@/components/PageHeader/PageHeader';
import CTASection from '@/components/CTA/CTASection';

// Force dynamic rendering (SSR) instead of static generation (SSG)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Frequently Asked Questions - Multibook',
    description:
      "Find answers to common questions about Multibook's accounting software, deployment, and features.",
    keywords: 'multibook faq, frequently asked questions, help, support',
  };
}

export default async function FAQsPage() {
  try {
    // Fetch all necessary data
    const [faqsRes] = await Promise.all([anteClient.getFAQs()]);
    const faqPageRes = await anteClient.getFAQPage();
    console.log('faqPageRes', faqPageRes);

    const backgroundCover = anteClient.getMediaUrl(faqPageRes.data.attributes.backgroundCover.url);

    const pageTitle = faqPageRes.data.attributes.pageTitle;
    const faqsData = faqsRes.data || [];

    return (
      <>
        <NavigationWrapper />

        <PageHeader />

        <FAQsHero backgroundCover={backgroundCover} pageTitle={pageTitle} />

        <FAQsList faqs={faqsData} />

        <CTASection />
      </>
    );
  } catch (error) {
    console.error('Error fetching FAQs data:', error);

    // Fallback content
    return (
      <>
        <NavigationWrapper />
        <main className="min-h-screen flex items-center justify-center">
          <p className="text-xl text-gray-600">Unable to load content. Please try again later.</p>
        </main>
      </>
    );
  }
}
