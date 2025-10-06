import { strapiClient } from '@/lib/strapi';

export async function fetchRecentNewsletterArticles(documentId?: string) {
  try {
    const newsletterRes = await strapiClient.getNewsletterContent({
      pageSize: 10
    });

    if (!newsletterRes.data || newsletterRes.data.length === 0) {
      return [];
    }

    const newsletters = newsletterRes.data.map((item) => ({
      id: item.id,
      documentId: item.documentId,
      title: item.Title || item.Header || '',
      imageUrl: item.Cover?.url 
        ? strapiClient.getMediaUrl(item.Cover.url)
        : item.Image?.url 
        ? strapiClient.getMediaUrl(item.Image.url)
        : '/images/LandingPageAssets/NewsLetter-img1.png',
      readMoreText: item.ReadMoreButton || 'Read More',
    }));

    // Filter out the current article if documentId is provided
    return documentId 
      ? newsletters.filter(article => article.documentId !== documentId).slice(0, 3)
      : newsletters;
  } catch (error) {
    console.error('Error fetching newsletter articles:', error);
    return [];
  }
}
