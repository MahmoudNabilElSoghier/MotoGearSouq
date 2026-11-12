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

const slideFields = {
  titleAr: z.string().min(1, "العنوان بالعربية مطلوب"),
  titleEn: z.string().min(1, "العنوان بالإنجليزية مطلوب"),
  subtitleAr: z.string().optional().nullable(),
  subtitleEn: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  ctaPrimaryLabelAr: z.string().optional().nullable(),
  ctaPrimaryLabelEn: z.string().optional().nullable(),
  ctaPrimaryLink: z.string().optional().nullable(),
  ctaSecondaryLabelAr: z.string().optional().nullable(),
  ctaSecondaryLabelEn: z.string().optional().nullable(),
  ctaSecondaryLink: z.string().optional().nullable(),
  order: orderField,
  isActive: z.boolean().optional(),
};

// Full response shape (GET /api/landing/slides[/admin] items).
export const landingSlideSchema = z.object({
  id: z.string(),
  ...slideFields,
  order: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type LandingSlide = z.infer<typeof landingSlideSchema>;

// Create: titles required, everything else optional.
export const createLandingSlideSchema = z.object(slideFields);
export type CreateLandingSlideInput = z.infer<typeof createLandingSlideSchema>;

// Update: all fields optional (partial).
export const updateLandingSlideSchema = z
  .object(slideFields)
  .partial()
  .strict();
export type UpdateLandingSlideInput = z.infer<typeof updateLandingSlideSchema>;
