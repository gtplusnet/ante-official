'use client';

import { useState } from 'react';

interface FeatureItem {
  id: number | string;
  title: string;
  description: string;
}

interface FeatureSectionProps {
  sectionTitle: string;
  header: string;
  subheader: string;
  features: FeatureItem[];
  isFirst?: boolean;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  titleColor?: string;
  subheaderColor?: string;
  dropdownLabelColor?: string;
  chevronColor?: string;
}

export default function FeatureSection({
  sectionTitle,
  header,
  subheader,
  features,
  backgroundColor = '#0e1f4b',
  textColor = '#ffffff',
  borderColor = '#ffffff',
  titleColor = '#fe6568',
  subheaderColor = '#c1e0fd',
  dropdownLabelColor = '#c1e0fd',
  chevronColor = '#eef066',
}: FeatureSectionProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleDropdown = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div
      className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[60px] py-12 sm:py-16 md:py-20 lg:py-24 relative min-h-auto z-[5]"
      style={{ backgroundColor }}
    >
      <div
        className="border-b max-w-[1500px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-0"
        style={{ borderColor }}
      >
        <h3
          className="text-xl sm:text-2xl md:text-3xl lg:text-4xl pb-2 sm:pb-3 md:pb-4 font-bold"
          style={{ color: titleColor }}
        >
          {sectionTitle}
        </h3>
      </div>

      <div
        className="flex flex-col lg:flex-row items-start justify-between gap-8 md:gap-12 lg:gap-20 pb-8 sm:pb-12 md:pb-16 max-w-[1500px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-0"
        style={{ color: textColor }}
      >
        <div className="w-full lg:w-[45%] xl:w-[40%]">
          <h1
            className="mt-4 text-2xl sm:text-3xl md:text-4xl lg:text-[3rem] xl:text-[3.5rem] 2xl:text-[4.5rem] font-bold"
            style={{ lineHeight: '1.2' }}
          >
            {header}
          </h1>
          <p
            className="mt-3 sm:mt-4 md:mt-6 text-sm sm:text-base md:text-lg lg:text-xl font-normal"
            style={{ color: subheaderColor }}
          >
            {subheader}
          </p>
        </div>

        <div className="w-full lg:w-[55%] xl:w-[50%] min-h-auto flex flex-col mt-8 lg:mt-0">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className={`w-full border-b ${activeIndex === index ? 'active' : ''}`}
              style={{ borderColor: dropdownLabelColor }}
            >
              <button
                className="py-4 sm:py-6 md:py-8 flex items-center justify-between bg-transparent border-none text-base sm:text-lg md:text-xl lg:text-2xl font-bold cursor-pointer w-full relative text-left"
                style={{ color: dropdownLabelColor }}
                onClick={() => toggleDropdown(index)}
              >
                <span className="pr-2">{feature.title}</span>
                <svg
                  className={`ml-auto transition-transform duration-300 ease-in-out flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ${
                    activeIndex === index ? 'rotate-0' : 'rotate-180'
                  }`}
                  style={{ fill: chevronColor }}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <path d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z" />
                </svg>
              </button>
              <div
                className={`text-sm sm:text-base md:text-lg overflow-hidden transition-all duration-300 ease-in-out origin-top ${
                  activeIndex === index
                    ? 'max-h-[500px] pb-3 sm:pb-4 md:pb-6 opacity-100 translate-y-0'
                    : 'max-h-0 opacity-0 -translate-y-2.5'
                }`}
                style={{ color: textColor }}
              >
                {feature.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
