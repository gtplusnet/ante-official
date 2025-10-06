'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TbWorld } from 'react-icons/tb';
import { IoMdArrowDropdown } from 'react-icons/io';

interface SocialMedia {
  id: number;
  attributes: {
    socialMediaLogo: {
      url: string;
    };
    socialMediaLink: string;
  };
}

interface FooterData {
  attributes: {
    title: string;
    emailAddress: string;
    address: string;
    madeBy: string;
    footerLogo: {
      url: string;
      variants: {
        large: {
          webp: {
            url: string;
          };
        };
      };
    };
    privacyPolicy: {
      url: string;
    };
    termsAndConditions: {
      url: string;
    };
    copyright: string;
  };
}

interface FooterSectionProps {
  footerData?: FooterData;
  socialMediaData?: SocialMedia[];
}

export default function FooterSection({
  footerData,
  socialMediaData = []
}: FooterSectionProps) {
  // Provide safe defaults for missing CMS data
  const safeFooterData = footerData?.attributes ? footerData : {
    attributes: {
      title: 'Connect With Us',
      emailAddress: 'info@multibook.com',
      address: 'Address not available',
      madeBy: 'Multibook',
      footerLogo: { url: '', variants: { large: { webp: { url: '' } } } },
      privacyPolicy: { url: '' },
      termsAndConditions: { url: '' },
      copyright: '© 2025 Multibook. All rights reserved.'
    }
  };

  const footerLogoUrl = safeFooterData?.attributes?.footerLogo?.variants?.large?.webp?.url || '';

  const privacyPolicyUrl = safeFooterData?.attributes?.privacyPolicy?.url || '';
  const termsAndConditionsUrl = safeFooterData?.attributes?.termsAndConditions?.url || '';

  const pathname = usePathname();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  const isNewsletterPage = pathname?.includes('/newsletter/');
  const newsletterPage = pathname?.includes('/newsletter');

  // Download handler function
  const handleDownload = (url: string, fileName: string) => {
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const processedSocialMedia = Array.isArray(socialMediaData)
    ? socialMediaData.map((item) => ({
        id: item.id,
        url: item.attributes.socialMediaLogo?.url
          ? item.attributes.socialMediaLogo.url.startsWith('http')
            ? item.attributes.socialMediaLogo.url
            : `${process.env.NEXT_PUBLIC_STRAPI_URL || 'https://multibook-admin.geertest.com'}${
                item.attributes.socialMediaLogo.url
              }`
          : '',
        socMedURL: item.attributes.socialMediaLink?.startsWith('https://')
          ? item.attributes.socialMediaLink
          : `https://${item.attributes.socialMediaLink || ''}`,
      }))
    : [];

  return (
    <div className="bg-oxford-blue pb-12">
      <div className="bg-white w-full rounded-b-[80px] sm:rounded-b-[100px] lg:rounded-b-[120px] px-2 sm:px-8 lg:px-20 py-8 sm:py-12 lg:py-16">
        {/* Top Separator - Only show on newsletter pages */}
        {isNewsletterPage && (
          <div className="flex justify-center">
            <div className="w-[94%] bg-oxford-blue mb-8 h-[0.9px]" />
          </div>
        )}

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mx-2 sm:mx-8 lg:mx-12">
          {/* Left Section - Title and Contact */}
          <div className="w-full text-center sm:text-left mb-8 lg:mb-0">
            <h2 className="text-[2.2rem] sm:text-[3rem] lg:text-[4.5rem] leading-[2.5rem] lg:leading-[6rem] max-w-3xl font-[600] text-multibook-red mb-8 sm:mb-12 lg:mb-16 mt-8 lg:mt-0">
              {safeFooterData.attributes.title}
            </h2>

            <div className="text-oxford-blue text-sm sm:text-base">
              <div className="flex items-center justify-center sm:justify-start mb-2">
                <svg
                  className="w-5 h-5 mr-2 text-[#001f4d]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                <span>{safeFooterData.attributes.emailAddress}</span>
              </div>

              <div className="flex items-center sm:items-start mb-6">
                <svg
                  className="w-10 sm:w-5 h-10 sm:h-5 mr-2 mb-2 sm:mb-0 sm:mt-1 text-[#001f4d]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <span className="text-center sm:text-left sm:w-[75%] lg:w-[55%]">
                  {safeFooterData.attributes.address}
                </span>
              </div>
            </div>

            {/* Social Media Icons */}
            <div className="flex gap-4 justify-center sm:justify-start">
              {processedSocialMedia
                .filter((social) => social.url && social.url.trim() !== '')
                .map((social) => (
                  <a
                    key={social.id}
                    href={social.socMedURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-10 h-10 bg-[#faf99b] rounded-lg hover:bg-[#faf99b] transition-colors"
                  >
                    <img src={social.url} alt="social media" className="w-6 h-6" />
                  </a>
                ))}
            </div>
          </div>

          {/* Right Section - Links */}
          <div className="w-full lg:w-[85%] flex flex-col sm:flex-row justify-between items-center sm:items-start lg:items-end sm:h-auto lg:h-[55vh] mt-8 lg:mt-0">
            <div className="flex flex-col sm:flex-row justify-between w-full gap-8 sm:gap-12 lg:gap-0 text-center sm:text-left">
              {/* Company */}
              <div className="mb-4 sm:mb-0">
                <p className="font-bold text-oxford-blue mb-2 sm:mb-4">Company</p>
                <div className="flex flex-col justify-center sm:justify-start gap-2">
                  <Link
                    href="/about-us"
                    className="text-oxford-blue hover:text-multibook-red hover:underline text-sm sm:text-base"
                  >
                    About Us
                  </Link>
                  <Link
                    href="/newsletter"
                    className="text-oxford-blue hover:text-multibook-red hover:underline text-sm sm:text-base"
                  >
                    Newsletter
                  </Link>
                </div>
              </div>

              {/* Services */}
              <div className="mb-4 sm:mb-0">
                <p className="font-bold text-oxford-blue mb-2 sm:mb-4">Services</p>
                <div className="flex flex-col justify-center sm:justify-start gap-2">
                  <Link
                    href="/services/how-it-works"
                    className="text-oxford-blue hover:text-multibook-red hover:underline text-sm sm:text-base whitespace-nowrap"
                  >
                    How It Works
                  </Link>
                  <Link
                    href="/services/features"
                    className="text-oxford-blue hover:text-multibook-red hover:underline text-sm sm:text-base"
                  >
                    Features
                  </Link>
                </div>
              </div>

              {/* Help */}
              <div>
                <p className="font-bold text-oxford-blue mb-2 sm:mb-4">Help</p>
                <div className="flex flex-col justify-center sm:justify-start gap-2">
                  <Link
                    href="/frequently-asked-questions"
                    className="text-oxford-blue hover:text-multibook-red hover:underline text-sm sm:text-base"
                  >
                    FAQS
                  </Link>
                  <Link
                    href="/contact-us"
                    className="text-oxford-blue hover:text-multibook-red hover:underline text-sm sm:text-base whitespace-nowrap"
                  >
                    Contact Us
                  </Link>
                  <button
                    onClick={() => handleDownload(privacyPolicyUrl, 'Privacy_Policy.pdf')}
                    disabled={!privacyPolicyUrl}
                    className="text-oxford-blue hover:text-multibook-red hover:underline text-sm sm:text-base whitespace-nowrap md:text-left disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                  <button
                    onClick={() =>
                      handleDownload(termsAndConditionsUrl, 'Terms_and_Conditions.pdf')
                    }
                    disabled={!termsAndConditionsUrl}
                    className="text-oxford-blue hover:text-multibook-red hover:underline text-sm sm:text-base whitespace-nowrap md:text-left disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Terms and Conditions
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Separator */}
        <div className="flex justify-center mt-8 sm:mt-12 lg:mt-16">
          <div className={`w-[94%] bg-oxford-blue ${newsletterPage ? 'h-[0.9px]' : 'h-[1px]'}`} />
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mx-2 sm:mx-8 lg:mx-12 pt-8 sm:pt-10 lg:pt-12 gap-4 sm:gap-0">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="flex items-center gap-1 sm:gap-2 border border-oxford-blue text-oxford-blue px-2 sm:px-3 py-1 sm:py-2 rounded-[20px] sm:rounded-full bg-white hover:bg-gray-50 transition-colors font-bold text-sm sm:text-base"
            >
              <TbWorld className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8" />
              <span className="text-base sm:text-lg lg:text-xl">EN</span>
              <IoMdArrowDropdown
                className={`w-4 sm:w-5 h-4 sm:h-5 transition-transform duration-200 ${
                  isLanguageOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isLanguageOpen && (
              <div className="absolute top-full left-0 bg-white min-w-[180px] rounded-lg shadow-lg overflow-hidden border border-gray-200 z-50">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsLanguageOpen(false);
                  }}
                  className="block px-4 py-2.5 text-oxford-blue hover:bg-gray-50 hover:text-multibook-red transition-colors text-sm"
                >
                  English
                </a>
                <a
                  href="https://www.multibook.jp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2.5 text-oxford-blue hover:bg-gray-50 hover:text-multibook-red transition-colors text-sm"
                >
                  日本語 (Japanese)
                </a>
              </div>
            )}
          </div>

          {/* Made by */}
          <p className="text-oxford-blue text-base font-bold">{safeFooterData.attributes.madeBy}</p>
        </div>

        {/* Footer Logo */}
        {footerLogoUrl && (
          <div className="flex justify-center mt-8 sm:mt-10 lg:mt-12">
            <img
              src={footerLogoUrl}
              alt="Footer Logo"
              className="w-[90%] sm:w-[93%] lg:w-[95%] h-auto"
            />
          </div>
        )}
      </div>

      {/* Copyright */}
      <div className="flex justify-center items-center mt-12 px-4 sm:px-16 lg:px-32 text-center">
        <p className="text-multibook-red text-[0.6em] sm:text-sm lg:text-base">
          {safeFooterData.attributes.copyright}
        </p>
      </div>
    </div>
  );
}
