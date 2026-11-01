import { Inject, Injectable } from "@nestjs/common";
import {
  fromPrismaProduct,
  mockCompatibilities,
  mockModels,
  mockProducts,
  totalStock,
} from "@motogearsouq/shared";
import type { Product } from "@motogearsouq/shared";
import { withDb, type DbResult } from "../common/with-db";
import { toDomainError } from "../common/prisma-errors";
import { PrismaService } from "../prisma/prisma.service";

export interface ProductFilter {
  q?: string;
  brandSlug?: string;
  categorySlug?: string;
  page?: number;
  pageSize?: number;
  // Admin lists need inactive rows too; the public catalog keeps active-only.
  includeInactive?: boolean;
}

export interface ProductPage {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductBody {
  code: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  oemCode: string | null;
  brandId: string | null;
  partCategoryId: string | null;
  costPrice: number | null;
  wholesalePrice: number | null;
  retailPrice: number | null;
  vipPrice: number | null;
  taxRate: number;
  unitOfMeasure: string;
  reorderLevel: number;
  tags: string[];
  active: boolean;
}

function buildWhere(filter: ProductFilter): Record<string, unknown> {
  const where: Record<string, unknown> = { deletedAt: null };
  if (!filter.includeInactive) where.active = true;
  if (filter.q) {
    const q = filter.q;
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { code: { contains: q, mode: "insensitive" } },
      { oemCode: { contains: q, mode: "insensitive" } },
    ];
  }
  if (filter.brandSlug) where.brand = { slug: filter.brandSlug };
  if (filter.categorySlug) where.partCategory = { slug: filter.categorySlug };
  return where;
}

function matchesMock(product: Product, filter: ProductFilter): boolean {
  if (product.deletedAt) return false;
  if (!product.active && !filter.includeInactive) return false;
  if (filter.brandSlug && product.brand?.slug !== filter.brandSlug) return false;
  if (filter.categorySlug && product.partCategory?.slug !== filter.categorySlug) return false;
  if (filter.q) {
    const needle = filter.q.toLowerCase();
    const haystack = `${product.name} ${product.code} ${product.oemCode ?? ""}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

@Injectable()
export class ProductsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getProducts(filter: ProductFilter = {}): Promise<DbResult<ProductPage>> {
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filter.pageSize ?? 20));
    const where = buildWhere(filter);
    const data = await withDb<{ items: Product[]; total: number }>(
      this.prisma,
      async (db) => {
        const [items, total] = await Promise.all([
          db.product.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { name: "asc" },
            include: { brand: true, partCategory: true, inventory: true, images: true },
          }),
          db.product.count({ where }),
        ]);
        return { items: items.map(fromPrismaProduct), total };
      },
      () => {
        const filtered = mockProducts.filter((product) => matchesMock(product, filter));
        const start = (page - 1) * pageSize;
        return { items: filtered.slice(start, start + pageSize), total: filtered.length };
      },
    );
    return {
      data: {
        items: data.data.items,
        total: data.data.total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(data.data.total / pageSize)),
      },
      isMock: data.isMock,
    };
  }

  // Public catalog detail lookup — the URL param is the product code (part number).
  getProductByCode(code: string): Promise<DbResult<Product | null>> {
    return withDb(
      this.prisma,
      async (db) => {
        const product = await db.product.findFirst({
          where: { code, deletedAt: null },
          include: {
            brand: true,
            partCategory: true,
            supplier: true,
            images: { orderBy: { order: "asc" } },
            compatibilities: { include: { model: { include: { brand: true } } } },
            inventory: { include: { branch: true } },
          },
        });
        return product ? fromPrismaProduct(product) : null;
      },
      () => {
        const product = mockProducts.find(
          (item) => item.code === code && item.active && !item.deletedAt,
        );
        if (!product) return null;
        return {
          ...product,
          compatibilities: mockCompatibilities
            .filter((compat) => compat.productId === product.id)
            .map((compat) => ({
              ...compat,
              model: mockModels.find((model) => model.id === compat.modelId),
            })),
        };
      },
    );
  }

  // Admin edit lookup — includes inactive/soft-deleted rows so data stays editable.
  getProductById(id: string): Promise<DbResult<Product | null>> {
    return withDb(
      this.prisma,
      async (db) => {
        const product = await db.product.findUnique({
          where: { id },
          include: {
            brand: true,
            partCategory: true,
            supplier: true,
            images: { orderBy: { order: "asc" } },
          },
        });
        return product ? fromPrismaProduct(product) : null;
      },
      () => mockProducts.find((item) => item.id === id) ?? null,
    );
  }

  getLowStockProducts(): Promise<DbResult<Product[]>> {
    return withDb(
      this.prisma,
      async (db) => {
        const products = await db.product.findMany({
          where: { deletedAt: null, active: true },
          include: { inventory: true },
        });
        return products
          .map(fromPrismaProduct)
          .filter((product: Product) => totalStock(product) <= product.reorderLevel);
      },
      () =>
        mockProducts.filter(
          (product) =>
            product.active && !product.deletedAt && totalStock(product) <= product.reorderLevel,
        ),
    );
  }

  async create(input: ProductBody): Promise<DbResult<Product>> {
    if (!process.env.DATABASE_URL) {
      const now = new Date().toISOString();
      return {
        data: {
          ...input,
          id: `tmp-${input.code.toLowerCase()}`,
          taxRate: input.taxRate,
          deletedAt: null,
          createdAt: now,
          updatedAt: now,
        } as Product,
        isMock: true,
      };
    }
    try {
      const created = await this.prisma.get().product.create({ data: input });
      return { data: fromPrismaProduct(created), isMock: false };
    } catch (error) {
      toDomainError(error);
    }
  }

  async update(id: string, input: ProductBody): Promise<DbResult<Product>> {
    if (!process.env.DATABASE_URL) {
      const existing = mockProducts.find((item) => item.id === id);
      const now = new Date().toISOString();
      return {
        data: {
          ...(existing ?? { createdAt: now }),
          ...input,
          id,
          updatedAt: now,
        } as Product,
        isMock: true,
      };
    }
    try {
      const updated = await this.prisma.get().product.update({ where: { id }, data: input });
      return { data: fromPrismaProduct(updated), isMock: false };
    } catch (error) {
      toDomainError(error);
    }
  }

  async remove(id: string): Promise<DbResult<{ id: string }>> {
    if (!process.env.DATABASE_URL) {
      return { data: { id }, isMock: true };
    }
    try {
      // Soft delete: the schema keeps deletedAt for audit/restore.
      await this.prisma.get().product.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return { data: { id }, isMock: false };
    } catch (error) {
      toDomainError(error);
    }
  }
}
