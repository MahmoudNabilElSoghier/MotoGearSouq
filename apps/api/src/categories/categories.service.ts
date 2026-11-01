import { Inject, Injectable } from "@nestjs/common";
import { mockCategories } from "@motogearsouq/shared";
import type { PartCategory } from "@motogearsouq/shared";
import { withDb, type DbResult } from "../common/with-db";
import { toDomainError } from "../common/prisma-errors";
import { PrismaService } from "../prisma/prisma.service";

export interface CategoryBody {
  name: string;
  nameAr: string;
  slug: string;
  order: number;
  parentId: string | null;
}

@Injectable()
export class CategoriesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  getCategories(): Promise<DbResult<PartCategory[]>> {
    return withDb(
      this.prisma,
      (db) =>
        db.partCategory.findMany({
          orderBy: { order: "asc" },
          include: { _count: { select: { products: true } } },
        }),
      () => mockCategories,
    );
  }

  // Flattens the category list into a parent → children tree (roots first).
  // Works identically for DB results and mock data (port of web getCategoryTree).
  async getCategoryTree(): Promise<DbResult<PartCategory[]>> {
    const flat = await this.getCategories();
    const byId = new Map<string, PartCategory>();
    for (const category of flat.data) byId.set(category.id, { ...category, children: [] });
    const roots: PartCategory[] = [];
    for (const category of byId.values()) {
      const parent = category.parentId ? byId.get(category.parentId) : undefined;
      if (parent && parent.children) parent.children.push(category);
      else roots.push(category);
    }
    return { data: roots, isMock: flat.isMock };
  }

  getCategoryBySlug(slug: string): Promise<DbResult<PartCategory | null>> {
    return withDb(
      this.prisma,
      (db) =>
        db.partCategory.findUnique({
          where: { slug },
          include: { _count: { select: { products: true } } },
        }),
      () => mockCategories.find((item) => item.slug === slug) ?? null,
    );
  }

  async create(input: CategoryBody): Promise<DbResult<PartCategory>> {
    if (!process.env.DATABASE_URL) {
      return {
        data: {
          id: `tmp-${input.slug}`,
          name: input.name,
          nameAr: input.nameAr,
          slug: input.slug,
          parentId: input.parentId,
          order: input.order,
          createdAt: new Date().toISOString(),
        },
        isMock: true,
      };
    }
    try {
      const created = await this.prisma.get().partCategory.create({
        data: {
          name: input.name,
          nameAr: input.nameAr,
          slug: input.slug,
          parentId: input.parentId,
          order: input.order,
        },
      });
      return { data: created, isMock: false };
    } catch (error) {
      toDomainError(error);
    }
  }

  async update(id: string, input: CategoryBody): Promise<DbResult<PartCategory>> {
    if (!process.env.DATABASE_URL) {
      const existing = mockCategories.find((item) => item.id === id);
      return {
        data: {
          ...(existing ?? { id, createdAt: new Date().toISOString() }),
          id,
          name: input.name,
          nameAr: input.nameAr,
          slug: input.slug,
          parentId: input.parentId,
          order: input.order,
        } as PartCategory,
        isMock: true,
      };
    }
    try {
      const updated = await this.prisma.get().partCategory.update({
        where: { id },
        data: {
          name: input.name,
          nameAr: input.nameAr,
          slug: input.slug,
          parentId: input.parentId,
          order: input.order,
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
      await this.prisma.get().partCategory.delete({ where: { id } });
      return { data: { id }, isMock: false };
    } catch (error) {
      toDomainError(error);
    }
  }
}
