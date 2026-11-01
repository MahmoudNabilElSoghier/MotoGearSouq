import { z } from "zod";

// Guest checkout payload for POST /api/orders (no auth, cash on delivery).
// API accepts nameAr (Arabic-first UI) but DB field is name
// (existing convention across shared types, mappers, admin UI).

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "productId is required"),
        quantity: z.number().int().min(1, "quantity must be at least 1").max(10000),
      }),
    )
    .min(1, "Order must contain at least one item"),
  customer: z.object({
    nameAr: z.string().min(1, "Customer name is required").max(200),
    phone: z
      .string()
      .regex(/^01[0125][0-9]{8}$/, "Phone must be a valid Egyptian mobile number"),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().min(1, "Address is required").max(500),
    city: z.string().min(1, "City is required").max(100),
    governorate: z.string().min(1, "Governorate is required").max(100),
    notes: z.string().max(1000).optional(),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
