import { Inject, Injectable } from "@nestjs/common";
import { mockBrands, mockModels } from "@motogearsouq/shared";
import type { Brand, BrandFormValues } from "@motogearsouq/shared";
import { withDb, type DbResult } from "../common/with-db";
import { toDomainError } from "../common/prisma-errors";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BrandsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  getBrands(): Promise<DbResult<Brand[]>> {
    return withDb(
      this.prisma,
      (db) =>
        db.brand.findMany({
          orderBy: { order: "asc" },
          include: { _count: { select: { models: true, products: true } } },
        }),
      () => mockBrands,
    );
  }

  getBrandBySlug(slug: string): Promise<DbResult<Brand | null>> {
    return withDb(
      this.prisma,
      (db) =>
        db.brand.findUnique({
          where: { slug },
          include: {
            models: { orderBy: { name: "asc" } },
            _count: { select: { models: true, products: true } },
          },
        }),
      () => {
        const brand = mockBrands.find((item) => item.slug === slug);
        if (!brand) return null;
        return {
          ...brand,
          models: mockModels.filter((model) => model.brandId === brand.id),
        };
      },
    );
  }

  async create(input: BrandFormValues): Promise<DbResult<Brand>> {
    if (!process.env.DATABASE_URL) {
      const now = new Date().toISOString();
      return {
        data: {
          id: `tmp-${input.slug}`,
          name: input.name,
          nameAr: input.nameAr ?? null,
          slug: input.slug,
          logoUrl: null,
          website: input.website || null,
          description: input.description ?? null,
          order: 0,
          createdAt: now,
          updatedAt: now,
        },
        isMock: true,
      };
    }
    try {
      const order = (await this.prisma.get().brand.count()) + 1;
      const created = await this.prisma.get().brand.create({
        data: {
          name: input.name,
          nameAr: input.nameAr ?? null,
          slug: input.slug,
          website: input.website || null,
          description: input.description ?? null,
          order,
        },
      });
      return { data: created, isMock: false };
    } catch (error) {
      toDomainError(error);
    }
  }

  async update(id: string, input: BrandFormValues): Promise<DbResult<Brand>> {
    if (!process.env.DATABASE_URL) {
      const existing = mockBrands.find((item) => item.id === id);
      const now = new Date().toISOString();
      return {
        data: {
          ...(existing ?? { id, createdAt: now }),
          id,
          name: input.name,
          nameAr: input.nameAr ?? null,
          slug: input.slug,
          website: input.website || null,
          description: input.description ?? null,
          updatedAt: now,
        } as Brand,
        isMock: true,
      };
    }
    try {
      const updated = await this.prisma.get().brand.update({
        where: { id },
        data: {
          name: input.name,
          nameAr: input.nameAr ?? null,
          slug: input.slug,
          website: input.website || null,
          description: input.description ?? null,
        },
      });
      return { data: updated, isMock: false };
    } catch (error) {
      toDomainError(error);
    }
  }

  async remove(id: string): Promise<DbResult<{ id: string }>> {
    if (!process.env.DATABASE_URL) {
      return { data: { id }, isMock: true };
    }
    try {
      await this.prisma.get().brand.delete({ where: { id } });
      return { data: { id }, isMock: false };
    } catch (error) {
      toDomainError(error);
    }
  }
}
