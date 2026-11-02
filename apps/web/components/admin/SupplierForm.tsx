"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createSupplier, updateSupplier, ApiError } from "@motogearsouq/api-client";
import type { Supplier } from "@motogearsouq/api-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormBanner } from "./FormBanner";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

interface SupplierFormProps {
  mode?: "create" | "edit";
  initialData?: Supplier;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Form-level schema: mirrors the API createSupplierSchema but keeps
// leadTimeDays as a string (same approach as ProductForm — avoids the
// z.coerce "" → 0 pitfall; converted on submit).
const supplierFormSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  nameAr: z.string().optional(),
  nameEn: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  country: z.string().min(1, "Country is required"),
  leadTimeDays: z.string().regex(/^\d+$/, "Must be a whole number ≥ 0"),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

export function SupplierForm({ mode = "create", initialData, onSuccess, onCancel }: SupplierFormProps) {
  const t = useTranslations("admin.suppliers");
  const tCommon = useTranslations("admin.forms.common");
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof ApiError) {
      const errBody = err.body as { message?: string; issues?: Array<{ path?: string | string[]; message?: string }> };
      if (errBody?.issues && Array.isArray(errBody.issues)) {
        const details = errBody.issues
          .map((i) => `${Array.isArray(i.path) ? i.path.join(".") : i.path || ""}: ${i.message}`)
          .join("; ");
        return t("form.validationFailed", { details });
      }
      if (err.message) return err.message;
    }
    if (err instanceof Error) return err.message;
    return t("form.saveError");
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: initialData
      ? {
          code: initialData.code,
          name: initialData.name,
          nameAr: initialData.nameAr ?? "",
          nameEn: initialData.nameEn ?? "",
          phone: initialData.phone ?? "",
          email: initialData.email ?? "",
          country: initialData.country ?? "Taiwan",
          leadTimeDays: String(initialData.leadTimeDays ?? 7),
        }
      : {
          code: "",
          name: "",
          nameAr: "",
          nameEn: "",
          phone: "",
          email: "",
          country: "Taiwan",
          leadTimeDays: "7",
        },
  });

  const onSubmit = async (data: SupplierFormValues) => {
    setLoading(true);
    setBanner(null);
    try {
      const payload = {
        code: data.code,
        name: data.name,
        nameAr: data.nameAr || undefined,
        nameEn: data.nameEn || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        country: data.country,
        leadTimeDays: parseInt(data.leadTimeDays, 10),
      };

      if (mode === "edit" && initialData) {
        await updateSupplier(initialData.id, payload);
      } else {
        await createSupplier(payload);
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      setBanner({ type: "error", message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-xl">
      <h2 className="text-lg font-bold text-fg mb-4">
        {mode === "edit" ? t("form.titleEdit") : t("form.titleNew")}
      </h2>

      {banner && <FormBanner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t("form.code")}
            {...register("code")}
            error={errors.code?.message}
            placeholder="SUP-001"
            disabled={mode === "edit"}
          />
          <Input label={t("form.name")} {...register("name")} error={errors.name?.message} />
          <Input label={t("form.nameAr")} {...register("nameAr")} error={errors.nameAr?.message} />
          <Input label={t("form.nameEn")} {...register("nameEn")} error={errors.nameEn?.message} />
          <Input label={t("form.phone")} {...register("phone")} error={errors.phone?.message} dir="ltr" />
          <Input
            label={t("form.email")}
            {...register("email")}
            error={errors.email?.message}
            placeholder="sales@supplier.com"
            dir="ltr"
          />
          <Input label={t("form.country")} {...register("country")} error={errors.country?.message} placeholder="Taiwan" />
          <Input
            label={t("form.leadTimeDays")}
            {...register("leadTimeDays")}
            error={errors.leadTimeDays?.message}
            type="number"
            min={0}
            dir="ltr"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          {onCancel && (
            <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
              {tCommon("cancel")}
            </Button>
          )}
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin ms-2" />
                <span>{t("form.saving")}</span>
              </>
            ) : (
              <span>{t("form.save")}</span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
