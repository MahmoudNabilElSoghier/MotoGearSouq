export interface CompanyConfig {
  name: string;
  nameEn: string;
  tagline: string;
  partnerName: string;
  partnerNameEn: string;
  established: number;
  yearsInBusiness: number;
  branchesCount: number;
  brandsCount: number;
  phone: string;
  phoneDisplay: string;
  whatsappNumber: string;
  whatsappUrl: string;
  email: string;
  partnerEmail: string;
  address: string;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface HeaderContent {
  logoSubtitle: string;
  whatsappLabel: string;
  menuLabel: string;
}

export interface HeroContent {
  headline: string;
  subheadline: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

export interface TrustBarItem {
  value: string;
  label: string;
}

export interface Category {
  id: string;
  title: string;
  description: string;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
}

export interface Brand {
  name: string;
  slug: string;
  /* TODO: add logo path once real brand assets are provided */
  logo?: string;
}

export interface GalleryImage {
  id: string;
  src: string;
  /* TODO: add descriptive Arabic alt text with the real photos */
  alt: string;
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  text: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  /* TODO: add real Google Maps links from client */
  mapUrl?: string;
}

export interface ContactFormData {
  name: string;
  phone: string;
  message: string;
}

export interface ContactField {
  label: string;
  placeholder: string;
}

export interface ContactFormContent {
  title: string;
  subtitle: string;
  fields: {
    name: ContactField;
    phone: ContactField;
    message: ContactField;
  };
  submitButton: string;
  successMessage: string;
  errorMessage: string;
}

export interface SocialLinks {
  facebook: string;
  instagram: string;
  whatsapp: string;
  youtube: string;
}

export interface FooterContent {
  tagline: string;
  social: SocialLinks;
  copyright: string;
}

export interface PageMeta {
  title: string;
  description: string;
  keywords: string[];
}

export interface SiteContent {
  navigation: NavItem[];
  hero: HeroContent;
  trustBar: TrustBarItem[];
  categories: Category[];
  whyUs: Feature[];
  brands: Brand[];
  gallery: GalleryImage[];
  testimonials: Testimonial[];
  branches: Branch[];
  contactForm: ContactFormContent;
  footer: FooterContent;
}
