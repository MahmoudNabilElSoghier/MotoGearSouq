import { z } from "zod";

export const DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB

export const documentEntityTypeSchema = z.enum([
  "PRODUCT",
  "CATEGORY",
  "BRAND",
  "MODEL",
  "SUPPLIER",
  "BRANCH",
  "EMPLOYEE",
  "ORDER",
  "CUSTOMER",
  "LANDING_CARD",
  "LANDING_SLIDE",
]);

// Multipart fields arrive as strings; JSON callers may send booleans.
const boolish = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .optional()
  .transform((value) => value === true || value === "true");

export const uploadFieldsSchema = z.object({
  entityType: documentEntityTypeSchema,
  entityId: z.string().trim().min(1),
  makeImmutable: boolish,
});
export type UploadFields = z.infer<typeof uploadFieldsSchema>;

export const listQuerySchema = z.object({
  includeDeleted: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .optional()
    .transform((value) => value === true || value === "true"),
});
export type ListQuery = z.infer<typeof listQuerySchema>;

export const makeImmutableSchema = z.object({
  days: z.coerce.number().int().min(1).max(3650).optional().default(3650),
});
export type MakeImmutableBody = z.infer<typeof makeImmutableSchema>;
