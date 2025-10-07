import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { anteClient } from '@/lib/strapi';

// Force dynamic rendering (SSR) instead of static generation (SSG)
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import NavigationWrapper from '@/components/Navigation/NavigationWrapper';
import PageHeader from '@/components/PageHeader/PageHeader';
import NewsletterDetail from '@/components/Newsletter/NewsletterPage/NewsletterDetail';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    // First fetch all newsletters to find the one with matching ID
    const newslettersRes = await anteClient.getNewsletterContent();
    const newsletter = newslettersRes.data?.find((item: any) => String(item.id) === id);

    if (!newsletter) {
      return {
        title: 'Newsletter Not Found - Multibook',
      };
    }

    return {
      title: `${
        newsletter?.attributes?.title || newsletter?.attributes?.header || 'Newsletter'
      } - Multibook`,
      description: newsletter?.attributes?.subtitle || newsletter?.attributes?.description || '',
    };
  } catch {
    return {
      title: 'Newsletter - Multibook',
    };
  }
}

export default async function NewsletterDetailPage({ params }: PageProps) {
  const { id } = await params;
  try {
    // Fetch all necessary data
    const [newslettersRes] = await Promise.all([anteClient.getNewsletterContent()]);
    // Find the newsletter with matching ID
    const newsletter = newslettersRes.data?.find((item: any) => String(item.id) === id);

    if (!newsletter) {
      console.error('Newsletter not found for ID:', id);
      console.error(
        'Available newsletters:',
        newslettersRes.data?.map((item: any) => ({
          id: item.id,
          documentId: item.attributes?.documentId,
        }))
      );
      notFound();
    }

    return (
      <>
        <NavigationWrapper />

        {/* Page Header with gradient background */}
        <PageHeader />

        {/* Newsletter Content */}
        <div className="bg-white rounded-t-[60px] relative -mt-[60px] z-[5]">
          <NewsletterDetail
            title={newsletter?.attributes?.title || newsletter?.attributes?.header || ''}
            date={newsletter?.attributes?.publishedDate || newsletter?.createdAt}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            content={
              (newsletter?.attributes?.content as any) ||
              newsletter?.attributes?.description ||
              newsletter?.attributes?.subtitle ||
              []
            }
            coverImage={
              newsletter?.attributes?.backgroundCover?.url
                ? anteClient.getMediaUrl(newsletter.attributes.backgroundCover.url)
                : newsletter?.attributes?.backgroundCover?.variants?.large?.webp?.url
                ? anteClient.getMediaUrl(
                    newsletter.attributes.backgroundCover.variants.large.webp.url
                  )
                : newsletter?.attributes?.Image?.url
                ? anteClient.getMediaUrl(newsletter.attributes.Image.url)
                : ''
            }
            documentId={newsletter?.attributes?.documentId || id}
            recentArticles={[]}
          />
        </div>
      </>
    );
  } catch {
    console.error('Error fetching newsletter detail');
    notFound();
  }
}
