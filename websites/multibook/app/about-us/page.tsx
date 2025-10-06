import { Metadata } from 'next';
import { anteClient } from '@/lib/strapi';
import PageHeader from '@/components/PageHeader/PageHeader';
import NavigationWrapper from '@/components/Navigation/NavigationWrapper';
import AboutVideo from '@/components/AboutUs/AboutVideo';
import CompanyDefinition from '@/components/AboutUs/CompanyDefinition';
import MissionVision from '@/components/AboutUs/MissionVision';
import CoreValues from '@/components/AboutUs/CoreValues';
import CEOMessage from '@/components/AboutUs/CEOMessage';
import CorporationInfo from '@/components/AboutUs/CorporationInfo';

// Force dynamic rendering (SSR) instead of static generation (SSG)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  try {
    const aboutUsRes = await anteClient.getAboutUs();
    const aboutData = aboutUsRes.data;

    // Ensure title always has " - Multibook" suffix
    let title = aboutData.pageTitle || 'About Us';
    if (!title.includes('Multibook')) {
      title = title + ' - Multibook';
    }

    return {
      title,
      description:
        aboutData.PageDescription ||
        'Learn about Multibook, a leading provider of cloud-based ERP solutions for businesses worldwide.',
      keywords:
        aboutData.PageKeywords ||
        'about multibook, ERP solutions, cloud accounting, business management',
    };
  } catch {
    return {
      title: 'About Us - Multibook',
      description:
        'Learn about Multibook, a leading provider of cloud-based ERP solutions for businesses worldwide.',
      keywords: 'about multibook, ERP solutions, cloud accounting, business management',
    };
  }
}

export default async function AboutUsPage() {
  try {
    // Fetch About Us data
    const aboutUsRes = await anteClient.getAboutUs();
    const aboutData = aboutUsRes.data;

    // Fetch Corporate Info data
    const corporateInfoRes = await anteClient.getCorporateInfoData();
    const corporateInfoData = corporateInfoRes.data;
    const corporateInfoBackgroundImage = corporateInfoData.attributes.backgroundCover?.url;

    // Corporate Company Info data
    const companyInfoRes = await anteClient.getCorporateInfo();
    const companyInfoData = companyInfoRes.data;

    // Corporate Info History data
    const corporateInfoHistoryRes = await anteClient.getCorporateInfoHistory();
    const corporateInfoHistoryData = corporateInfoHistoryRes.data;

    // Try to fetch core values but handle errors gracefully
    let coreValuesData: Array<{ id: number; title: string; description: string; image: string }> =
      [];
    try {
      const coreValuesRes = await anteClient.getCoreValues();
      coreValuesData = coreValuesRes.data.map((item) => ({
        id: item.id,
        title: item.Title,
        description: item.Description,
        image: item.CoverPhoto?.url || '',
      }));
    } catch (error) {
      console.warn('Core values data not available:', error);
      // Continue with empty core values
    }
    const backgroundImage = aboutData.backgroundCover?.url;
    const title = aboutData.pageTitle;

    return (
      <>
        <NavigationWrapper />

        {/* Hero background section for About Us */}
        <PageHeader />

        <main>
          {/* Video Section with About Us title */}
          <AboutVideo
            title={title}
            backgroundImage={backgroundImage}
            videoLink={aboutData.VideoLink}
          />

          {/* Company Definition with Parallax */}
          <CompanyDefinition
            body={aboutData.Body}
            backgroundImage={
              aboutData.AboutCover?.url
                ? anteClient.getMediaUrl(aboutData.AboutCover.url)
                : '/images/bg-1.jpg'
            }
          />

          {/* Mission & Vision */}
          <MissionVision
            missionTitle={aboutData.MissionTitle}
            visionTitle={aboutData.VisionTitle}
            mission={aboutData.MissionBody}
            vision={aboutData.VisionBody}
          />

          {/* Core Values Carousel */}
          <CoreValues title={aboutData.coreValuesTitle} values={coreValuesData} />

          {/* CEO Message */}
          <CEOMessage
            title={aboutData.MessageFromTheCEOTitle}
            message={aboutData.MessageFromTheCEOBody || aboutData.CEOMessage}
            name={aboutData.CEOName}
            position={aboutData.JobPosition || aboutData.CEOPosition}
            picture={
              aboutData.CEOPicture?.url ? anteClient.getMediaUrl(aboutData.CEOPicture.url) : ''
            }
            backgroundImage={
              aboutData.CEOBackgroundCover?.url
                ? anteClient.getMediaUrl(aboutData.CEOBackgroundCover.url)
                : '/images/bg-1.jpg'
            }
          />

          {/* Corporation Info */}
          <CorporationInfo
            companyInfo={companyInfoData}
            title={corporateInfoData.attributes.headline}
            subHeadline={corporateInfoData.attributes.subHeadline}
            backgroundImage={corporateInfoBackgroundImage}
            historyTitle={corporateInfoData.attributes.historyTitle}
            historyEvents={corporateInfoHistoryData}
          />
        </main>
      </>
    );
  } catch {
    console.error('Error fetching about us data');

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
