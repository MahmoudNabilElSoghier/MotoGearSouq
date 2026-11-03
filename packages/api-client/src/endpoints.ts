import type {
  Branch,
  Brand,
  BranchInventory,
  Cart,
  CartItem,
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
  CreateSupplierInput,
  UpdateSupplierInput,
  CreatePurchaseOrderInput,
  StockAdjustmentInput,
  UpdateCompanySettingsInput,
} from "@motogearsouq/shared";
import { apiGet, apiGetOrNull, apiRaw, apiSend, type ApiResponse } from "./client";

export interface ProductFilter {
  q?: string;
  brandSlug?: string | string[];
  categorySlug?: string | string[];
  type?: string;
  featured?: boolean;
  priceMin?: number;
  priceMax?: number;
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
  paymentStatus?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
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
  if (Array.isArray(filter.brandSlug)) {
    filter.brandSlug.forEach((slug) => params.append("brandSlug", slug));
  } else if (filter.brandSlug) {
    params.set("brandSlug", filter.brandSlug);
  }
  if (Array.isArray(filter.categorySlug)) {
    filter.categorySlug.forEach((slug) => params.append("categorySlug", slug));
  } else if (filter.categorySlug) {
    params.set("categorySlug", filter.categorySlug);
  }
  if (filter.type) params.set("type", filter.type);
  if (filter.featured) params.set("featured", "true");
  if (filter.priceMin != null) params.set("priceMin", String(filter.priceMin));
  if (filter.priceMax != null) params.set("priceMax", String(filter.priceMax));
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
  if (filter.paymentStatus) params.set("paymentStatus", filter.paymentStatus);
  if (filter.paymentMethod) params.set("paymentMethod", filter.paymentMethod);
  if (filter.dateFrom) params.set("dateFrom", filter.dateFrom);
  if (filter.dateTo) params.set("dateTo", filter.dateTo);
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

// ---------- Orders: authenticated checkout + tracking (Sprint 5C-1) ----------

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderPayload {
  items: CreateOrderItemInput[];
  // Shipping only — customer identity comes from the authenticated session (5C-1).
  shippingAddress?: string;
  shippingCity?: string;
  shippingGovernorate?: string;
  notes?: string;
  paymentMethod?: "cod" | "mock" | "paymob" | "fawry" | "instapay";
  shippingMethod?: "standard" | "express";
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

// ---------- Cart (authenticated) ----------

export interface CartRow {
  id: string;
  customerId: string;
  items: CartItem[];
}

export const getCart = (): Promise<CartRow> =>
  apiGet<CartRow>("/cart");

export const addToCart = (input: { productId: string; quantity: number }): Promise<ApiResponse<CartRow>> =>
  apiSend<CartRow>("POST", "/cart/items", input);

export const updateCartItem = (
  id: string,
  quantity: number,
): Promise<ApiResponse<CartRow | null>> =>
  apiSend<CartRow | null>("PATCH", `/cart/items/${encode(id)}`, { quantity });

export const removeCartItem = (id: string): Promise<ApiResponse<boolean>> =>
  apiSend<boolean>("DELETE", `/cart/items/${encode(id)}`);

// ---------- ERP: suppliers, purchase orders, stock movements (Sprint 2) ----------

export interface Supplier {
  id: string;
  code: string;
  name: string;
  nameAr: string | null;
  nameEn: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  country: string | null;
  leadTimeDays: number;
  note: string | null;
  createdAt: string;
  _count?: { products: number; purchaseOrders: number };
}

export type PurchaseStatus = "draft" | "ordered" | "shipped" | "received" | "cancelled";

export interface PurchaseOrderItemRow {
  id: string;
  productId: string;
  quantity: number;
  unitCost: number | string; // Prisma Decimal serializes to string
  lineTotal: number | string;
  product?: { id: string; code: string; name: string; unitOfMeasure: string };
}

export interface StockMovementRow {
  id: string;
  productId: string;
  branchId: string;
  type: string;
  quantityDelta: number;
  referenceId: string | null;
  purchaseOrderId: string | null;
  notes: string | null;
  createdAt: string;
  product?: { id: string; code: string; name: string; unitOfMeasure: string };
  branch?: { id: string; code?: string; nameAr: string };
  purchaseOrder?: { id: string; orderNumber: string } | null;
}

export interface PurchaseOrderListItem {
  id: string;
  orderNumber: string;
  supplierId: string;
  branchId: string;
  status: PurchaseStatus | string;
  subtotal: number | string;
  taxAmount: number | string;
  shippingCost: number | string;
  customsCost: number | string;
  total: number | string;
  notes: string | null;
  expectedDeliveryDate: string | null;
  receivedAt: string | null;
  createdAt: string;
  supplier: { id: string; code: string; name: string };
  branch: { id: string; code: string; nameAr: string };
  _count?: { items: number };
}

export interface PurchaseOrderPage {
  items: PurchaseOrderListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PurchaseOrderDetail extends Omit<PurchaseOrderListItem, "supplier" | "branch"> {
  supplier: Supplier;
  branch: { id: string; code: string; nameAr: string; nameEn?: string | null };
  items: PurchaseOrderItemRow[];
  stockMovements: StockMovementRow[];
}

export interface StockMovementPage {
  items: StockMovementRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Suppliers
export const getSuppliers = (): Promise<Supplier[]> => apiGet<Supplier[]>("/suppliers");

export const getSupplierById = (id: string): Promise<Supplier | null> =>
  apiGetOrNull<Supplier>(`/suppliers/${encode(id)}`);

export const createSupplier = (
  input: CreateSupplierInput,
): Promise<ApiResponse<Supplier>> => apiSend<Supplier>("POST", "/suppliers", input);

export const updateSupplier = (
  id: string,
  input: UpdateSupplierInput,
): Promise<ApiResponse<Supplier>> => apiSend<Supplier>("PATCH", `/suppliers/${encode(id)}`, input);

// Purchase orders
export interface PurchaseFilter {
  status?: string;
  supplierId?: string;
  branchId?: string;
  page?: number;
  pageSize?: number;
}

export const getPurchases = (filter: PurchaseFilter = {}): Promise<PurchaseOrderPage> => {
  const params = new URLSearchParams();
  if (filter.status) params.set("status", filter.status);
  if (filter.supplierId) params.set("supplierId", filter.supplierId);
  if (filter.branchId) params.set("branchId", filter.branchId);
  if (filter.page) params.set("page", String(filter.page));
  if (filter.pageSize) params.set("pageSize", String(filter.pageSize));
  const qs = params.toString();
  return apiRaw<PurchaseOrderPage>(`/purchases${qs ? `?${qs}` : ""}`);
};

export const getPurchaseById = (id: string): Promise<PurchaseOrderDetail | null> =>
  apiGetOrNull<PurchaseOrderDetail>(`/purchases/${encode(id)}`);

export const createPurchaseOrder = (
  input: CreatePurchaseOrderInput,
): Promise<ApiResponse<PurchaseOrderDetail>> =>
  apiSend<PurchaseOrderDetail>("POST", "/purchases", input);

export const updatePurchaseStatus = (
  id: string,
  status: PurchaseStatus,
): Promise<ApiResponse<PurchaseOrderDetail>> =>
  apiSend<PurchaseOrderDetail>("PATCH", `/purchases/${encode(id)}/status`, { status });

// Stock movements
export interface MovementFilter {
  productId?: string;
  branchId?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}

export const getStockMovements = (filter: MovementFilter = {}): Promise<StockMovementPage> => {
  const params = new URLSearchParams();
  if (filter.productId) params.set("productId", filter.productId);
  if (filter.branchId) params.set("branchId", filter.branchId);
  if (filter.type) params.set("type", filter.type);
  if (filter.page) params.set("page", String(filter.page));
  if (filter.pageSize) params.set("pageSize", String(filter.pageSize));
  const qs = params.toString();
  return apiRaw<StockMovementPage>(`/stock-movements${qs ? `?${qs}` : ""}`);
};

export const createStockAdjustment = (
  input: StockAdjustmentInput,
): Promise<ApiResponse<{ movement: StockMovementRow; inventory: { id: string; quantity: number } }>> =>
  apiSend<{ movement: StockMovementRow; inventory: { id: string; quantity: number } }>(
    "POST",
    "/stock-movements",
    input,
  );

// ---------- Analytics & Financial Intelligence (Sprint 3) ----------

export interface CompanySettings {
  id: string;
  monthlyRent: number;
  monthlySalaries: number;
  monthlyUtilities: number;
  monthlyMarketing: number;
  monthlyOther: number;
  vatRate: number;
  updatedAt: string;
  createdAt: string;
}

export interface AnalyticsDashboard {
  period: string;
  periodDays: number;
  from: string;
  to: string;
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    grossProfit: number;
    grossMarginPercent: number;
    newCustomers: number;
    cancelledOrders: number;
    returnedAmount: number;
  };
  topProducts: Array<{
    productId: string;
    code: string;
    name: string;
    unitsSold: number;
    revenue: number;
    cost: number;
    profit: number;
    marginPercent: number;
  }>;
  salesByBranch: Array<{
    branchId: string;
    branchName: string;
    orderCount: number;
    revenue: number;
  }>;
}

export interface BreakEvenAnalysis {
  period: string;
  days: number;
  fixedCosts: {
    monthlyRent: number;
    monthlySalaries: number;
    monthlyUtilities: number;
    monthlyMarketing: number;
    monthlyOther: number;
    totalMonthly: number;
    periodFixedCosts: number;
  };
  variableCosts: {
    totalRevenue: number;
    totalCogs: number;
    variableCostRatio: number;
  };
  contribution: {
    contributionMargin: number;
    contributionMarginRatio: number;
    breakEvenRevenue: number;
    currentRevenue: number;
    marginOfSafety: number;
    breakEvenUnitsEstimate: number;
    status: "below" | "above" | "at";
  };
}

export interface AbcProductItem {
  productId: string;
  code: string;
  name: string;
  revenue: number;
  unitsSold: number;
  revenuePercent: number;
  cumulativePercent: number;
  class: "A" | "B" | "C";
}

export interface AbcAnalysis {
  period: string;
  totalRevenue: number;
  summary: {
    classA: { count: number; revenuePercent: number };
    classB: { count: number; revenuePercent: number };
    classC: { count: number; revenuePercent: number };
  };
  products: AbcProductItem[];
}

export interface DeadStockProduct {
  productId: string;
  code: string;
  name: string;
  currentStock: number;
  costPrice: number;
  capitalTied: number;
  lastSoldAt: string | null;
  daysSinceLastSale: number | null;
}

export interface DeadStockResponse {
  thresholdDays: number;
  totalProductsChecked: number;
  deadProductsCount: number;
  totalCapitalTied: number;
  products: DeadStockProduct[];
}

export interface StockValuationResponse {
  totalValue: number;
  totalRetailValue: number;
  potentialProfit: number;
  byBranch: Array<{
    branchId: string;
    branchCode: string;
    branchNameAr: string;
    branchNameEn?: string | null;
    costValue: number;
    retailValue: number;
  }>;
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    costValue: number;
    retailValue: number;
  }>;
}

export interface ProductProfitabilityItem {
  productId: string;
  code: string;
  name: string;
  unitsSold: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number;
}

export const getCompanySettings = (): Promise<CompanySettings> =>
  apiGet<CompanySettings>("/analytics/settings");

export const updateCompanySettings = (
  input: UpdateCompanySettingsInput,
): Promise<ApiResponse<CompanySettings>> =>
  apiSend<CompanySettings>("PATCH", "/analytics/settings", input);

export const getAnalyticsDashboard = (period = "30d"): Promise<AnalyticsDashboard> =>
  apiGet<AnalyticsDashboard>(`/analytics/dashboard?period=${encode(period)}`);

export const getBreakEvenAnalysis = (period = "30d"): Promise<BreakEvenAnalysis> =>
  apiGet<BreakEvenAnalysis>(`/analytics/break-even?period=${encode(period)}`);

export const getAbcAnalysis = (period = "90d"): Promise<AbcAnalysis> =>
  apiGet<AbcAnalysis>(`/analytics/abc-analysis?period=${encode(period)}`);

export const getDeadStock = (days = 90): Promise<DeadStockResponse> =>
  apiGet<DeadStockResponse>(`/analytics/dead-stock?days=${days}`);

export const getStockValuation = (): Promise<StockValuationResponse> =>
  apiGet<StockValuationResponse>("/analytics/stock-valuation");

export const getProductProfitability = (
  period = "90d",
  limit = 20,
): Promise<ProductProfitabilityItem[]> =>
  apiGet<ProductProfitabilityItem[]>(
    `/analytics/product-profitability?period=${encode(period)}&limit=${limit}`,
  );

// ---------- Shipping & Payments (Phase 3) ----------

export interface ShippingQuoteInput {
  orderValue: number;
  governorate: string;
  city?: string | null;
  method: "standard" | "express" | "cod";
}

export interface ShippingQuoteResult {
  fee: number;
  isFree: boolean;
  reason: string;
}

export const getShippingQuote = (input: ShippingQuoteInput): Promise<ShippingQuoteResult> => {
  const params = new URLSearchParams();
  params.set("orderValue", String(input.orderValue));
  params.set("governorate", input.governorate);
  if (input.city) params.set("city", input.city);
  params.set("method", input.method);
  return apiGet<ShippingQuoteResult>(`/shipping/quote?${params.toString()}`);
};

export interface InitiatePaymentInput {
  orderNumber: string;
  method: string;
  returnUrl?: string;
}

export interface InitiatePaymentResult {
  success: boolean;
  redirectUrl?: string;
  instructions?: string;
  providerRef?: string;
}

export const initiatePayment = (input: InitiatePaymentInput): Promise<InitiatePaymentResult> =>
  apiRaw<InitiatePaymentResult>("/payments/initiate", {
    method: "POST",
    body: JSON.stringify(input),
  });

export interface MockCompletePaymentInput {
  providerRef: string;
  success: boolean;
}

export interface MockCompletePaymentResult {
  success: boolean;
  orderNumber: string;
  redirectUrl: string;
}

export const completeMockPayment = (input: MockCompletePaymentInput): Promise<MockCompletePaymentResult> =>
  apiRaw<MockCompletePaymentResult>("/payments/mock/complete", {
    method: "POST",
    body: JSON.stringify(input),
  });

export interface PaymentTransactionItem {
  id: string;
  orderId: string;
  provider: string;
  providerRef: string | null;
  amount: number;
  currency: string;
  status: string;
  method: string;
  rawPayload?: unknown;
  createdAt: string;
  order?: { orderNumber: string };
}

export interface PaymentTransactionPage {
  items: PaymentTransactionItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaymentTransactionFilter {
  orderId?: string;
  provider?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export const getPaymentTransactions = (
  filter: PaymentTransactionFilter = {},
): Promise<PaymentTransactionPage> => {
  const params = new URLSearchParams();
  if (filter.orderId) params.set("orderId", filter.orderId);
  if (filter.provider) params.set("provider", filter.provider);
  if (filter.status) params.set("status", filter.status);
  if (filter.page) params.set("page", String(filter.page));
  if (filter.pageSize) params.set("pageSize", String(filter.pageSize));
  const qs = params.toString();
  return apiRaw<PaymentTransactionPage>(`/payments/transactions${qs ? `?${qs}` : ""}`);
};

export const markOrderPaid = (orderId: string): Promise<ApiResponse<Order>> =>
  apiSend<Order>("POST", `/payments/orders/${encode(orderId)}/mark-paid`);

export const refundOrder = (orderId: string, reason?: string): Promise<ApiResponse<Order>> =>
  apiSend<Order>("POST", `/payments/orders/${encode(orderId)}/refund`, { reason });

// ---------- Admin: customers & wholesale approvals (Sprint 5B-3) ----------

export interface AdminCustomerItem {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  customerType: string;
  approvalStatus: string;
  businessName: string | null;
  taxNumber: string | null;
  commercialRegister: string | null;
  createdAt: string;
  blockedAt: string | null;
  blockedReason: string | null;
  successfulDeliveries: number;
  failedDeliveries: number;
  _count?: { orders: number };
}

export interface AdminCustomerPage {
  items: AdminCustomerItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminCustomerFilter {
  customerType?: string;
  approvalStatus?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export const getAdminCustomers = (params: AdminCustomerFilter = {}): Promise<AdminCustomerPage> => {
  const qs = new URLSearchParams();
  if (params.customerType) qs.set("customerType", params.customerType);
  if (params.approvalStatus) qs.set("approvalStatus", params.approvalStatus);
  if (params.search) qs.set("search", params.search);
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  const query = qs.toString();
  return apiGet<AdminCustomerPage>(`/admin/customers${query ? `?${query}` : ""}`);
};

export const getAdminCustomersPending = (params: { page?: number; pageSize?: number } = {}): Promise<AdminCustomerPage> =>
  getAdminCustomers({ ...params, approvalStatus: "pending" });

export const getPendingCustomersCount = (): Promise<{ count: number }> =>
  apiGet<{ count: number }>("/admin/customers/pending/count");

export const approveCustomer = (id: string): Promise<ApiResponse<AdminCustomerItem>> =>
  apiSend<AdminCustomerItem>("PATCH", `/admin/customers/${encode(id)}/approve`);

export const rejectCustomer = (id: string, reason: string): Promise<ApiResponse<AdminCustomerItem>> =>
  apiSend<AdminCustomerItem>("PATCH", `/admin/customers/${encode(id)}/reject`, { reason });

// ---------- Anti-fraud: customer blocking (Sprint 5C-2) ----------

export const blockCustomer = (id: string, reason: string): Promise<ApiResponse<AdminCustomerItem>> =>
  apiSend<AdminCustomerItem>("PATCH", `/admin/customers/${encode(id)}/block`, { reason });

export const unblockCustomer = (id: string): Promise<ApiResponse<AdminCustomerItem>> =>
  apiSend<AdminCustomerItem>("PATCH", `/admin/customers/${encode(id)}/unblock`);



