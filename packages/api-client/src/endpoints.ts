import type {
  Branch,
  Brand,
  BranchInventory,
  Employee,
  MachineModel,
  Order,
  PartCategory,
  Product,
  CreateBrandInput,
  UpdateBrandInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateProductInput,
  UpdateProductInput,
  CreateBranchInput,
  UpdateBranchInput,
  CreateEmployeeInput,
  UpdateEmployeeInput,
} from "@motogearsouq/shared";
import { apiGet, apiGetOrNull, apiSend, type ApiResponse } from "./client";

export interface ProductFilter {
  q?: string;
  brandSlug?: string;
  categorySlug?: string;
  page?: number;
  pageSize?: number;
  includeInactive?: boolean;
}

export interface ProductPage {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface OrderFilter {
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface OrderPage {
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const encode = encodeURIComponent;

// Queries
export const getBrands = (): Promise<Brand[]> => apiGet<Brand[]>("/brands");

export const getBrandBySlug = (slug: string): Promise<Brand | null> =>
  apiGetOrNull<Brand>(`/brands/${encode(slug)}`);

export const getPartCategories = (): Promise<PartCategory[]> =>
  apiGet<PartCategory[]>("/categories");

export const getCategoryTree = (): Promise<PartCategory[]> =>
  apiGet<PartCategory[]>("/categories/tree");

export const getCategoryBySlug = (slug: string): Promise<PartCategory | null> =>
  apiGetOrNull<PartCategory>(`/categories/${encode(slug)}`);

export const getModels = (brandSlug?: string): Promise<MachineModel[]> =>
  apiGet<MachineModel[]>(
    brandSlug ? `/models?brandSlug=${encode(brandSlug)}` : "/models",
  );

export const getModelBySlug = (
  brandSlug: string,
  modelSlug: string,
): Promise<MachineModel | null> =>
  apiGetOrNull<MachineModel>(`/models/${encode(brandSlug)}/${encode(modelSlug)}`);

export const getProducts = (filter: ProductFilter = {}): Promise<ProductPage> => {
  const params = new URLSearchParams();
  if (filter.q) params.set("q", filter.q);
  if (filter.brandSlug) params.set("brandSlug", filter.brandSlug);
  if (filter.categorySlug) params.set("categorySlug", filter.categorySlug);
  if (filter.page) params.set("page", String(filter.page));
  if (filter.pageSize) params.set("pageSize", String(filter.pageSize));
  if (filter.includeInactive) params.set("includeInactive", "true");
  const qs = params.toString();
  return apiGet<ProductPage>(`/products${qs ? `?${qs}` : ""}`);
};

export const getProductByCode = (code: string): Promise<Product | null> =>
  apiGetOrNull<Product>(`/products/code/${encode(code)}`);

export const getProductById = (id: string): Promise<Product | null> =>
  apiGetOrNull<Product>(`/products/${encode(id)}`);

export const getLowStockProducts = (): Promise<Product[]> =>
  apiGet<Product[]>("/products/low-stock");

export const getBranches = (): Promise<Branch[]> => apiGet<Branch[]>("/branches");

export const getBranchBySlug = (slug: string): Promise<Branch | null> =>
  apiGetOrNull<Branch>(`/branches/${encode(slug)}`);

export const getEmployees = (): Promise<Employee[]> =>
  apiGet<Employee[]>("/employees");

export const getInventory = (branchId?: string): Promise<BranchInventory[]> =>
  apiGet<BranchInventory[]>(
    branchId ? `/inventory?branchId=${encode(branchId)}` : "/inventory",
  );

export const getLowStockItems = (branchId?: string): Promise<BranchInventory[]> =>
  apiGet<BranchInventory[]>(
    branchId ? `/inventory/low-stock?branchId=${encode(branchId)}` : "/inventory/low-stock",
  );

export const getOrders = (filter: OrderFilter = {}): Promise<OrderPage> => {
  const params = new URLSearchParams();
  if (filter.status) params.set("status", filter.status);
  if (filter.page) params.set("page", String(filter.page));
  if (filter.pageSize) params.set("pageSize", String(filter.pageSize));
  const qs = params.toString();
  return apiGet<OrderPage>(`/orders${qs ? `?${qs}` : ""}`);
};

export const getOrderById = (id: string): Promise<Order | null> =>
  apiGetOrNull<Order>(`/orders/${encode(id)}`);

// Mutations
export const createBrand = (input: CreateBrandInput): Promise<ApiResponse<Brand>> =>
  apiSend<Brand>("POST", "/brands", input);

export const updateBrand = (id: string, input: UpdateBrandInput): Promise<ApiResponse<Brand>> =>
  apiSend<Brand>("PUT", `/brands/${encode(id)}`, input);

export const deleteBrand = (id: string): Promise<ApiResponse<{ ok: true }>> =>
  apiSend<{ ok: true }>("DELETE", `/brands/${encode(id)}`);

export const createCategory = (input: CreateCategoryInput): Promise<ApiResponse<PartCategory>> =>
  apiSend<PartCategory>("POST", "/categories", input);

export const updateCategory = (id: string, input: UpdateCategoryInput): Promise<ApiResponse<PartCategory>> =>
  apiSend<PartCategory>("PUT", `/categories/${encode(id)}`, input);

export const deleteCategory = (id: string): Promise<ApiResponse<{ ok: true }>> =>
  apiSend<{ ok: true }>("DELETE", `/categories/${encode(id)}`);

export const createProduct = (input: CreateProductInput): Promise<ApiResponse<Product>> =>
  apiSend<Product>("POST", "/products", input);

export const updateProduct = (id: string, input: UpdateProductInput): Promise<ApiResponse<Product>> =>
  apiSend<Product>("PUT", `/products/${encode(id)}`, input);

export const deleteProduct = (id: string): Promise<ApiResponse<{ ok: true }>> =>
  apiSend<{ ok: true }>("DELETE", `/products/${encode(id)}`);

export const createBranch = (input: CreateBranchInput): Promise<ApiResponse<Branch>> =>
  apiSend<Branch>("POST", "/branches", input);

export const updateBranch = (id: string, input: UpdateBranchInput): Promise<ApiResponse<Branch>> =>
  apiSend<Branch>("PATCH", `/branches/${encode(id)}`, input);

export const createEmployee = (input: CreateEmployeeInput): Promise<ApiResponse<Employee>> =>
  apiSend<Employee>("POST", "/employees", input);

export const updateEmployee = (id: string, input: UpdateEmployeeInput): Promise<ApiResponse<Employee>> =>
  apiSend<Employee>("PATCH", `/employees/${encode(id)}`, input);

// ---------- Orders: guest checkout + tracking (Sprint 1) ----------

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderCustomerInput {
  nameAr: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  governorate: string;
  notes?: string;
}

export interface CreateOrderPayload {
  items: CreateOrderItemInput[];
  customer: CreateOrderCustomerInput;
}

export interface CreatedOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
}

export interface TrackOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface TrackOrder {
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  estimatedDelivery: string | null;
  phone: string; // masked server-side (e.g. 010****5678)
  items: TrackOrderItem[];
}

export type OrderStatusUpdate = "confirmed" | "shipped" | "delivered" | "cancelled";

export const createOrder = (input: CreateOrderPayload): Promise<ApiResponse<CreatedOrder>> =>
  apiSend<CreatedOrder>("POST", "/orders", input);

export const trackOrder = (orderNumber: string): Promise<TrackOrder> =>
  apiGet<TrackOrder>(`/orders/track/${encode(orderNumber)}`);

export const updateOrderStatus = (id: string, status: OrderStatusUpdate): Promise<ApiResponse<Order>> =>
  apiSend<Order>("PATCH", `/orders/${encode(id)}/status`, { status });