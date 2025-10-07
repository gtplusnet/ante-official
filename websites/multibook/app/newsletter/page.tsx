import { Metadata } from 'next';
import { anteClient } from '@/lib/strapi';
import { extractFirstSentence } from '@/lib/utils';
import NavigationWrapper from '@/components/Navigation/NavigationWrapper';
import NewsletterHero from '@/components/Newsletter/NewsletterPage/NewsletterHero';
import NewsletterList from '@/components/Newsletter/NewsletterPage/NewsletterList';
import PageHeader from '@/components/PageHeader/PageHeader';

// Force dynamic rendering (SSR) instead of static generation (SSG)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Newsletter - Multibook',
    description: "Stay updated with Multibook's latest news, updates, and industry insights.",
    keywords: 'multibook newsletter, news, updates, industry insights',
  };
}

export default async function NewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  let currentPage = 1;
  let params: { page?: string } = {};

  try {
    params = await searchParams;
    if (params?.page) {
      const parsed = parseInt(params.page, 10);
      if (!isNaN(parsed) && parsed > 0) {
        currentPage = parsed;
      }
    }
  } catch {
    // Silently fall back to page 1
  }

  const pageSize = 6;

  // Fetch data using anteClient
  const [newsletterRes, newsletterPageRes] = await Promise.all([
    anteClient.getNewsletterContent({
      page: currentPage,
      pageSize: pageSize,
      withCount: true,
    }),
    anteClient.getNewsletterPage(),
  ]);

  const newsletterData = newsletterRes.data || [];
  const newsletterPageData = newsletterPageRes.data;
  const pagination = newsletterRes.meta?.pagination || { pageCount: 1 };

  // Transform newsletter data to match component expectations
  const newsletters = newsletterData.map((item: any) => ({
    id: item.id,
    documentId: item.attributes?.documentId || item.id,
    title: item.attributes?.title || '',
    imageUrl: item.attributes?.backgroundCover?.url
      ? item.attributes.backgroundCover.url
      : item.attributes?.backgroundCover?.variants?.large?.webp?.url
      ? item.attributes.backgroundCover.variants.large.webp.url
      : '/images/LandingPageAssets/NewsLetter-img1.png',
    readMoreText: item.attributes?.readMoreButton || 'Read More',
    contentPreview:
      item.attributes?.subtitle || extractFirstSentence(item.attributes?.content || ''),
  }));

  // Get background image from newsletterPage API
  const backgroundImage = newsletterPageData.attributes.backgroundCover?.url;
  const pageTitle = newsletterPageData.attributes.pageTitle;
  console.log('pageTitle', pageTitle);

  return (
    <>
      <NavigationWrapper />

      <PageHeader />

      <NewsletterHero title={pageTitle} backgroundImage={backgroundImage} />

      <div className="bg-[#f9fafb]">
        <NewsletterList
          newsletters={newsletters}
          currentPage={currentPage}
          totalPages={pagination.pageCount}
        />
      </div>
    </>
  );
}
