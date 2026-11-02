import { z } from "zod";

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1),
  branchId: z.string().min(1),
  quantityDelta: z.number().int(),
  notes: z.string().optional(),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
