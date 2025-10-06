'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { NavigationProps } from '@/lib/types';

export default function Navigation({
  logoUrl = '/images/logo/desktop/full-color.png',
  bookConsultationText = 'Book a Consultation',
}: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Initialize services dropdown based on current path
    setShowServices(pathname?.startsWith('/services') || false);
  }, [pathname]);

  const isActive = (path: string) => pathname === path;
  const isServicesActive = pathname?.startsWith('/services') || false;

  const handleBookConsultation = () => {
    setIsMobileMenuOpen(false);
    router.push('/contact-us');
  };

  return (
    <>
      {/* Main Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[9999] flex justify-between items-center transition-all duration-300 ${
          isScrolled
            ? 'bg-oxford-blue py-0 px-4 sm:px-8 lg:px-16 shadow-lg h-16'
            : 'bg-transparent py-4 sm:py-6 lg:py-[1.9rem] px-4 sm:px-8 lg:px-12'
        }`}
      >
        {/* Mobile/Tablet Hamburger */}
        <button className="lg:hidden p-2 hero-text" onClick={() => setIsMobileMenuOpen(true)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Logo */}
        <Link href="/" className="block max-lg:absolute max-lg:left-1/2 max-lg:-translate-x-1/2">
          <img
            src={logoUrl}
            alt="Multibook Logo"
            className={`transition-all duration-300 ${
              isScrolled ? 'w-28 sm:w-32 lg:w-40' : 'w-32 sm:w-40 lg:w-[15rem]'
            } h-auto`}
          />
        </Link>

        {/* Desktop Menu */}
        <div
          className={`hidden lg:flex items-center gap-[30px] transition-all duration-300 ${
            isScrolled
              ? 'ml-11'
              : 'px-12 py-[10px] rounded-[100px] bg-black/[0.473] backdrop-blur-[100px]'
          }`}
        >
          <Link
            href="/"
            className={`font-bold text-sm transition-all duration-300 hover:text-text-active ${
              isActive('/') ? 'text-text-active' : 'text-text-inactive'
            }`}
          >
            Home
          </Link>
          <Link
            href="/about-us"
            className={`font-bold text-sm transition-all duration-300 hover:text-text-active ${
              isActive('/about-us') ? 'text-text-active' : 'text-text-inactive'
            }`}
          >
            About Us
          </Link>

          {/* Services Dropdown */}
          <div className="relative group">
            <span
              className={`font-bold text-sm transition-all flex items-center duration-300 cursor-pointer hover:text-text-active ${
                isServicesActive ? 'text-text-active' : 'text-text-inactive'
              }`}
            >
              Services
            </span>
            {/* Invisible bridge to maintain hover state */}
            <div className="absolute top-full left-0 right-0 h-4 -mt-2 invisible group-hover:visible" />
            <div
              className={`absolute left-0 min-w-[160px] rounded-lg flex-col transition-all ${
                isScrolled
                  ? 'bg-oxford-blue/[0.925] top-[calc(100%+10px)]'
                  : 'bg-black/[0.473] backdrop-blur-[100px] top-[calc(100%+10px)]'
              } opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:flex`}
            >
              <Link
                href="/services/how-it-works"
                className={`block px-4 py-[10px] font-bold text-sm transition-all rounded-lg ${
                  isActive('/services/how-it-works')
                    ? 'text-text-active'
                    : 'text-text-inactive hover:text-[#faf99b] hover:bg-white/10'
                }`}
              >
                How It Works
              </Link>
              <Link
                href="/services/features"
                className={`block px-4 py-[10px] font-bold text-sm transition-all rounded-lg ${
                  isActive('/services/features')
                    ? 'text-text-active'
                    : 'text-text-inactive hover:text-[#faf99b] hover:bg-white/10'
                }`}
              >
                Features
              </Link>
            </div>
          </div>

          <Link
            href="/contact-us"
            className={`font-bold text-sm transition-all duration-300 hover:text-text-active ${
              isActive('/contact-us') ? 'text-text-active' : 'text-text-inactive'
            }`}
          >
            Contact Us
          </Link>
          <Link
            href="/newsletter"
            className={`font-bold text-sm transition-all duration-300 hover:text-text-active ${
              isActive('/newsletter') ? 'text-text-active' : 'text-text-inactive'
            }`}
          >
            Newsletter
          </Link>
        </div>

        {/* Book Consultation Button / Mobile Placeholder */}
        <button
          onClick={handleBookConsultation}
          className={`hidden lg:block bg-multibook-yellow hover:bg-[#f1f177] text-oxford-blue font-semibold rounded-[25px] transition-all duration-300 shadow-[0_4px_15px_rgba(0,0,0,0.2)] hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)] active:translate-y-0 active:shadow-[0_2px_10px_rgba(0,0,0,0.15)] ${
            isScrolled ? 'text-sm py-2 px-4' : 'text-md py-[0.6rem] px-6'
          }`}
        >
          {bookConsultationText}
        </button>
        {/* Mobile/Tablet placeholder to balance hamburger */}
        <div className="lg:hidden w-10 h-10" />
      </nav>

      {/* Mobile/Tablet Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[9999] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile/Tablet Menu Drawer */}
      <div
        className={`fixed top-0 left-0 w-80 sm:w-96 h-full z-[10000] transition-transform duration-300 lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ position: 'fixed' }}
      >
        <div className="w-full h-full bg-oxford-blue overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-4 right-4 text-white p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Mobile/Tablet Logo */}
          <div className="pt-8 pb-4 flex justify-center">
            <img
              src={logoUrl}
              alt="Multibook Logo"
              className="w-[150px] sm:w-[180px] h-auto"
            />
          </div>

          {/* Mobile/Tablet Menu Items */}
          <div className="mt-4 sm:mt-6">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block py-3 px-4 font-bold text-sm transition-all ${
                isActive('/')
                  ? 'text-text-active'
                  : 'text-text-inactive hover:text-text-active hover:bg-white/[0.2]'
              }`}
            >
              Home
            </Link>

            <Link
              href="/about-us"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block py-3 px-4 font-bold text-sm transition-all ${
                isActive('/about-us')
                  ? 'text-text-active'
                  : 'text-text-inactive hover:text-text-active hover:bg-white/[0.2]'
              }`}
            >
              About Us
            </Link>

            {/* Services Dropdown Mobile */}
            <div>
              <button
                onClick={() => setShowServices(!showServices)}
                className={`w-full text-left py-3 px-4 font-bold text-sm transition-all ${
                  isServicesActive
                    ? 'text-text-active'
                    : 'text-text-inactive hover:text-text-active hover:bg-white/[0.2]'
                }`}
              >
                Services
              </button>
              {showServices && (
                <div className="pb-[10px]">
                  <Link
                    href="/services/how-it-works"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block py-2 px-8 font-bold text-xs transition-all ${
                      isActive('/services/how-it-works')
                        ? 'text-text-active'
                        : 'text-text-inactive hover:text-text-active hover:bg-white/[0.2]'
                    }`}
                  >
                    How It Works
                  </Link>
                  <Link
                    href="/services/features"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block py-2 px-8 font-bold text-xs transition-all ${
                      isActive('/services/features')
                        ? 'text-text-active'
                        : 'text-text-inactive hover:text-text-active hover:bg-white/[0.2]'
                    }`}
                  >
                    Features
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/contact-us"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block py-3 px-4 font-bold text-sm transition-all ${
                isActive('/contact-us')
                  ? 'text-text-active'
                  : 'text-text-inactive hover:text-text-active hover:bg-white/[0.2]'
              }`}
            >
              Contact Us
            </Link>

            <Link
              href="/newsletter"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block py-3 px-4 font-bold text-sm transition-all ${
                isActive('/newsletter')
                  ? 'text-text-active'
                  : 'text-text-inactive hover:text-text-active hover:bg-white/[0.2]'
              }`}
            >
              Newsletter
            </Link>

            {/* Mobile/Tablet Book Consultation Button */}
            <div className="flex justify-center items-center py-4 sm:py-6">
              <button
                onClick={handleBookConsultation}
                className="bg-multibook-yellow text-oxford-blue font-semibold text-[11px] sm:text-sm py-2 px-6 sm:py-3 sm:px-8 rounded-[25px] hover:bg-multibook-yellow-hover transition-colors"
              >
                {bookConsultationText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
