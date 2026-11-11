// Landing section / card types mirroring prisma/schema.prisma LandingSection
// and LandingCard models. Kept local (not Prisma-generated) because prisma
// generate requires DATABASE_URL which is not provisioned yet.
import type { Dateish } from "./common";

export interface LandingCard {
  id: string;
  sectionId: string;
  titleAr: string;
  titleEn: string;
  descAr?: string | null;
  descEn?: string | null;
  link: string;
  photo?: string | null;
  order: number;
  createdAt: Dateish;
  updatedAt: Dateish;
}

export interface LandingSection {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  subtitleAr?: string | null;
  subtitleEn?: string | null;
  ctaLabelAr?: string | null;
  ctaLabelEn?: string | null;
  ctaLink?: string | null;
  order: number;
  createdAt: Dateish;
  updatedAt: Dateish;
  cards?: LandingCard[];
}

export interface LandingSectionInput {
  slug: string;
  titleAr: string;
  titleEn: string;
  subtitleAr?: string | null;
  subtitleEn?: string | null;
  ctaLabelAr?: string | null;
  ctaLabelEn?: string | null;
  ctaLink?: string | null;
  order?: string | number;
}
