import { Metadata } from 'next';
import { anteClient } from '@/lib/strapi';

// Force dynamic rendering (SSR) instead of static generation (SSG)
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import NavigationWrapper from '@/components/Navigation/NavigationWrapper';
import PageHeader from '@/components/PageHeader/PageHeader';
import FeatureSection from '@/components/Features/ServiceFeatures/FeatureSection';
import CTASection from '@/components/CTA/CTASection';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Features - Multibook',
    description:
      "Explore Multibook's comprehensive features including Dashboard, Leased Assets, Accounting, Logistics, Fixed Assets, and Reimbursements.",
    keywords: 'multibook features, dashboard, accounting, logistics, fixed assets, reimbursements',
  };
}

export default async function FeaturesPage() {
  try {
    // Fetch all necessary data in parallel
    const [
      featuresPageRes,
      dashboardPageRes,
      leasedAssetsPageRes,
      accountingPageRes,
      logisticsPageRes,
      fixedAssetsPageRes,
      reimbursementsPageRes,
      dashboardFeaturesRes,
      leasedAssetsFeaturesRes,
      accountingFeaturesRes,
      logisticsFeaturesRes,
      fixedAssetsFeaturesRes,
      reimbursementsFeaturesRes,
    ] = await Promise.all([
      // Fetch page data (single types) for headers and subheaders
      anteClient.getFeaturesPage(),
      anteClient.getFeaturePageDashboard(),
      anteClient.getFeaturePageLeasedAssets(),
      anteClient.getFeaturePageAccounting(),
      anteClient.getFeaturePageLogistics(),
      anteClient.getFeaturePageFixedAssets(),
      anteClient.getFeaturePageReimbursement(),
      // Fetch feature items (collections)
      anteClient.getFeaturesDashboard(),
      anteClient.getFeaturesLeasedAssets(),
      anteClient.getFeaturesAccounting(),
      anteClient.getFeaturesLogistics(),
      anteClient.getFeaturesFixedAssets(),
      anteClient.getFeaturesReimbursements(),
    ]);

    // Extract page data
    const featuresTitle = featuresPageRes.data?.attributes.pageTitle;
    const dashboardPage = dashboardPageRes.data?.attributes || {};
    const leasedAssetsPage = leasedAssetsPageRes.data?.attributes || {};
    const accountingPage = accountingPageRes.data?.attributes || {};
    const logisticsPage = logisticsPageRes.data?.attributes || {};
    const fixedAssetsPage = fixedAssetsPageRes.data?.attributes || {};
    const reimbursementsPage = reimbursementsPageRes.data?.attributes || {};

    interface FeatureItem {
      id: number | string;
      Title?: string;
      Description?: string;
    }

    // Process features data
    const processFeatures = (data: FeatureItem[]) => {
      return (data || []).map((item) => ({
        id: item.id,
        title: item.Title || '',
        description: item.Description || '',
      }));
    };

    const dashboardFeatures = processFeatures(dashboardFeaturesRes.data);
    const leasedAssetsFeatures = processFeatures(leasedAssetsFeaturesRes.data);
    const accountingFeatures = processFeatures(accountingFeaturesRes.data);
    const logisticsFeatures = processFeatures(logisticsFeaturesRes.data);
    const fixedAssetsFeatures = processFeatures(fixedAssetsFeaturesRes.data);
    const reimbursementsFeatures = processFeatures(reimbursementsFeaturesRes.data);

    return (
      <>
        <NavigationWrapper />

        {/* Page Header with gradient background */}
        <PageHeader />

        {/* Features Hero Section */}
        <div className="bg-white h-[40vh] md:h-[45vh] lg:h-[50vh] rounded-t-[60px] relative flex items-center justify-center -mt-[60px] z-[5]">
          <h2 className="text-[3rem] md:text-[70px] font-bold text-oxford-blue">{featuresTitle}</h2>
        </div>

        {/* Dashboard Section */}
        <FeatureSection
          sectionTitle={dashboardPage.title || 'Dashboard'}
          header={dashboardPage.header || 'Leave the data collection to us.'}
          subheader={
            dashboardPage.subHeader ||
            'Focus on improving business strategy instead with the all-in-one management service.'
          }
          features={dashboardFeatures}
          backgroundColor="#0e1f4b"
          textColor="#ffffff"
          borderColor="#ffffff"
          titleColor="#fe6568"
          subheaderColor="#c1e0fd"
          dropdownLabelColor="#c1e0fd"
          chevronColor="#eef066"
        />

        {/* Leased Assets Section */}
        <FeatureSection
          sectionTitle={leasedAssetsPage.title || 'Leased Assets'}
          header={leasedAssetsPage.header || 'Manage your leased assets'}
          subheader={
            leasedAssetsPage.subHeader || 'Keep track of all your leased equipment and property'
          }
          features={leasedAssetsFeatures}
          backgroundColor="#c1e0fd"
          textColor="#0e1f4b"
          borderColor="#0e1f4b"
          titleColor="#fe6568"
          subheaderColor="#0e1f4b"
          dropdownLabelColor="#0e1f4b"
          chevronColor="#fe6568"
        />

        {/* Accounting Section */}
        <FeatureSection
          sectionTitle={accountingPage.title || 'Accounting'}
          header={accountingPage.header || 'Simplify your accounting'}
          subheader={
            accountingPage.subHeader ||
            'Streamline your financial processes with our comprehensive tools'
          }
          features={accountingFeatures}
          backgroundColor="#fe6568"
          textColor="#0b2254"
          borderColor="#0b2254"
          titleColor="#0b2254"
          subheaderColor="#0b2254"
          dropdownLabelColor="#0b2254"
          chevronColor="#f0f06c"
        />

        {/* Logistics Section */}
        <FeatureSection
          sectionTitle={logisticsPage.title || 'Logistics'}
          header={logisticsPage.header || 'Optimize your logistics'}
          subheader={
            logisticsPage.subHeader || 'Manage your supply chain and inventory efficiently'
          }
          features={logisticsFeatures}
          backgroundColor="#f0f06c"
          textColor="#0f1c48"
          borderColor="#0f1c48"
          titleColor="#0f1c48"
          subheaderColor="#0f1c48"
          dropdownLabelColor="#0f1c48"
          chevronColor="#fe6568"
        />

        {/* Fixed Assets Section */}
        <FeatureSection
          sectionTitle={fixedAssetsPage.title || 'Fixed Assets'}
          header={fixedAssetsPage.header || 'Track your fixed assets'}
          subheader={
            fixedAssetsPage.subHeader ||
            'Monitor and manage your fixed assets throughout their lifecycle'
          }
          features={fixedAssetsFeatures}
          backgroundColor="#0d1b86"
          textColor="#b3faea"
          borderColor="#f3f7ff"
          titleColor="#f3f7ff"
          subheaderColor="#f3f7ff"
          dropdownLabelColor="#f3f7ff"
          chevronColor="#f0f06c"
        />

        {/* Reimbursements Section */}
        <FeatureSection
          sectionTitle={reimbursementsPage.title || 'Reimbursements'}
          header={reimbursementsPage.header || 'Streamline reimbursements'}
          subheader={
            reimbursementsPage.subHeader || 'Simplify expense tracking and reimbursement processes'
          }
          features={reimbursementsFeatures}
          backgroundColor="#b9f9f8"
          textColor="#102053"
          borderColor="#102053"
          titleColor="#102053"
          subheaderColor="#102053"
          dropdownLabelColor="#102053"
          chevronColor="#fe6568"
        />

        <CTASection />
      </>
    );
  } catch (error) {
    console.error('Error fetching features data:', error);

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
