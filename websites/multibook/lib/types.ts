// Shared types for the application

export interface NavLink {
  label: string;
  href: string;
  active?: boolean;
}

export interface DropdownLink extends NavLink {
  children?: NavLink[];
}

export interface CarouselItem {
  id: string | number;
  url: string;
  alt?: string;
}

export interface ContentState {
  isLoading: boolean;
  error: string | null;
}

// Component Props
export interface NavigationProps {
  isScrolled?: boolean;
  logoUrl?: string;
  bookConsultationText?: string;
}

export interface HeroSectionProps {
  headline: string;
  subheadline: string;
  images: CarouselItem[];
}

export interface FeatureCardProps {
  image: string;
  title: string;
  description: string;
}

export interface coreValuesCardProps {
  image: string;
  header: string;
  description: string;
}

export interface CTASectionProps {
  backgroundImage?: string;
  title?: string;
  buttonText?: string;
  buttonLink?: string;
}
