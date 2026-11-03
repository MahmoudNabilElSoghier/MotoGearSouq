import { z } from "zod";

export const orderItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(10000),
});

// Shipping details only — customer identity (name/phone/email) comes from the
// authenticated JWT (5C-1: no guest checkout, never trust body identity).
export const orderShippingSchema = z.object({
  shippingAddress: z.string().min(1, "Address is required").max(500).optional(),
  shippingCity: z.string().min(1, "City is required").max(100).optional(),
  shippingGovernorate: z.string().min(1, "Governorate is required").max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Order must contain at least one item"),
  ...orderShippingSchema.shape,
  paymentMethod: z.enum(["cod", "mock", "paymob", "fawry", "instapay"]).default("cod"),
  shippingMethod: z.enum(["standard", "express"]).default("standard"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type OrderShippingInput = z.infer<typeof orderShippingSchema>;
