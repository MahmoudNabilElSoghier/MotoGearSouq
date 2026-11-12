import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { withDb, type DbResult } from "../common/with-db";
import { PrismaService } from "../prisma/prisma.service";
import {
  type LandingCard,
  type LandingSection,
  type LandingSlide,
} from "@motogearsouq/shared";

interface SectionWithCards {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string | null;
  subtitleEn: string | null;
  ctaLabelAr: string | null;
  ctaLabelEn: string | null;
  ctaLink: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  cards: Array<{
    id: string;
    sectionId: string;
    titleAr: string;
    titleEn: string;
    descAr: string | null;
    descEn: string | null;
    link: string;
    photo: string | null;
    order: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

@Injectable()
export class LandingService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getLandingSections(): Promise<DbResult<LandingSection[]>> {
    return withDb(
      this.prisma,
      async (db) => {
        const sections = await db.landingSection.findMany({
          orderBy: { order: "asc" },
          include: {
            cards: { orderBy: { order: "asc" } },
          },
        });
        return sections.map((s) => mapSection(s));
      },
      () => [],
    );
  }

  async createSection(
    input: {
      slug: string;
      titleAr: string;
      titleEn: string;
      subtitleAr?: string | null;
      subtitleEn?: string | null;
      ctaLabelAr?: string | null;
      ctaLabelEn?: string | null;
      ctaLink?: string | null;
      order?: string | number;
    },
  ): Promise<DbResult<LandingSection>> {
    return withDb(
      this.prisma,
      async (db) => {
        const existing = await db.landingSection.findUnique({
          where: { slug: input.slug },
        });
        if (existing) throw new NotFoundException("Section slug already exists");
        const created = await db.landingSection.create({
          data: {
            slug: input.slug,
            titleAr: input.titleAr,
            titleEn: input.titleEn,
            subtitleAr: input.subtitleAr ?? null,
            subtitleEn: input.subtitleEn ?? null,
            ctaLabelAr: input.ctaLabelAr ?? null,
            ctaLabelEn: input.ctaLabelEn ?? null,
            ctaLink: input.ctaLink ?? null,
            order: input.order != null ? Number(input.order) : 0,
          },
        });
        return {
          id: created.id,
          slug: created.slug,
          titleAr: created.titleAr,
          titleEn: created.titleEn,
          subtitleAr: created.subtitleAr ?? null,
          subtitleEn: created.subtitleEn ?? null,
          ctaLabelAr: created.ctaLabelAr ?? null,
          ctaLabelEn: created.ctaLabelEn ?? null,
          ctaLink: created.ctaLink ?? null,
          order: created.order,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        };
      },
      () => ({
        id: `tmp-${Date.now()}`,
        slug: input.slug,
        titleAr: input.titleAr,
        titleEn: input.titleEn,
        subtitleAr: input.subtitleAr ?? null,
        subtitleEn: input.subtitleEn ?? null,
        ctaLabelAr: input.ctaLabelAr ?? null,
        ctaLabelEn: input.ctaLabelEn ?? null,
        ctaLink: input.ctaLink ?? null,
        order: input.order != null ? Number(input.order) : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );
  }

  async updateSection(
    id: string,
    input: {
      slug?: string;
      titleAr?: string;
      titleEn?: string;
      subtitleAr?: string | null;
      subtitleEn?: string | null;
      ctaLabelAr?: string | null;
      ctaLabelEn?: string | null;
      ctaLink?: string | null;
      order?: string | number;
    },
  ): Promise<DbResult<LandingSection | null>> {
    return withDb(
      this.prisma,
      async (db) => {
        const existing = await db.landingSection.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException("Landing section not found");
        await db.landingSection.update({
          where: { id },
          data: {
            slug: input.slug ?? existing.slug,
            titleAr: input.titleAr ?? existing.titleAr,
            titleEn: input.titleEn ?? existing.titleEn,
            subtitleAr:
              input.subtitleAr !== undefined
                ? input.subtitleAr
                : existing.subtitleAr,
            subtitleEn:
              input.subtitleEn !== undefined
                ? input.subtitleEn
                : existing.subtitleEn,
            ctaLabelAr:
              input.ctaLabelAr !== undefined
                ? input.ctaLabelAr
                : existing.ctaLabelAr,
            ctaLabelEn:
              input.ctaLabelEn !== undefined
                ? input.ctaLabelEn
                : existing.ctaLabelEn,
            ctaLink:
              input.ctaLink !== undefined ? input.ctaLink : existing.ctaLink,
            order: input.order != null ? Number(input.order) : existing.order,
          },
        });
        const withCards = await db.landingSection.findUnique({
          where: { id },
          include: { cards: { orderBy: { order: "asc" } } },
        });
        if (!withCards) return null;
        return {
          id: withCards.id,
          slug: withCards.slug,
          titleAr: withCards.titleAr,
          titleEn: withCards.titleEn,
          subtitleAr: withCards.subtitleAr ?? null,
          subtitleEn: withCards.subtitleEn ?? null,
          ctaLabelAr: withCards.ctaLabelAr ?? null,
          ctaLabelEn: withCards.ctaLabelEn ?? null,
          ctaLink: withCards.ctaLink ?? null,
          order: withCards.order,
          createdAt: withCards.createdAt.toISOString(),
          updatedAt: withCards.updatedAt.toISOString(),
          cards: withCards.cards.map(mapCard),
        };
      },
      () => null,
    );
  }

  async addCard(
    input: {
      sectionId: string;
      titleAr: string;
      titleEn: string;
      descAr?: string | null;
      descEn?: string | null;
      link: string;
      photo?: string | null;
      order?: string | number;
    },
  ): Promise<DbResult<LandingCard>> {
    return withDb(
      this.prisma,
      async (db) => {
        const section = await db.landingSection.findUnique({
          where: { id: input.sectionId },
        });
        if (!section) throw new NotFoundException("Landing section not found");
        const order =
          input.order != null
            ? Number(input.order)
            : (await db.landingCard.count()) + 1;
        const created = await db.landingCard.create({
          data: {
            sectionId: input.sectionId,
            titleAr: input.titleAr,
            titleEn: input.titleEn,
            descAr: input.descAr ?? null,
            descEn: input.descEn ?? null,
            link: input.link,
            photo: input.photo ?? null,
            order,
          },
        });
        return mapCard(created);
      },
      () => ({
        id: `tmp-${Date.now()}`,
        sectionId: input.sectionId,
        titleAr: input.titleAr,
        titleEn: input.titleEn,
        descAr: input.descAr ?? null,
        descEn: input.descEn ?? null,
        link: input.link,
        photo: input.photo ?? null,
        order: input.order != null ? Number(input.order) : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );
  }

  async updateCard(
    id: string,
    input: {
      titleAr?: string;
      titleEn?: string;
      descAr?: string | null;
      descEn?: string | null;
      link?: string;
      photo?: string | null;
      order?: string | number;
    },
  ): Promise<DbResult<LandingCard | null>> {
    return withDb(
      this.prisma,
      async (db) => {
        const existing = await db.landingCard.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException("Landing card not found");
        const updated = await db.landingCard.update({
          where: { id },
          data: {
            titleAr: input.titleAr ?? existing.titleAr,
            titleEn: input.titleEn ?? existing.titleEn,
            descAr:
              input.descAr !== undefined ? input.descAr : existing.descAr,
            descEn:
              input.descEn !== undefined ? input.descEn : existing.descEn,
            link: input.link ?? existing.link,
            photo:
              input.photo !== undefined ? input.photo : existing.photo,
            order: input.order != null ? Number(input.order) : existing.order,
          },
        });
        return mapCard(updated);
      },
      () => null,
    );
  }

  async removeCard(id: string): Promise<DbResult<{ id: string }>> {
    return withDb(
      this.prisma,
      async (db) => {
        const existing = await db.landingCard.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException("Landing card not found");
        await db.landingCard.delete({ where: { id } });
        return { id };
      },
      () => ({ id }),
    );
  }

  async removeSection(id: string): Promise<DbResult<{ id: string }>> {
    return withDb(
      this.prisma,
      async (db) => {
        const existing = await db.landingSection.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException("Landing section not found");
        // Cards are removed by the schema's onDelete: Cascade relation.
        await db.landingSection.delete({ where: { id } });
        return { id };
      },
      () => ({ id }),
    );
  }

  // ---------- Hero slides ----------

  async findAllSlides(): Promise<DbResult<LandingSlide[]>> {
    return withDb(
      this.prisma,
      async (db) => {
        const slides = await db.landingSlide.findMany({
          orderBy: { order: "asc" },
        });
        return slides.map(mapSlide);
      },
      () => [],
    );
  }

  async findActiveSlides(): Promise<DbResult<LandingSlide[]>> {
    return withDb(
      this.prisma,
      async (db) => {
        const slides = await db.landingSlide.findMany({
          where: { isActive: true },
          orderBy: { order: "asc" },
        });
        return slides.map(mapSlide);
      },
      () => [],
    );
  }

  async createSlide(
    input: {
      titleAr: string;
      titleEn: string;
      subtitleAr?: string | null;
      subtitleEn?: string | null;
      image?: string | null;
      ctaPrimaryLabelAr?: string | null;
      ctaPrimaryLabelEn?: string | null;
      ctaPrimaryLink?: string | null;
      ctaSecondaryLabelAr?: string | null;
      ctaSecondaryLabelEn?: string | null;
      ctaSecondaryLink?: string | null;
      order?: string | number;
      isActive?: boolean;
    },
  ): Promise<DbResult<LandingSlide>> {
    return withDb(
      this.prisma,
      async (db) => {
        const created = await db.landingSlide.create({
          data: {
            titleAr: input.titleAr,
            titleEn: input.titleEn,
            subtitleAr: input.subtitleAr ?? null,
            subtitleEn: input.subtitleEn ?? null,
            image: input.image ?? null,
            ctaPrimaryLabelAr: input.ctaPrimaryLabelAr ?? null,
            ctaPrimaryLabelEn: input.ctaPrimaryLabelEn ?? null,
            ctaPrimaryLink: input.ctaPrimaryLink ?? null,
            ctaSecondaryLabelAr: input.ctaSecondaryLabelAr ?? null,
            ctaSecondaryLabelEn: input.ctaSecondaryLabelEn ?? null,
            ctaSecondaryLink: input.ctaSecondaryLink ?? null,
            order: input.order != null ? Number(input.order) : 0,
            isActive: input.isActive ?? true,
          },
        });
        return mapSlide(created);
      },
      () => mapSlide(createTempSlide(input)),
    );
  }

  async updateSlide(
    id: string,
    input: {
      titleAr?: string;
      titleEn?: string;
      subtitleAr?: string | null;
      subtitleEn?: string | null;
      image?: string | null;
      ctaPrimaryLabelAr?: string | null;
      ctaPrimaryLabelEn?: string | null;
      ctaPrimaryLink?: string | null;
      ctaSecondaryLabelAr?: string | null;
      ctaSecondaryLabelEn?: string | null;
      ctaSecondaryLink?: string | null;
      order?: string | number;
      isActive?: boolean;
    },
  ): Promise<DbResult<LandingSlide | null>> {
    return withDb(
      this.prisma,
      async (db) => {
        const existing = await db.landingSlide.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException("Landing slide not found");
        const updated = await db.landingSlide.update({
          where: { id },
          data: {
            titleAr: input.titleAr ?? existing.titleAr,
            titleEn: input.titleEn ?? existing.titleEn,
            subtitleAr:
              input.subtitleAr !== undefined
                ? input.subtitleAr
                : existing.subtitleAr,
            subtitleEn:
              input.subtitleEn !== undefined
                ? input.subtitleEn
                : existing.subtitleEn,
            image: input.image !== undefined ? input.image : existing.image,
            ctaPrimaryLabelAr:
              input.ctaPrimaryLabelAr !== undefined
                ? input.ctaPrimaryLabelAr
                : existing.ctaPrimaryLabelAr,
            ctaPrimaryLabelEn:
              input.ctaPrimaryLabelEn !== undefined
                ? input.ctaPrimaryLabelEn
                : existing.ctaPrimaryLabelEn,
            ctaPrimaryLink:
              input.ctaPrimaryLink !== undefined
                ? input.ctaPrimaryLink
                : existing.ctaPrimaryLink,
            ctaSecondaryLabelAr:
              input.ctaSecondaryLabelAr !== undefined
                ? input.ctaSecondaryLabelAr
                : existing.ctaSecondaryLabelAr,
            ctaSecondaryLabelEn:
              input.ctaSecondaryLabelEn !== undefined
                ? input.ctaSecondaryLabelEn
                : existing.ctaSecondaryLabelEn,
            ctaSecondaryLink:
              input.ctaSecondaryLink !== undefined
                ? input.ctaSecondaryLink
                : existing.ctaSecondaryLink,
            order: input.order != null ? Number(input.order) : existing.order,
            isActive: input.isActive ?? existing.isActive,
          },
        });
        return mapSlide(updated);
      },
      () => null,
    );
  }

  async deleteSlide(id: string): Promise<DbResult<{ id: string }>> {
    return withDb(
      this.prisma,
      async (db) => {
        const existing = await db.landingSlide.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException("Landing slide not found");
        await db.landingSlide.delete({ where: { id } });
        return { id };
      },
      () => ({ id }),
    );
  }

  async reorderSlides(
    orderedIds: string[],
  ): Promise<DbResult<{ updated: number }>> {
    return withDb(
      this.prisma,
      async (db) => {
        let updated = 0;
        for (const [index, id] of orderedIds.entries()) {
          await db.landingSlide.update({
            where: { id },
            data: { order: index },
          });
          updated += 1;
        }
        return { updated };
      },
      () => ({ updated: 0 }),
    );
  }
}

function mapSection(s: SectionWithCards): LandingSection {
  return {
    id: s.id,
    slug: s.slug,
    titleAr: s.titleAr,
    titleEn: s.titleEn,
    subtitleAr: s.subtitleAr ?? null,
    subtitleEn: s.subtitleEn ?? null,
    ctaLabelAr: s.ctaLabelAr ?? null,
    ctaLabelEn: s.ctaLabelEn ?? null,
    ctaLink: s.ctaLink ?? null,
    order: s.order,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    cards: s.cards.map(mapCard),
  };
}

function mapCard(c: {
  id: string;
  sectionId: string;
  titleAr: string;
  titleEn: string;
  descAr: string | null;
  descEn: string | null;
  link: string;
  photo: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}): LandingCard {
  return {
    id: c.id,
    sectionId: c.sectionId,
    titleAr: c.titleAr,
    titleEn: c.titleEn,
    descAr: c.descAr,
    descEn: c.descEn,
    link: c.link,
    photo: c.photo ?? null,
    order: c.order,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function mapSlide(s: {
  id: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string | null;
  subtitleEn: string | null;
  image: string | null;
  ctaPrimaryLabelAr: string | null;
  ctaPrimaryLabelEn: string | null;
  ctaPrimaryLink: string | null;
  ctaSecondaryLabelAr: string | null;
  ctaSecondaryLabelEn: string | null;
  ctaSecondaryLink: string | null;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): LandingSlide {
  return {
    id: s.id,
    titleAr: s.titleAr,
    titleEn: s.titleEn,
    subtitleAr: s.subtitleAr ?? null,
    subtitleEn: s.subtitleEn ?? null,
    image: s.image ?? null,
    ctaPrimaryLabelAr: s.ctaPrimaryLabelAr ?? null,
    ctaPrimaryLabelEn: s.ctaPrimaryLabelEn ?? null,
    ctaPrimaryLink: s.ctaPrimaryLink ?? null,
    ctaSecondaryLabelAr: s.ctaSecondaryLabelAr ?? null,
    ctaSecondaryLabelEn: s.ctaSecondaryLabelEn ?? null,
    ctaSecondaryLink: s.ctaSecondaryLink ?? null,
    order: s.order,
    isActive: s.isActive,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

// Mock-mode fallback when the database is unreachable (withDb pattern).
function createTempSlide(input: {
  titleAr: string;
  titleEn: string;
  subtitleAr?: string | null;
  subtitleEn?: string | null;
  image?: string | null;
  ctaPrimaryLabelAr?: string | null;
  ctaPrimaryLabelEn?: string | null;
  ctaPrimaryLink?: string | null;
  ctaSecondaryLabelAr?: string | null;
  ctaSecondaryLabelEn?: string | null;
  ctaSecondaryLink?: string | null;
  order?: string | number;
  isActive?: boolean;
}) {
  return {
    id: `tmp-${Date.now()}`,
    titleAr: input.titleAr,
    titleEn: input.titleEn,
    subtitleAr: input.subtitleAr ?? null,
    subtitleEn: input.subtitleEn ?? null,
    image: input.image ?? null,
    ctaPrimaryLabelAr: input.ctaPrimaryLabelAr ?? null,
    ctaPrimaryLabelEn: input.ctaPrimaryLabelEn ?? null,
    ctaPrimaryLink: input.ctaPrimaryLink ?? null,
    ctaSecondaryLabelAr: input.ctaSecondaryLabelAr ?? null,
    ctaSecondaryLabelEn: input.ctaSecondaryLabelEn ?? null,
    ctaSecondaryLink: input.ctaSecondaryLink ?? null,
    order: input.order != null ? Number(input.order) : 0,
    isActive: input.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
