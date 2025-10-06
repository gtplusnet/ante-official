import type { Metadata } from 'next';
import { anteClient, type FooterSocialMedia } from '@/lib/strapi';
import FooterSection from '@/components/Footer/FooterSection';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  let faviconUrl = '/icon.jpg'; // Default fallback favicon
  
  try {
    const faviconRes = await anteClient.getFavicon();
    if (faviconRes?.data?.attributes?.favicon) {
      const favicon = faviconRes.data.attributes.favicon;
      // Use the small PNG variant for favicon (better compatibility)
      if (favicon.variants?.small?.png?.url) {
        faviconUrl = favicon.variants.small.png.url;
      } else if (favicon.url) {
        faviconUrl = favicon.url;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch favicon from CMS, using default:', error);
  }

  return {
    title: 'Multibook - Streamline Your Business Operations',
    description:
      'Multibook helps businesses streamline their operations with cutting-edge technology solutions.',
    keywords: 'business operations, technology solutions, multibook',
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
      apple: faviconUrl,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch footer data - skip during Docker build
  let footerData: any;
  let socialMediaData: FooterSocialMedia[] = [];

  // During Docker build, use default values to prevent build failures
  if (process.env.NEXT_DISABLE_STRAPI === 'true') {
    footerData = {
      attributes: {
        title: 'Ready to simplify your finances?',
        emailAddress: 'info@multibook.com',
        address: '16F Keppel Towers Cebu Business Park, Cebu City Philippines 6000',
        madeBy: 'Made by Geer Inc',
        footerLogo: {
          url: '/images/logo/desktop/full-color-1.png',
          variants: {
            large: {
              webp: {
                url: '/images/logo/desktop/full-color-1.png',
              },
            },
          },
        },
      },
    };
  } else {
    try {
      const [footerRes, socialMediaRes] = await Promise.all([
        anteClient.getFooterData(),
        anteClient.getFooterSocialMedia(),
      ]);

      footerData = footerRes.data;
      socialMediaData = socialMediaRes.data || [];
    } catch (error) {
      console.error('Error fetching footer data:', error);
      // Use default values if API fails
      footerData = {
        attributes: {
          title: 'Ready to simplify your finances?',
          emailAddress: 'info@multibook.com',
          address: '16F Keppel Towers Cebu Business Park, Cebu City Philippines 6000',
          madeBy: 'Made by Geer Inc',
          footerLogo: {
            url: '/images/logo/desktop/full-color-1.png',
            variants: {
              large: {
                webp: {
                  url: '/images/logo/desktop/full-color-1.png',
                },
              },
            },
          },
        },
      };
    }
  }

  return (
    <html lang="en">
      <body className="font-noto-sans antialiased">
        <div id="app-root">
          {children}
          <FooterSection footerData={footerData} socialMediaData={socialMediaData} />
        </div>
      </body>
    </html>
  );
}
