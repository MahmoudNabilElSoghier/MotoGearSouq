import { z } from "zod";

export const cartItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(10000),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0, "Quantity must be at least 0").max(10000),
});

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
