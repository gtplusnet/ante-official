import { Metadata } from 'next';
import { anteClient } from '@/lib/strapi';
import NavigationWrapper from '@/components/Navigation/NavigationWrapper';
import ContactUsHero from '@/components/ContactUs/ContactUsHero';
import InquiryForm from '@/components/ContactUs/InquiryForm';
import PageHeader from '@/components/PageHeader/PageHeader';

// Force dynamic rendering (SSR) instead of static generation (SSG)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Contact Us - Multibook',
    description:
      'Get in touch with Multibook. Book a free consultation and learn how we can help streamline your business operations.',
    keywords: 'contact multibook, consultation, inquiry, business solutions',
  };
}

export default async function ContactUsPage() {
  try {
    // Fetch all necessary data
    const [contactUsRes] = await Promise.all([anteClient.getContactUs()]);

    interface ContactUsData {
      pageTitle?: string;
      headline?: string;
      subHeadline?: string;
      backgroundCover?: {
        url: string;
      };
      inquiryTitle?: string;
      buttonLabel?: string;
    }

    const contactData = contactUsRes.data.attributes as ContactUsData;

    return (
      <>
        <NavigationWrapper />

        <PageHeader />

        <ContactUsHero
          title={contactData.pageTitle || "Let's Talk!"}
          header={contactData.headline || 'Book a FREE consultation with us.'}
          subheader={
            contactData.subHeadline ||
            'We will be in touch soon to schedule a time that works best for you.'
          }
          backgroundImage={
            contactData.backgroundCover?.url
              ? anteClient.getMediaUrl(contactData.backgroundCover.url)
              : '/images/multibook landing page assets-05.png'
          }
        />

        <InquiryForm
          inquiryFormTitle={contactData.inquiryTitle || 'Inquiry Form'}
          submitButtonText={contactData.buttonLabel || 'Submit'}
        />
      </>
    );
  } catch {
    console.error('Error fetching contact us data');

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
