import { z } from "zod";
import type { OpeningHours } from "../types/branch";

export const openingHoursSchema = z.record(z.string(), z.string());

// Prisma Json columns arrive untyped (object | string | number | ...); an
// invalid shape degrades to null instead of throwing so one bad row cannot
// break an entire list response.
export function parseOpeningHours(value: unknown): OpeningHours | null {
  if (value == null) return null;
  const parsed = openingHoursSchema.safeParse(value);
  if (parsed.success) return parsed.data;
  console.warn("[@motogearsouq/shared] Invalid Branch.openingHours JSON, coercing to null");
  return null;
}

export const createBranchSchema = z.object({
  code: z.string().min(1, "كود الفرع مطلوب"),
  slug: z
    .string()
    .min(1, "المعرّف مطلوب")
    .regex(/^[a-z0-9-]+$/, "المعرّف يجب أن يكون إنجليزيًا (a-z, 0, 9, -)"),
  nameAr: z.string().min(1, "الاسم بالعربية مطلوب"),
  nameEn: z.string().optional(),
  type: z.string().min(1, "نوع الفرع مطلوب"),
  phone: z.string().regex(/^01[0125][0-9]{8}$/, "رقم موبايل مصري غير صحيح").optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  address: z.string().min(1, "العنوان مطلوب"),
  addressEn: z.string().optional(),
  governorate: z.string().min(1, "المحافظة مطلوبة"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  openingHours: z.record(z.string(), z.string()).optional(),
  managerId: z.string().optional().nullable(),
  displayOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;

export const updateBranchSchema = createBranchSchema.partial().strict();
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
