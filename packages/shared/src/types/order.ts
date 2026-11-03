import type { Branch } from "./branch";
import type { Employee } from "./employee";
import type { Product } from "./product";
import type { Dateish } from "./common";

export interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  phone2: string | null;
  email: string | null;
  type: string;
  address: string | null;
  governorate: string | null;
  taxNumber: string | null;
  creditLimit: number | null;
  notes: string | null;
  blockedAt?: Dateish | null;
  blockedReason?: string | null;
  successfulDeliveries?: number;
  failedDeliveries?: number;
  createdAt: Dateish;
  orders?: Order[];
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string | null;
  customer?: Customer | null;
  branchId: string | null;
  branch?: Branch | null;
  employeeId: string | null;
  employee?: Employee | null;
  status: string;
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  paymentMethod: string | null;
  paymentStatus: string;
  notes: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingGovernorate?: string | null;
  shippingPhone?: string | null;
  codLimitAtPurchase?: number | null;
  riskScore?: number;
  riskLevel?: string;
  riskBreakdown?: unknown;
  ipAddress?: string | null;
  userAgentHash?: string | null;
  deletedAt: Dateish | null;
  createdAt: Dateish;
  updatedAt: Dateish;
  items?: OrderItem[];
  _count?: { items: number };
}

export interface OrderItem {
  id: string;
  orderId: string;
  order?: Order;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
  note: string | null;
}
