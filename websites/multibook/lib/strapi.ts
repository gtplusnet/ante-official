// Strapi API service for SSR
const STRAPI_URL = process.env.STRAPI_API_URL || 'https://multibook-admin.geertest.com/api';
const BASE_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'https://multibook-admin.geertest.com';
const ANTE_API = process.env.STRAPI_API_TOKEN || 'https://backend.ante.ph/api/public';

export interface StrapiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
    [key: string]: unknown;
  };
}

export interface StrapiAttributes {
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  start?: number;
  limit?: number;
  withCount?: boolean;
}

// Navigation data interface
export interface NavigationData extends StrapiAttributes {
  attributes: {
    buttonLabel?: string;
    logo?: {
      url: string;
      alt?: string;
    };
  };
}

// Landing page data interface
export interface LandingPageData extends StrapiAttributes {
  attributes: {
    heroBannerHeadline: string;
    heroBannerSubHeadline: string;
    ourFeaturesTitle?: string;
    marketTitle?: string;
    marketSubtitle?: string;
    partnerTitle?: string;
    partnerSubtitle?: string;
    partnerEndorsedBy?: string;
    infiniteScrollSpeedForPartnersLogo?: string;
    ourNewsletterTitle?: string;
    carouselSpeedTransition?: number;
    marketBackgroundCover?: {
      variants: {
        large: {
          webp: {
            url: string;
            alt: string;
          };
        };
      };
    };
  };
}

// Ante API Image Interface with variants
export interface AnteImage {
  id: number;
  url: string;
  alt?: string | null;
  caption?: string | null;
  width: number;
  height: number;
  size: number;
  mime: string;
  variants: {
    og?: {
      png?: { url: string; size: number; width: number; format: string; height: number };
      jpg?: { url: string; size: number; width: number; format: string; height: number };
    };
    large?: {
      png?: { url: string; size: number; width: number; format: string; height: number };
      jpg?: { url: string; size: number; width: number; format: string; height: number };
      avif?: { url: string; size: number; width: number; format: string; height: number };
      webp?: { url: string; size: number; width: number; format: string; height: number };
    };
    small?: {
      png?: { url: string; size: number; width: number; format: string; height: number };
      jpg?: { url: string; size: number; width: number; format: string; height: number };
      avif?: { url: string; size: number; width: number; format: string; height: number };
      webp?: { url: string; size: number; width: number; format: string; height: number };
    };
    medium?: {
      png?: { url: string; size: number; width: number; format: string; height: number };
      jpg?: { url: string; size: number; width: number; format: string; height: number };
      avif?: { url: string; size: number; width: number; format: string; height: number };
      webp?: { url: string; size: number; width: number; format: string; height: number };
    };
    square?: {
      png?: { url: string; size: number; width: number; format: string; height: number };
      jpg?: { url: string; size: number; width: number; format: string; height: number };
      avif?: { url: string; size: number; width: number; format: string; height: number };
      webp?: { url: string; size: number; width: number; format: string; height: number };
    };
    xlarge?: {
      png?: { url: string; size: number; width: number; format: string; height: number };
      jpg?: { url: string; size: number; width: number; format: string; height: number };
      avif?: { url: string; size: number; width: number; format: string; height: number };
      webp?: { url: string; size: number; width: number; format: string; height: number };
    };
    twitter?: {
      png?: { url: string; size: number; width: number; format: string; height: number };
      jpg?: { url: string; size: number; width: number; format: string; height: number };
    };
    thumbnail?: {
      png?: { url: string; size: number; width: number; format: string; height: number };
      jpg?: { url: string; size: number; width: number; format: string; height: number };
      webp?: { url: string; size: number; width: number; format: string; height: number };
    };
  };
  blurPlaceholder: string;
  dominantColor: string;
  processingStatus: string;
  duration?: number | null;
  tags: string[];
}

// Favicon API Response from Ante API
export interface AnteFaviconResponse {
  statusCode: number;
  message: string;
  data: {
    id: string;
    attributes: {
      favicon: AnteImage;
    };
    meta: {
      status: string;
      publishedAt: {
        dateTime: string;
        time: string;
        time24: string;
        date: string;
        dateFull: string;
        dateStandard: string;
        raw: string;
        timeAgo: string;
        day: string;
        daySmall: string;
      };
      locale: string;
    };
  };
}

// Ante API About Us Response
export interface AnteAboutUsResponse {
  statusCode: number;
  message: string;
  data: {
    id: string;
    attributes: {
      coreValuesTitle: string;
      videoLink: string;
      companyDefinition: string;
      companyBackgroundCover: AnteImage;
      backgroundCover: AnteImage;
      pageTitle: string;
      missionTitle: string;
      missionDescription: string;
      visionTitle: string;
      visionDescription: string;
      ceoPicture: AnteImage;
      ceoBackgroundCover: AnteImage;
      messageTitle: string;
      messageBody: string;
      ceoName: string;
      position: string;
      messageOfCeo: string;
    };
    meta: {
      status: string;
      publishedAt: {
        dateTime: string;
        time: string;
        time24: string;
        date: string;
        dateFull: string;
        dateStandard: string;
        raw: string;
        timeAgo: string;
        day: string;
        daySmall: string;
      };
      locale: string;
    };
  };
}

export interface AboutUsData extends StrapiAttributes {
  Logo: {
    url: string;
    alt?: string;
  };
  BookAConsultation: string;
  // Additional About Us page fields
  VideoLink?: string;
  Body?: string;
  MissionBody?: string;
  VisionBody?: string;
  CEOMessage?: string;
  CEOName?: string;
  CEOPosition?: string;
  MessageFromTheCEOTitle?: string;
  MessageFromTheCEOBody?: string;
  JobPosition?: string;
  coreValuesTitle?: string;
  CEOPicture?: {
    url: string;
    alt?: string;
  };
  AboutCover?: {
    url: string;
    alt?: string;
  };
  backgroundCover?: {
    url: string;
    alt?: string;
  };
  CEOBackgroundCover?: {
    url: string;
    alt?: string;
  };
  // SEO fields
  pageTitle?: string;
  PageTitle?: string;
  MissionTitle?: string;
  VisionTitle?: string;
  PageDescription?: string;
  PageKeywords?: string;
}

// Hero image interface
export interface HeroImage extends StrapiAttributes {
  id: number;
  attributes: {
    backgroundCover: {
      variants: {
        xlarge: {
          webp: {
            url: string;
            alt: string;
          };
        };
      };
    };
  };
}

// Feature interface
export interface Feature extends StrapiAttributes {
  id: string;
  attributes: {
    title: string;
    description: string;
    image: {
      variants: {
        medium: {
          webp: {
            url: string;
            alt: string;
          };
        };
      };
    };
  };
}

// Newsletter item interface
export interface NewsletterItem extends StrapiAttributes {
  id: string;
  attributes: {
    documentId: string;
    Image?: {
      url: string;
      alternativeText?: string;
    };
    backgroundCover?: {
      variants: {
        square: {
          webp: {
            url: string;
            alt: string;
          };
        };
      };
    };
    header?: string;
    title?: string;
    subtitle?: string;
    description?: string;
    readMoreButton?: string;
    content?: Array<Record<string, unknown>>;
  };
}

// CTA cover interface
export interface CTACover extends StrapiAttributes {
  id: number;
  data: {
    attributes: {
      backgroundCover: AnteImage;
    };
  };
}

// Features page data
export interface FeaturesPageData extends StrapiAttributes {
  id: number;
  attributes: {
    pageTitle: string;
    subtitle: string;
    backgroundCover?: AnteImage;
  };
}

// Newsletter page data
export interface NewsletterPageData extends StrapiAttributes {
  id: number;
  attributes: {
    subtitle: string;
    backgroundCover?: AnteImage;
    pageTitle: string;
  };
}

export interface FooterPageData extends StrapiAttributes {
  title: string;
  emailAddress: string;
  address: string;
  madeBy: string;
  footerLogo: {
    url: string;
    alt?: string;
  };
  privacyPolicy: {
    url: string;
  };
  termsAndConditions: {
    url: string;
  };
  copyright: string;
}

export interface FooterSocialMedia extends StrapiAttributes {
  id: number;
  attributes: {
    socialMediaLogo: {
      url: string;
    };
    socialMediaLink: string;
  };
}

export interface FAQItem extends StrapiAttributes {
  id: number;
  Question: string;
  Answer: string;
}

// Ante API FAQ Response
export interface AnteFAQResponse {
  statusCode: number;
  message: string;
  data: Array<{
    id: string;
    attributes: {
      question: string; // Note: contains the answer in API response
      answer: string; // Note: contains the question in API response
    };
    meta: {
      status: string;
      publishedAt: {
        dateTime: string;
        time: string;
        time24: string;
        date: string;
        dateFull: string;
        dateStandard: string;
        raw: string;
        timeAgo: string;
        day: string;
        daySmall: string;
      };
      locale: string;
    };
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
  };
}

// Core Values API Response from Ante API
export interface AnteCoreValuesResponse {
  statusCode: number;
  message: string;
  data: Array<{
    id: string;
    attributes: {
      title: string;
      description: string;
      image: AnteImage;
    };
    meta: {
      status: string;
      publishedAt: {
        dateTime: string;
        time: string;
        time24: string;
        date: string;
        dateFull: string;
        dateStandard: string;
        raw: string;
        timeAgo: string;
        day: string;
        daySmall: string;
      };
      locale: string;
    };
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
  };
}

// How It Works API Response from Ante API
export interface AnteHowItWorksResponse {
  statusCode: number;
  message: string;
  data: {
    id: string;
    attributes: {
      titleHeader: string;
      subHeader: string;
      deploymentTitle: string;
      deploymentSubtitle: string;
      howItWorksTimelineImage: AnteImage;
      backgroundCover: AnteImage;
      benefitsTitle: string;
    };
    meta: {
      status: string;
      publishedAt: {
        dateTime: string;
        time: string;
        time24: string;
        date: string;
        dateFull: string;
        dateStandard: string;
        raw: string;
        timeAgo: string;
        day: string;
        daySmall: string;
      };
      locale: string;
    };
  };
}

export interface CoreValue extends StrapiAttributes {
  id: number;
  Title: string;
  Description: string;
  CoverPhoto?: {
    url: string;
    alternativeText?: string;
  };
}

export interface IndustryLeader extends StrapiAttributes {
  id: number;
  attributes?: {
    partnerLogo?: {
      variants: {
        small: {
          webp: {
            url: string;
          };
        };
      };
    };
  };
}

// Strapi Content Management Service
class anteContentService {
  private async fetchAPI<T>(endpoint: string): Promise<T> {
    // During Docker build, return dummy data to prevent build failures
    if (process.env.NEXT_DISABLE_STRAPI === 'true') {
      console.log(`Build mode: returning dummy data for ${endpoint}`);
      return this.getDummyData<T>(endpoint);
    }

    const url = `${ANTE_API}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'ante_71d95088e54368a9bfd906ab1d578eb8b104564edcdc9c9a59ff4f4509827341',
        },
      });

      if (!response.ok) {
        console.log(`API call failed for ${endpoint}: ${response.status}`);
        // Return dummy data to prevent build failures
        return this.getDummyData<T>(endpoint);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      // Return dummy data to prevent build failures
      return this.getDummyData<T>(endpoint);
    }
  }

  // Provide dummy data during build to prevent failures
  private getDummyData<T>(endpoint: string): T {
    if (endpoint.includes('/footer')) {
      return {
        data: {
          FooterLogo: { url: '/placeholder-logo.jpg', alternativeText: 'Logo' },
          Title: 'Multibook',
          EmailAddress: 'info@multibook.com',
          Address: 'Sample Address',
          MadeBy: 'Multibook Team',
        },
        meta: {},
      } as T;
    }

    if (endpoint.includes('/footer-social-medias')) {
      return {
        data: [],
        meta: {},
      } as T;
    }

    // Newsletter endpoints
    if (endpoint.includes('/newsletter')) {
      return {
        data: [],
        meta: { pagination: { page: 1, pageSize: 1, pageCount: 0, total: 0 } },
      } as T;
    }

    // Landing page endpoints
    if (endpoint.includes('/landing-page')) {
      return {
        data: {
          LandingPageHeadline: 'Multibook',
          LandingPageSubheadline: 'Build Mode',
          Logo: { url: '/placeholder-logo.jpg', alternativeText: 'Logo' },
        },
        meta: {},
      } as T;
    }

    // About us endpoints
    if (endpoint.includes('/about-us') || endpoint.includes('/aboutUsPage')) {
      return {
        data: {
          id: 'build-mode',
          attributes: {
            videoLink: '',
            companyDefinition: '<div>Build mode placeholder content</div>',
            companyBackgroundCover: {
              id: 1,
              url: '/placeholder-bg.jpg',
              alt: 'Background',
              width: 800,
              height: 600,
              variants: {
                large: { webp: { url: '/placeholder-bg.jpg' } },
              },
            },
            missionTitle: 'Mission',
            missionDescription: '<div>Build mode mission</div>',
            visionTitle: 'Vision',
            visionDescription: '<div>Build mode vision</div>',
            ceoPicture: {
              id: 2,
              url: '/placeholder-ceo.jpg',
              alt: 'CEO',
              width: 400,
              height: 400,
              variants: {},
            },
            messageTitle: 'Message from the CEO',
            messageBody: 'Build mode message',
            ceoName: 'Build Mode CEO',
            position: 'CEO',
            messageOfCeo: '<div>Build mode CEO message</div>',
          },
          meta: {
            publishedAt: {
              raw: new Date().toISOString(),
            },
          },
        },
        meta: {},
      } as T;
    }

    // FAQ endpoints
    if (endpoint.includes('/frequently-asked-questions')) {
      return {
        data: [],
        meta: {},
      } as T;
    }

    // Contact Us endpoints
    if (endpoint.includes('/contact-us')) {
      return {
        data: {
          Title: 'Contact Us',
          Description: 'Get in touch',
        },
        meta: {},
      } as T;
    }

    // Hero banners, features, etc. - return empty arrays
    if (
      endpoint.includes('hero-banners') ||
      endpoint.includes('our-features') ||
      endpoint.includes('industry-leaders') ||
      endpoint.includes('core-values') ||
      endpoint.includes('key-benefits') ||
      endpoint.includes('deployments')
    ) {
      return {
        data: [],
        meta: {},
      } as T;
    }

    // Favicon endpoint
    if (endpoint.includes('multibookFavicon')) {
      return {
        statusCode: 200,
        message: 'Build mode',
        data: {
          id: 'build-mode',
          attributes: {
            favicon: {
              id: 1,
              url: '/icon.jpg',
              alt: 'Multibook',
              width: 512,
              height: 512,
              variants: {},
            },
          },
          meta: {
            status: 'published',
            publishedAt: {
              raw: new Date().toISOString(),
            },
          },
        },
      } as T;
    }

    // Default empty response for other endpoints
    return {
      data: endpoint.includes('?') || endpoint.includes('contents') ? [] : null,
      meta: {},
    } as T;
  }

  // Get full URL for media files
  getMediaUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${BASE_URL}${url}`;
  }

  // Navigation data
  async getNavigationData(): Promise<StrapiResponse<NavigationData>> {
    return this.fetchAPI<StrapiResponse<NavigationData>>('/cms/single/navigationSection');
  }

  // Footer data
  async getFooterData(): Promise<StrapiResponse<FooterPageData>> {
    return this.fetchAPI<StrapiResponse<FooterPageData>>('/cms/single/footerSection');
  }

  // Footer social media
  async getFooterSocialMedia(): Promise<StrapiResponse<FooterSocialMedia[]>> {
    return this.fetchAPI<StrapiResponse<FooterSocialMedia[]>>('/cms/footerSectionSocialMedia');
  }

  // Landing page data
  async getLandingPage(): Promise<StrapiResponse<LandingPageData>> {
    return this.fetchAPI<StrapiResponse<LandingPageData>>('/cms/single/landingPage');
  }

  // Hero images
  async getHeroImages(): Promise<StrapiResponse<HeroImage[]>> {
    return this.fetchAPI<StrapiResponse<HeroImage[]>>('/cms/landingPageHeroBannerCover');
  }

  // Features
  async getFeatures(): Promise<StrapiResponse<Feature[]>> {
    return this.fetchAPI<StrapiResponse<Feature[]>>('/cms/ourFeatureSection');
  }

  // Industry leaders
  async getIndustryLeaders(): Promise<StrapiResponse<IndustryLeader[]>> {
    return this.fetchAPI<StrapiResponse<IndustryLeader[]>>('/cms/landingPagePartners');
  }

  // Get CTA cover
  async getCTACover(): Promise<StrapiResponse<CTACover>> {
    return this.fetchAPI<StrapiResponse<CTACover>>('/cms/single/ctaSection');
  }

  // Features Page
  async getFeaturesPage(): Promise<StrapiResponse<FeaturesPageData>> {
    return this.fetchAPI<StrapiResponse<FeaturesPageData>>('/cms/single/featuresPage');
  }

  // Newsletter Page
  async getNewsletterPage(): Promise<StrapiResponse<NewsletterPageData>> {
    return this.fetchAPI<StrapiResponse<NewsletterPageData>>('/cms/single/newsletterPage');
  }

  // Newsletter content - updated for new Ante API
  async getNewsletterContent(
    pagination?: PaginationParams,
    sortByDate: boolean = true
  ): Promise<StrapiResponse<any[]>> {
    // Fetch all newsletters from the API
    const response = await this.fetchAPI<any>('/cms/landingPageOurNewsletter');

    if (response && response.data && Array.isArray(response.data)) {
      let items = response.data;

      // Sort by date if requested
      if (sortByDate) {
        items = items.sort((a: any, b: any) => {
          const dateA = new Date(a.meta?.publishedAt?.raw || 0).getTime();
          const dateB = new Date(b.meta?.publishedAt?.raw || 0).getTime();
          return dateB - dateA; // Descending order
        });
      }

      // Apply pagination if provided
      let paginatedItems = items;
      const defaultPageSize = 10; // Default page size
      let paginationMeta = {
        page: 1,
        pageSize: items.length,
        pageCount: Math.max(1, Math.ceil(items.length / defaultPageSize)),
        total: items.length,
      };

      if (pagination) {
        const page = pagination.page || 1;
        const pageSize = pagination.pageSize || 10;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;

        paginatedItems = items.slice(start, end);
        paginationMeta = {
          page,
          pageSize,
          pageCount: Math.ceil(items.length / pageSize),
          total: items.length,
        };
      }

      return {
        data: paginatedItems,
        meta: {
          pagination: paginationMeta,
        },
      };
    }

    // Return empty array if no data
    return {
      data: [],
      meta: {
        pagination: {
          page: 1,
          pageSize: 10,
          pageCount: 0,
          total: 0,
        },
      },
    };
  }

  //
  //
  //
  //
  //

  // About Us data - updated for Ante API
  async getAboutUs(): Promise<StrapiResponse<AboutUsData>> {
    const response = await this.fetchAPI<AnteAboutUsResponse>('/cms/single/aboutUsPage');

    // Transform Ante API response to match existing AboutUsData interface
    if (response && response.data && response.data.attributes) {
      const attrs = response.data.attributes;

      // Helper function to extract text from HTML div content
      const extractTextFromHTML = (htmlString: string): string => {
        if (!htmlString) return '';
        return htmlString
          .replace(/<div>/g, '')
          .replace(/<\/div>/g, '\n')
          .replace(/<br>/g, '\n')
          .replace(/<[^>]*>/g, '')
          .trim();
      };

      const transformedData: AboutUsData = {
        createdAt: response.data.meta.publishedAt.raw,
        updatedAt: response.data.meta.publishedAt.raw,
        publishedAt: response.data.meta.publishedAt.raw,
        Logo: { url: '/images/logo/desktop/full-color.png' }, // Default logo
        BookAConsultation: 'Book a Consultation',
        VideoLink: attrs.videoLink || '',
        Body: extractTextFromHTML(attrs.companyDefinition),
        MissionTitle: attrs.missionTitle || 'Mission',
        MissionBody: extractTextFromHTML(attrs.missionDescription),
        VisionTitle: attrs.visionTitle || 'Vision',
        VisionBody: extractTextFromHTML(attrs.visionDescription),
        MessageFromTheCEOTitle: attrs.messageTitle || 'Message from the CEO',
        MessageFromTheCEOBody: extractTextFromHTML(attrs.messageOfCeo),
        CEOMessage: extractTextFromHTML(attrs.messageOfCeo),
        CEOName: attrs.ceoName || '',
        CEOPosition: attrs.position || '',
        JobPosition: attrs.position || '',
        CEOPicture: attrs.ceoPicture
          ? {
              url: attrs.ceoPicture.url,
              alt: attrs.ceoPicture.alt || attrs.ceoName,
            }
          : undefined,
        AboutCover: attrs.companyBackgroundCover
          ? {
              url: attrs.companyBackgroundCover.url,
              alt: attrs.companyBackgroundCover.alt || 'About Us Background',
            }
          : undefined,
        pageTitle: attrs.pageTitle || 'About Us - Multibook',
        PageDescription: extractTextFromHTML(attrs.companyDefinition).substring(0, 160),
        PageKeywords: 'about multibook, ERP solutions, cloud accounting, business management',
        backgroundCover: attrs.backgroundCover
          ? {
              url: attrs.backgroundCover.url,
              alt: attrs.backgroundCover.alt || 'About Us Background',
            }
          : undefined,
        CEOBackgroundCover: attrs.ceoBackgroundCover
          ? {
              url: attrs.ceoBackgroundCover.url,
              alt: attrs.ceoBackgroundCover.alt || 'CEO Background',
            }
          : undefined,
        coreValuesTitle: attrs.coreValuesTitle || 'Core Values',
      };

      return {
        data: transformedData,
        meta: {},
      };
    }

    // Fallback to old endpoint if transformation fails
    return this.fetchAPI<StrapiResponse<AboutUsData>>('/about-us?populate=*');
  }

  // Corporate Info Data
  async getCorporateInfoData(): Promise<StrapiResponse<any>> {
    return this.fetchAPI<any>('/cms/single/corporateInfoSection');
  }

  // Corporate Info page data - updated for new Ante API (Collection Type)
  async getCorporateInfo(): Promise<StrapiResponse<any[]>> {
    const response = await this.fetchAPI<any>('/cms/aboutUsCorporateInfo');

    // Transform the response to match expected format for collection
    if (response && response.data && Array.isArray(response.data)) {
      const transformedData = response.data.map((item: any) => ({
        id: item.id,
        label: item.attributes?.label,
        value: item.attributes?.value,
        ...item.attributes,
      }));

      return {
        data: transformedData,
        meta: response.meta || {},
      };
    }

    return {
      data: [],
      meta: {},
    };
  }

  // Corporate Info History data
  async getCorporateInfoHistory(): Promise<StrapiResponse<any[]>> {
    return this.fetchAPI<StrapiResponse<any[]>>('/cms/aboutUsCorporateInfoHistory');
  }

  // Single newsletter item
  async getNewsletterItem(documentId: string): Promise<StrapiResponse<NewsletterItem>> {
    return this.fetchAPI<StrapiResponse<NewsletterItem>>(
      `/newsletter-contents/${documentId}?populate=*`
    );
  }

  // Services - How it works
  async getServicesHowItWorks(): Promise<StrapiResponse<Record<string, unknown>>> {
    return this.fetchAPI<StrapiResponse<Record<string, unknown>>>(
      '/services-how-it-work?populate=*'
    );
  }

  // How it works hero images
  async getHowItWorksHeroImages(): Promise<StrapiResponse<HeroImage[]>> {
    return this.fetchAPI<StrapiResponse<HeroImage[]>>('/how-it-works-hero-banners?populate=*');
  }

  // How it works key benefits
  async getHowItWorksKeyBenefits(): Promise<
    StrapiResponse<
      Array<{
        id: number;
        Title: string;
        Description: string;
      }>
    >
  > {
    return this.fetchAPI<
      StrapiResponse<
        Array<{
          id: number;
          Title: string;
          Description: string;
        }>
      >
    >('/how-it-works-key-benefits?populate=*');
  }

  // How it works deployment
  async getHowItWorksDeployment(): Promise<
    StrapiResponse<
      Array<{
        id: number;
        Title: string;
        Description: string;
      }>
    >
  > {
    return this.fetchAPI<
      StrapiResponse<
        Array<{
          id: number;
          Title: string;
          Description: string;
        }>
      >
    >('/services-how-it-works-deployments?populate=*');
  }

  // Services - Features (main features page data)
  async getServicesFeatures(): Promise<StrapiResponse<Record<string, unknown>>> {
    // For now, return empty data as this endpoint is not in the new API
    return {
      data: {
        Title: 'Features',
        DashboardTitle: 'Dashboard',
        LeasedAssetsTitle: 'Leased Assets',
        AccountingTitle: 'Accounting',
        LogisticsTitle: 'Logistics',
        FixedAssetsTitle: 'Fixed Assets',
        ReimbursementsTitle: 'Reimbursements',
      },
      meta: {},
    };
  }

  // Features Dashboard - updated for new Ante API
  async getFeaturesDashboard(): Promise<StrapiResponse<any[]>> {
    const response = await this.fetchAPI<any>('/cms/featureDashboard');

    if (response && response.data && Array.isArray(response.data)) {
      const transformedData = response.data.map((item: any) => ({
        id: item.id,
        Title: item.attributes?.title || '',
        Description: item.attributes?.description || '',
      }));

      return {
        data: transformedData,
        meta: response.meta || {},
      };
    }

    return { data: [], meta: {} };
  }

  // Features Leased Assets - updated for new Ante API
  async getFeaturesLeasedAssets(): Promise<StrapiResponse<any[]>> {
    const response = await this.fetchAPI<any>('/cms/featureLeasedAssets');

    if (response && response.data && Array.isArray(response.data)) {
      const transformedData = response.data.map((item: any) => ({
        id: item.id,
        Title: item.attributes?.title || '',
        Description: item.attributes?.description || '',
      }));

      return {
        data: transformedData,
        meta: response.meta || {},
      };
    }

    return { data: [], meta: {} };
  }

  // Features Accounting - updated for new Ante API
  async getFeaturesAccounting(): Promise<StrapiResponse<any[]>> {
    const response = await this.fetchAPI<any>('/cms/featureAccounting');

    if (response && response.data && Array.isArray(response.data)) {
      const transformedData = response.data.map((item: any) => ({
        id: item.id,
        Title: item.attributes?.title || '',
        Description: item.attributes?.description || '',
      }));

      return {
        data: transformedData,
        meta: response.meta || {},
      };
    }

    return { data: [], meta: {} };
  }

  // Features Logistics - updated for new Ante API
  async getFeaturesLogistics(): Promise<StrapiResponse<any[]>> {
    const response = await this.fetchAPI<any>('/cms/featureLogistics');

    if (response && response.data && Array.isArray(response.data)) {
      const transformedData = response.data.map((item: any) => ({
        id: item.id,
        Title: item.attributes?.title || '',
        Description: item.attributes?.description || '',
      }));

      return {
        data: transformedData,
        meta: response.meta || {},
      };
    }

    return { data: [], meta: {} };
  }

  // Features Fixed Assets - updated for new Ante API
  async getFeaturesFixedAssets(): Promise<StrapiResponse<any[]>> {
    const response = await this.fetchAPI<any>('/cms/featureFixedAssets');

    if (response && response.data && Array.isArray(response.data)) {
      const transformedData = response.data.map((item: any) => ({
        id: item.id,
        Title: item.attributes?.title || '',
        Description: item.attributes?.description || '',
      }));

      return {
        data: transformedData,
        meta: response.meta || {},
      };
    }

    return { data: [], meta: {} };
  }

  // Features Reimbursements - updated for new Ante API
  async getFeaturesReimbursements(): Promise<StrapiResponse<any[]>> {
    const response = await this.fetchAPI<any>('/cms/featureReimbursement');

    if (response && response.data && Array.isArray(response.data)) {
      const transformedData = response.data.map((item: any) => ({
        id: item.id,
        Title: item.attributes?.title || '',
        Description: item.attributes?.description || '',
      }));

      return {
        data: transformedData,
        meta: response.meta || {},
      };
    }

    return { data: [], meta: {} };
  }

  // Feature Page - Dashboard - updated for new Ante API
  async getFeaturePageDashboard(): Promise<StrapiResponse<any>> {
    const response = await this.fetchAPI<any>('/cms/single/featurePageDashboard');
    return response;
  }

  // Feature Page - Reimbursement - updated for new Ante API
  async getFeaturePageReimbursement(): Promise<StrapiResponse<any>> {
    const response = await this.fetchAPI<any>('/cms/single/featurePageReimbursement');
    return response;
  }

  // Feature Page - Fixed Assets - updated for new Ante API
  async getFeaturePageFixedAssets(): Promise<StrapiResponse<any>> {
    const response = await this.fetchAPI<any>('/cms/single/featurePageFixedAssets');
    return response;
  }

  // Feature Page - Logistics - updated for new Ante API
  async getFeaturePageLogistics(): Promise<StrapiResponse<any>> {
    const response = await this.fetchAPI<any>('/cms/single/featurePageLogistics');
    return response;
  }

  // Feature Page - Accounting - updated for new Ante API
  async getFeaturePageAccounting(): Promise<StrapiResponse<any>> {
    const response = await this.fetchAPI<any>('/cms/single/featurePageAccounting');
    return response;
  }

  // Feature Page - Leased Assets - updated for new Ante API
  async getFeaturePageLeasedAssets(): Promise<StrapiResponse<any>> {
    const response = await this.fetchAPI<any>('/cms/single/featurePageLeasedAssets');
    return response;
  }

  // FAQ Page - updated for Ante API
  async getFAQPage(): Promise<StrapiResponse<any>> {
    const response = await this.fetchAPI<any>('/cms/single/faqs');
    return response;
  }

  // FAQs - updated for Ante API
  async getFAQs(): Promise<StrapiResponse<FAQItem[]>> {
    const response = await this.fetchAPI<AnteFAQResponse>('/cms/faqsPage');

    // Transform Ante API response to match existing FAQItem interface
    if (response && response.data && Array.isArray(response.data)) {
      const transformedData: FAQItem[] = response.data.map((item, index) => ({
        id: index + 1, // Use index as id since API returns string ids
        Question: item.attributes.answer, // Swap: answer field contains the question
        Answer: item.attributes.question, // Swap: question field contains the answer
        createdAt: item.meta.publishedAt.raw,
        updatedAt: item.meta.publishedAt.raw,
        publishedAt: item.meta.publishedAt.raw,
      }));

      return {
        data: transformedData,
        meta: {
          pagination: {
            page: response.pagination.page,
            pageSize: response.pagination.pageSize,
            pageCount: response.pagination.pageCount,
            total: response.pagination.total,
          },
        },
      };
    }

    // Fallback to empty response if transformation fails
    return {
      data: [],
      meta: {
        pagination: {
          page: 1,
          pageSize: 20,
          pageCount: 0,
          total: 0,
        },
      },
    };
  }

  // Contact Us page data
  async getContactUs(): Promise<StrapiResponse<Record<string, unknown>>> {
    return this.fetchAPI<StrapiResponse<Record<string, unknown>>>('/cms/single/contactUsPage');
  }

  // Contact form
  async submitContactForm(data: Record<string, unknown>): Promise<unknown> {
    const response = await fetch(`${STRAPI_URL}/contact-forms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit form');
    }

    return response.json();
  }

  // Core values - updated for Ante API
  async getCoreValues(): Promise<StrapiResponse<CoreValue[]>> {
    const response = await this.fetchAPI<AnteCoreValuesResponse>('/cms/aboutUsCoreValues');

    // Transform Ante API response to match existing CoreValue interface
    if (response && response.data && Array.isArray(response.data)) {
      const transformedData: CoreValue[] = response.data.map((item, index) => ({
        id: index + 1, // Use index as id since API returns string ids
        Title: item.attributes.title,
        Description: item.attributes.description,
        CoverPhoto: item.attributes.image
          ? {
              url: item.attributes.image.url,
              alternativeText: item.attributes.image.alt || item.attributes.title,
            }
          : undefined,
        createdAt: item.meta.publishedAt.raw,
        updatedAt: item.meta.publishedAt.raw,
        publishedAt: item.meta.publishedAt.raw,
      }));

      return {
        data: transformedData,
        meta: {
          pagination: {
            page: response.pagination.page,
            pageSize: response.pagination.pageSize,
            pageCount: response.pagination.pageCount,
            total: response.pagination.total,
          },
        },
      };
    }

    // Fallback to old endpoint if transformation fails
    return this.fetchAPI<StrapiResponse<CoreValue[]>>('/about-us-core-values?populate=*');
  }

  // How it works - Ante API
  async getHowItWorks(): Promise<AnteHowItWorksResponse> {
    return this.fetchAPI<AnteHowItWorksResponse>('/cms/single/howItWorksPage');
  }

  // How it works key benefits - Ante API
  async getHowItWorksKeyBenefitsNew(): Promise<{
    statusCode: number;
    message: string;
    data: Array<{
      id: string;
      attributes: {
        benefitsTitle: string;
        benefitsDescription: string;
      };
      meta: {
        status: string;
        publishedAt: {
          dateTime: string;
          time: string;
          time24: string;
          date: string;
          dateFull: string;
          dateStandard: string;
          raw: string;
          timeAgo: string;
          day: string;
          daySmall: string;
        };
        locale: string;
      };
    }>;
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      pageCount: number;
    };
  }> {
    return this.fetchAPI('/cms/howitworksKeyBenefits');
  }

  // Get favicon from CMS
  async getFavicon(): Promise<AnteFaviconResponse> {
    return this.fetchAPI<AnteFaviconResponse>('/cms/single/multibookFavicon');
  }
}

export const anteClient = new anteContentService();
export const strapiClient = anteClient; // Backward compatibility alias
