import { z } from "zod";

export const orderItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(10000),
});

export const customerCheckoutSchema = z.object({
  nameAr: z.string().min(1, "Customer name is required").max(200),
  phone: z.string().regex(/^01[0125][0-9]{8}$/, "Phone must be a valid Egyptian mobile number"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().min(1, "Address is required").max(500),
  city: z.string().min(1, "City is required").max(100),
  governorate: z.string().min(1, "Governorate is required").max(100),
  notes: z.string().max(1000).optional(),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Order must contain at least one item"),
  customer: customerCheckoutSchema,
  paymentMethod: z.enum(["cod", "mock", "paymob", "fawry", "instapay"]).default("cod"),
  shippingMethod: z.enum(["standard", "express"]).default("standard"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type CustomerCheckoutInput = z.infer<typeof customerCheckoutSchema>;
