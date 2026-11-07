import { z } from "zod";

export const createEmployeeSchema = z.object({
  employeeNumber: z.string().min(1, "كود الموظف مطلوب"),
  nameAr: z.string().min(1, "الاسم بالعربية مطلوب"),
  nameEn: z.string().optional(),
  nationalId: z.string().optional(),
  phone: z.string().regex(/^01[0125][0-9]{8}$/, "رقم موبايل مصري غير صحيح"),
  email: z.string().email().optional().or(z.literal("")),
  role: z.string().min(1, "الوظيفة مطلوبة"),
  branchId: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = createEmployeeSchema.partial().strict();
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

export const createRoleSchema = z.object({
  key: z
    .string()
    .min(1, "مفتاح الدور مطلوب")
    .regex(
      /^[a-z][a-z0-9-]*$/,
      "المفتاح يجب أن يكون إنجليزيًا صغيرًا (a-z, 0-9, -)",
    ),
  nameAr: z.string().min(1, "اسم الدور بالعربية مطلوب"),
  nameEn: z.string().min(1, "اسم الدور بالإنجليزية مطلوب"),
  order: z.number().int().optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = z
  .object({
    nameAr: z.string().min(1, "اسم الدور بالعربية مطلوب").optional(),
    nameEn: z.string().min(1, "اسم الدور بالإنجليزية مطلوب").optional(),
    order: z.number().int().optional(),
  })
  .strict();

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
