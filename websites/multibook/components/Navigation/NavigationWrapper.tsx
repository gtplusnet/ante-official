import { anteClient } from '@/lib/strapi';
import Navigation from './Navigation';

export default async function NavigationWrapper() {
  let logoUrl = '/images/logo/desktop/full-color.png';
  let bookConsultationText = 'Book a Consultation';

  try {
    const navigationRes = await anteClient.getNavigationData();
    const navigationData = navigationRes.data;

    if (navigationData?.attributes?.logo?.url) {
      logoUrl = anteClient.getMediaUrl(navigationData.attributes.logo.url);
    }

    if (navigationData?.attributes?.buttonLabel) {
      bookConsultationText = navigationData.attributes.buttonLabel;
    }
  } catch (error) {
    console.warn('Failed to fetch navigation data:', error);
  }

  return <Navigation logoUrl={logoUrl} bookConsultationText={bookConsultationText} />;
}