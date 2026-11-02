import { z } from "zod";

export const purchaseItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitCost: z.number().min(0, "Unit cost must be >= 0"),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  branchId: z.string().min(1, "Branch is required"),
  shippingCost: z.number().min(0).default(0),
  customsCost: z.number().min(0).default(0),
  notes: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
});

export const updatePurchaseStatusSchema = z.object({
  status: z.enum(["draft", "ordered", "shipped", "received", "cancelled"]),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseStatusInput = z.infer<typeof updatePurchaseStatusSchema>;
