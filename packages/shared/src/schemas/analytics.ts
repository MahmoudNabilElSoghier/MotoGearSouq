import { z } from "zod";

// Sprint 3 — CompanySettings (fixed costs for break-even analysis).
// All fields optional: PATCH updates only what is sent.
export const updateCompanySettingsSchema = z.object({
  monthlyRent: z.number().min(0).optional(),
  monthlySalaries: z.number().min(0).optional(),
  monthlyUtilities: z.number().min(0).optional(),
  monthlyMarketing: z.number().min(0).optional(),
  monthlyOther: z.number().min(0).optional(),
  vatRate: z.number().min(0).max(1).optional(),
});

export type UpdateCompanySettingsInput = z.infer<typeof updateCompanySettingsSchema>;
