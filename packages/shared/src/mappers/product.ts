import type { Prisma } from "@prisma/client";
import type { MachineModel } from "../types/model";
import type { Product, ProductCompatibility } from "../types/product";
import { fromPrismaBranchInventory, type BranchInventoryRow } from "./branch";
import { toNumber, toNumberOrZero } from "./decimal";

type ProductScalars = Prisma.ProductGetPayload<{}>;

// Row = Prisma scalars with Decimal money fields widened to unknown (Decimal
// is not assignable to number) plus the relations this code actually includes,
// typed as rows so nested Decimal/JsonValue values get mapped too.
export type ProductRow = Omit<
  ProductScalars,
  "costPrice" | "wholesalePrice" | "retailPrice" | "vipPrice" | "taxRate" | "discountPercent"
> & {
  costPrice: unknown;
  wholesalePrice: unknown;
  retailPrice: unknown;
  vipPrice: unknown;
  taxRate: unknown;
  discountPercent: unknown;
  inventory?: BranchInventoryRow[];
  compatibilities?: ProductCompatibilityRow[];
};

type CompatibilityScalars = Prisma.ProductCompatibilityGetPayload<{}>;

export type ProductCompatibilityRow = CompatibilityScalars & {
  product?: ProductRow;
  model?: MachineModel;
};

export function fromPrismaProduct(row: ProductRow): Product {
  return {
    ...row,
    costPrice: toNumber(row.costPrice),
    wholesalePrice: toNumber(row.wholesalePrice),
    retailPrice: toNumber(row.retailPrice),
    vipPrice: toNumber(row.vipPrice),
    taxRate: toNumberOrZero(row.taxRate),
    discountPercent: toNumber(row.discountPercent),
    inventory: row.inventory?.map(fromPrismaBranchInventory),
    compatibilities: row.compatibilities?.map(fromPrismaCompatibility),
  };
}

export function fromPrismaCompatibility(
  row: ProductCompatibilityRow,
): ProductCompatibility {
  return {
    ...row,
    product: row.product ? fromPrismaProduct(row.product) : undefined,
  };
}
