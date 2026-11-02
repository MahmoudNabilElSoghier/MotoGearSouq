import type { Brand } from "./brand";
import type { MachineModel } from "./model";
import type { BranchInventory } from "./branch";
import type { OrderItem } from "./order";
import type { Dateish } from "./common";

export interface PartCategory {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string;
  parentId: string | null;
  parent?: PartCategory | null;
  children?: PartCategory[];
  order: number;
  createdAt: Dateish;
  products?: Product[];
  _count?: { products: number };
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  note: string | null;
  createdAt: Dateish;
  products?: Product[];
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  alt: string | null;
  order: number;
  isPrimary: boolean;
}

export interface ProductCompatibility {
  id: string;
  productId: string;
  product?: Product;
  modelId: string;
  model?: MachineModel;
  note: string | null;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  oemCode: string | null;
  partCategoryId: string | null;
  partCategory?: PartCategory | null;
  brandId: string | null;
  brand?: Brand | null;
  supplierId: string | null;
  supplier?: Supplier | null;
  costPrice: number | null;
  wholesalePrice: number | null;
  retailPrice: number | null;
  vipPrice: number | null;
  taxRate: number;
  unitOfMeasure: string;
  reorderLevel: number;
  tags: string[];
  type: string;
  isFeatured: boolean;
  onSale: boolean;
  discountPercent: number | null;
  active: boolean;
  deletedAt: Dateish | null;
  createdAt: Dateish;
  updatedAt: Dateish;
  images?: ProductImage[];
  compatibilities?: ProductCompatibility[];
  inventory?: BranchInventory[];
  orderItems?: OrderItem[];
}
