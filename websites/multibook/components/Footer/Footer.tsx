'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface FooterProps {
  title?: string;
  emailAddress?: string;
  address?: string;
  madeBy?: string;
  footerLogo?: string;
  socialMedia?: Array<{
    id: number;
    icon: string;
    url: string;
  }>;
}

export default function Footer({
  title = 'Ready to simplify your finances?',
  emailAddress = 'info@multibook.com',
  address = '16F Keppel Towers Cebu Business Park, Cebu City Philippines 6000',
  madeBy = 'Made by Geer Inc',
  footerLogo = '/images/logo/full-color.png',
  socialMedia = [],
}: FooterProps) {
  const pathname = usePathname();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  const isContactUsOrNewsletter =
    pathname?.includes('/contact-us') || pathname?.includes('/newsletter/');
  const isNewsletterPage = pathname?.includes('/newsletter/');
  const newsletterPage = pathname?.includes('/newsletter');

  return (
    <div className="bg-oxford-blue pb-12">
      <div className="bg-white w-full rounded-b-[120px] px-20 py-16">
        {/* Top Separator */}
        {isContactUsOrNewsletter && (
          <div className="flex justify-center">
            <div
              className={`w-[94%] bg-oxford-blue mb-8 ${
                isNewsletterPage ? 'h-[0.9px]' : 'h-[1px]'
              }`}
            />
          </div>
        )}

        <div className="flex justify-between items-center mx-12">
          {/* Left Section - Title and Contact */}
          <div className="w-full">
            <h2 className="text-[3.7rem] font-bold text-multibook-red mb-4">{title}</h2>

            <div className="text-oxford-blue text-base">
              <div className="flex items-center mb-2">
                <svg
                  className="w-5 h-5 mr-2 text-[#001f4d]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                <span>{emailAddress}</span>
              </div>

              <div className="flex items-start mb-6">
                <svg
                  className="w-5 h-5 mr-2 mt-1 text-[#001f4d]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <span className="w-[55%]">{address}</span>
              </div>
            </div>

            {/* Social Media Icons */}
            <div className="flex gap-4">
              {socialMedia.map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-10 h-10 bg-[#faf99b] rounded-lg hover:bg-[#faf99b] transition-colors"
                >
                  <img
                    src={social.icon}
                    alt="social media"
                    className="h-full w-auto"
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Right Section - Links */}
          <div className="w-[85%] flex justify-between items-end h-[55vh]">
            <div className="flex justify-between w-full">
              {/* Company */}
              <div>
                <p className="font-bold text-oxford-blue mb-4">Company</p>
                <div className="flex flex-col space-y-2">
                  <Link
                    href="/about-us"
                    className="text-oxford-blue hover:text-multibook-red hover:underline"
                  >
                    About Us
                  </Link>
                  <Link
                    href="/newsletter"
                    className="text-oxford-blue hover:text-multibook-red hover:underline"
                  >
                    Newsletter
                  </Link>
                </div>
              </div>

              {/* Services */}
              <div>
                <p className="font-bold text-oxford-blue mb-4">Services</p>
                <div className="flex flex-col space-y-2">
                  <Link
                    href="/services/how-it-works"
                    className="text-oxford-blue hover:text-multibook-red hover:underline"
                  >
                    How it Works
                  </Link>
                  <Link
                    href="/services/features"
                    className="text-oxford-blue hover:text-multibook-red hover:underline"
                  >
                    Features
                  </Link>
                </div>
              </div>

              {/* Help */}
              <div>
                <p className="font-bold text-oxford-blue mb-4">Help</p>
                <div className="flex flex-col space-y-2">
                  <Link
                    href="/frequently-asked-questions"
                    className="text-oxford-blue hover:text-multibook-red hover:underline"
                  >
                    FAQS
                  </Link>
                  <Link
                    href="/contact-us"
                    className="text-oxford-blue hover:text-multibook-red hover:underline"
                  >
                    Contact Us
                  </Link>
                  <span className="text-oxford-blue cursor-default">Privacy Policy</span>
                  <span className="text-oxford-blue cursor-default">Terms and Conditions</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Separator */}
        <div className="flex justify-center mt-16">
          <div className={`w-[94%] bg-oxford-blue ${newsletterPage ? 'h-[0.9px]' : 'h-[1px]'}`} />
        </div>

        {/* Bottom Section */}
        <div className="flex justify-between items-center mx-12 pt-12">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="flex items-center gap-2 border border-oxford-blue text-oxford-blue px-3 py-2 rounded-full bg-white hover:bg-gray-50 transition-colors font-bold"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 16H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 3.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z" />
              </svg>
              <span className="text-xl">EN</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </button>

            {isLanguageOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white min-w-[180px] rounded-lg shadow-lg overflow-hidden border border-gray-200 z-50">
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
          <p className="text-oxford-blue text-xl font-bold">{madeBy}</p>
        </div>

        {/* Footer Logo */}
        <div className="flex justify-center mt-12">
          <img
            src={footerLogo}
            alt="Footer Logo"
            className="w-[95%] h-auto"
          />
        </div>
      </div>

      {/* Copyright */}
      <div className="flex justify-center items-center mt-12 px-32 text-center">
        <p className="text-multibook-red text-base">
          Copyright © 2021 Multibook Limited All Rights Reserved
        </p>
      </div>
    </div>
  );
}
