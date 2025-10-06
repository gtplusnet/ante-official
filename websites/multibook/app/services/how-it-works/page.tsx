import { Metadata } from 'next';
import { anteClient } from '@/lib/strapi';

// Force dynamic rendering (SSR) instead of static generation (SSG)
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import NavigationWrapper from '@/components/Navigation/NavigationWrapper';
import PageHeader from '@/components/PageHeader/PageHeader';
import KeyBenefits from '@/components/HowItWorks/KeyBenefits';
import RapidRemoteDeployment from '@/components/HowItWorks/RapidRemoteDeployment';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'How It Works - Multibook',
    description:
      'Discover how Multibook helps you streamline your business operations with seamless accounting and scalable growth.',
    keywords: 'how it works, multibook, business operations, accounting, deployment',
  };
}

export default async function HowItWorksPage() {
  try {
    // Fetch all necessary data in parallel
    const [howItWorksRes, keyBenefitsRes, deploymentRes] = await Promise.all([
      anteClient.getHowItWorks(),
      anteClient.getHowItWorksKeyBenefitsNew(),
      anteClient.getHowItWorksDeployment(),
    ]);

    // Extract data from the new Ante API response
    const howItWorksData = {
      Header: howItWorksRes.data.attributes.titleHeader,
      SubHeader: howItWorksRes.data.attributes.subHeader,
      DeploymentTitle: howItWorksRes.data.attributes.deploymentTitle,
      DeploymentSubTitle: howItWorksRes.data.attributes.deploymentSubtitle,
      TimelineImage: howItWorksRes.data.attributes.howItWorksTimelineImage,
      BeginOperation: 'Begin operation in approximately 2 months',
      BackgroundCover: howItWorksRes.data.attributes.backgroundCover,
      BenefitsTitle: howItWorksRes.data.attributes.benefitsTitle,
    };
    const keyBenefitsData = keyBenefitsRes.data || [];
    const deploymentData = deploymentRes.data || [];

    // Process key benefits from new API structure
    const keyBenefits = keyBenefitsData.map((item) => ({
      id: item.id,
      title: item.attributes.benefitsTitle || '',
      description: item.attributes.benefitsDescription || '',
    }));

    // Process deployment steps
    const deploymentSteps = deploymentData.map((item) => ({
      id: item.id,
      title: item.Title || '',
      description: item.Description || '',
    }));

    return (
      <>
        <NavigationWrapper />

        {/* Page Header with gradient background */}
        <PageHeader />

        <KeyBenefits
          header={howItWorksData.Header || 'How It Works'}
          subHeader={howItWorksData.SubHeader || 'Seamless accounting. Scalable growths.'}
          benefits={keyBenefits}
          backgroundCover={howItWorksData.BackgroundCover}
          benefitsTitle={howItWorksData.BenefitsTitle}
        />

        <RapidRemoteDeployment
          deploymentTitle={howItWorksData.DeploymentTitle || 'Rapid, remote deployment.'}
          deploymentSubTitle={
            howItWorksData.DeploymentSubTitle ||
            'Start experiencing the benefits as early as ten days.'
          }
          beginOperation={
            howItWorksData.BeginOperation || 'Begin operation in approximately 2 months'
          }
          timelineImage={howItWorksData.TimelineImage}
          deploymentSteps={deploymentSteps}
        />
      </>
    );
  } catch {
    console.error('Error fetching how it works data');

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
