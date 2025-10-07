'use client';

import { useState } from 'react';
import { FAQItem } from '@/lib/strapi';

interface FAQsListProps {
  faqs: FAQItem[];
}

export default function FAQsList({ faqs }: FAQsListProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleDropdown = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="bg-[#c1e0fd] py-[60px] px-[30px] md:px-[80px] relative z-[5] ">
      <div className="flex flex-row items-start justify-between flex-wrap gap-4 md:gap-[80px] max-w-[2000px] mx-auto text-white">
        <div className="flex-1 flex flex-col">
          {faqs.map((faq, index) => (
            <div
              key={faq.id}
              className={`w-full border-b border-oxford-blue ${
                activeIndex === index ? 'active' : ''
              }`}
            >
              <button
                className="py-8 flex items-center justify-between bg-transparent border-none  text-2xl font-bold text-oxford-blue cursor-pointer w-full relative text-left"
                onClick={() => toggleDropdown(index)}
              >
                {faq.Question}
                <svg
                  className={`ml-auto text-2xl transition-transform duration-100 ease-in-out fill-[#fe6568] w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ${
                    activeIndex === index ? 'rotate-0' : 'rotate-180'
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <path d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z" />
                </svg>
              </button>
              <div
                className={`text-base text-oxford-blue overflow-hidden transition-all duration-100 ease-in-out ${
                  activeIndex === index
                    ? 'max-h-[500px] opacity-100 transform translate-y-0'
                    : 'max-h-0 opacity-0 transform -translate-y-2.5'
                }`}
              >
                <p className="pl-8 pb-8 lg:pb-4">{faq.Answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
