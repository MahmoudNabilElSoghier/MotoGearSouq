import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { withDb, type DbResult } from "../common/with-db";
import { PrismaService } from "../prisma/prisma.service";
import {
  type LandingCard,
  type LandingSection,
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
