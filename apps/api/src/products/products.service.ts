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
  brandSlug?: string | string[];
  categorySlug?: string | string[];
  // new | used | spare-parts | accessories (arbitrary values yield an empty list)
  type?: string;
  // Vehicle Finder: only products compatible with this machine model.
  modelId?: string;
  featured?: boolean;
  priceMin?: number;
  priceMax?: number;
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

function toSlugs(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).filter(Boolean);
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
  const brandSlugs = toSlugs(filter.brandSlug);
  if (brandSlugs.length === 1) where.brand = { slug: brandSlugs[0] };
  else if (brandSlugs.length > 1) where.brand = { slug: { in: brandSlugs } };
  const categorySlugs = toSlugs(filter.categorySlug);
  if (categorySlugs.length === 1) where.partCategory = { slug: categorySlugs[0] };
  else if (categorySlugs.length > 1) where.partCategory = { slug: { in: categorySlugs } };
  if (filter.type) where.type = filter.type;
  if (filter.modelId) where.compatibilities = { some: { modelId: filter.modelId } };
  if (filter.featured) where.isFeatured = true;
  const price: Record<string, number> = {};
  if (filter.priceMin != null) price.gte = filter.priceMin;
  if (filter.priceMax != null) price.lte = filter.priceMax;
  if (Object.keys(price).length > 0) where.retailPrice = price;
  return where;
}

function matchesMock(product: Product, filter: ProductFilter): boolean {
  if (product.deletedAt) return false;
  if (!product.active && !filter.includeInactive) return false;
  const brandSlugs = toSlugs(filter.brandSlug);
  if (brandSlugs.length > 0) {
    const slug = product.brand?.slug;
    if (!slug || !brandSlugs.includes(slug)) return false;
  }
  const categorySlugs = toSlugs(filter.categorySlug);
  if (categorySlugs.length > 0) {
    const slug = product.partCategory?.slug;
    if (!slug || !categorySlugs.includes(slug)) return false;
  }
  if (filter.type && product.type !== filter.type) return false;
  if (
    filter.modelId &&
    !mockCompatibilities.some(
      (compat) => compat.productId === product.id && compat.modelId === filter.modelId,
    )
  )
    return false;
  if (filter.featured && !product.isFeatured) return false;
  if (filter.priceMin != null && (product.retailPrice == null || product.retailPrice < filter.priceMin))
    return false;
  if (filter.priceMax != null && (product.retailPrice == null || product.retailPrice > filter.priceMax))
    return false;
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

  async bulkImport(
    buffer: Buffer,
  ): Promise<{ successCount: number; errorCount: number; errors: Array<{ row: number; sku?: string; error: string }> }> {
    if (!process.env.DATABASE_URL) {
      return { successCount: 15, errorCount: 0, errors: [] };
    }

    const XLSX = await import("xlsx");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ row: number; sku?: string; error: string }> = [];

    const prisma = this.prisma.get();
    const defaultBranch = await prisma.branch.findFirst();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;
      const sku = String(row["SKU"] || "").trim();
      if (!sku) {
        errors.push({ row: rowNum, error: "Missing SKU" });
        errorCount++;
        continue;
      }

      try {
        const nameAr = String(row["Product Name AR"] || sku).trim();
        const nameEn = String(row["Product Name EN"] || "").trim() || null;
        const oemCode = String(row["OEM Code"] || "").trim() || null;
        const brandName = String(row["Brand"] || "").trim();
        const vehicleType = String(row["Vehicle Type"] || "دراجات نارية").trim();
        const modelName = String(row["Model"] || "").trim();
        const categoryName = String(row["Part Category"] || "").trim();
        const retailPrice = Number(row["Retail Price"] || 0);
        const wholesalePrice = Number(row["Wholesale Price"] || 0);
        const stockQty = Number(row["Stock Quantity"] || 0);
        const stockStatus = String(row["Stock Status"] || "").trim();
        const isComingSoon = stockStatus.includes("قريباً") || stockStatus.includes("Coming Soon");
        const imageUrl = String(row["Image URL"] || "").trim();

        let brandId: string | undefined;
        if (brandName) {
          const slug = slugifyText(brandName);
          const brand = await prisma.brand.upsert({
            where: { slug },
            update: { name: brandName },
            create: { name: brandName, slug, nameAr: brandName },
          });
          brandId = brand.id;
        }

        let partCategoryId: string | undefined;
        if (categoryName) {
          const slug = slugifyText(categoryName);
          const cat = await prisma.partCategory.upsert({
            where: { slug },
            update: { name: categoryName },
            create: { name: categoryName, slug, nameAr: categoryName },
          });
          partCategoryId = cat.id;
        }

        let modelId: string | undefined;
        if (modelName && brandId) {
          const slug = slugifyText(modelName);
          try {
            const machineModel = await prisma.machineModel.upsert({
              where: { brandId_nameEn: { brandId, nameEn: modelName } },
              update: { name: modelName, category: vehicleType },
              create: { brandId, name: modelName, nameEn: modelName, slug, category: vehicleType },
            });
            modelId = machineModel.id;
          } catch {
            const machineModel = await prisma.machineModel.upsert({
              where: { brandId_slug: { brandId, slug } },
              update: { name: modelName, category: vehicleType },
              create: { brandId, name: modelName, nameEn: modelName, slug, category: vehicleType },
            });
            modelId = machineModel.id;
          }
        }

        const product = await prisma.product.upsert({
          where: { code: sku },
          update: {
            name: nameAr,
            nameEn,
            oemCode,
            brandId,
            partCategoryId,
            retailPrice: isNaN(retailPrice) ? 0 : retailPrice,
            wholesalePrice: isNaN(wholesalePrice) ? 0 : wholesalePrice,
            isComingSoon,
            active: true,
            deletedAt: null,
          },
          create: {
            code: sku,
            name: nameAr,
            nameEn,
            oemCode,
            brandId,
            partCategoryId,
            retailPrice: isNaN(retailPrice) ? 0 : retailPrice,
            wholesalePrice: isNaN(wholesalePrice) ? 0 : wholesalePrice,
            isComingSoon,
            active: true,
          },
        });

        if (modelId) {
          await prisma.productCompatibility.upsert({
            where: { productId_modelId: { productId: product.id, modelId } },
            update: {},
            create: { productId: product.id, modelId },
          }).catch(() => {});
        }

        if (imageUrl) {
          await prisma.productImage.upsert({
            where: { id: `img-${product.id}` },
            update: { url: imageUrl },
            create: { id: `img-${product.id}`, productId: product.id, url: imageUrl, isPrimary: true },
          }).catch(() => {
            prisma.productImage.create({
              data: { productId: product.id, url: imageUrl, isPrimary: true },
            }).catch(() => {});
          });
        }

        if (defaultBranch && !isNaN(stockQty)) {
          await prisma.branchInventory.upsert({
            where: { branchId_productId: { branchId: defaultBranch.id, productId: product.id } },
            update: { quantity: stockQty },
            create: { branchId: defaultBranch.id, productId: product.id, quantity: stockQty },
          }).catch(() => {});
        }

        successCount++;
      } catch (err) {
        errorCount++;
        errors.push({ row: rowNum, sku, error: err instanceof Error ? err.message : String(err) });
      }
    }

    return { successCount, errorCount, errors };
  }
}

function slugifyText(str: string): string {
  return (
    str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || `item-${Math.random().toString(36).substring(2, 7)}`
  );
}
