import { z } from "zod";

const orderField = z
  .union([
    z
      .number()
      .refine((value) => Number.isInteger(value), { message: "أدخل عددًا صحيحًا" }),
    z
      .string()
      .refine((value) => value === "" || Number.isInteger(Number(value)), {
        message: "أدخل عددًا صحيحًا",
      }),
  ])
  .optional();

export const landingSectionSchema = z.object({
  slug: z
    .string()
    .min(1, "المعرّف مطلوب")
    .regex(/^[a-z0-9-]+$/, "المعرّف يجب أن يكون إنجليزيًا (a-z, 0, 9, -)"),
  titleAr: z.string().min(1, "العنوان بالعربية مطلوب"),
  titleEn: z.string().min(1, "العنوان بالإنجليزية مطلوب"),
  subtitleAr: z.string().optional().nullable(),
  subtitleEn: z.string().optional().nullable(),
  ctaLabelAr: z.string().min(1, "نص زر الإجراء بالعربية مطلوب"),
  ctaLabelEn: z.string().min(1, "نص زر الإجراء بالإنجليزية مطلوب"),
  ctaLink: z.string().min(1, "رابط زر الإجراء مطلوب"),
  order: orderField,
});

export type LandingSectionInput = z.infer<typeof landingSectionSchema>;
export const createLandingSectionSchema = landingSectionSchema;
export type CreateLandingSectionInput = z.infer<
  typeof createLandingSectionSchema
>;
export const updateLandingSectionSchema = landingSectionSchema
  .partial()
  .strict();
export type UpdateLandingSectionInput = z.infer<
  typeof updateLandingSectionSchema
>;

export const landingCardSchema = z.object({
  sectionId: z.string().min(1, "المعرّف الخاص بالقسم مطلوب"),
  titleAr: z.string().min(1, "العنوان بالعربية مطلوب"),
  titleEn: z.string().min(1, "العنوان بالإنجليزية مطلوب"),
  descAr: z.string().optional().nullable(),
  descEn: z.string().optional().nullable(),
  link: z.string().min(1, "الرابط مطلوب"),
  order: orderField,
});

export type LandingCardInput = z.infer<typeof landingCardSchema>;
export const createLandingCardSchema = landingCardSchema;
export type CreateLandingCardInput = z.infer<typeof createLandingCardSchema>;
export const updateLandingCardSchema = landingCardSchema.partial().strict();
export type UpdateLandingCardInput = z.infer<typeof updateLandingCardSchema>;
