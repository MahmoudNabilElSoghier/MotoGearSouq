import { z } from "zod";

// Admin status transition target. Stored values are lowercase (existing
// convention: schema defaults, mocks, admin statusStyles keys).
// Flow: pending → confirmed → shipped → delivered; any → cancelled.
export const updateOrderStatusSchema = z.object({
  status: z.enum(["confirmed", "shipped", "delivered", "cancelled"], {
    message: "status must be one of: confirmed, shipped, delivered, cancelled",
  }),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
