"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  createStockAdjustment,
  getProducts,
  getBranches,
  ApiError,
} from "@motogearsouq/api-client";
import type { Branch, Product } from "@motogearsouq/shared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormBanner } from "./FormBanner";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

interface StockAdjustmentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

// String fields (ProductForm pattern) — converted on submit.
const adjustmentFormSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  branchId: z.string().min(1, "Branch is required"),
  quantityDelta: z
    .string()
    .regex(/^-?\d+$/, "Must be a whole number")
    .refine((v) => parseInt(v, 10) !== 0, "Delta cannot be zero"),
  notes: z.string().optional(),
});

type AdjustmentFormValues = z.infer<typeof adjustmentFormSchema>;

export function StockAdjustmentForm({ onSuccess, onCancel }: StockAdjustmentFormProps) {
  const t = useTranslations("admin.stockMovements");
  const tCommon = useTranslations("admin.forms.common");
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    Promise.all([
      getProducts({ pageSize: 100 }).catch(() => ({
        items: [],
        total: 0,
        page: 1,
        pageSize: 100,
        totalPages: 0,
      })),
      getBranches().catch(() => [] as Branch[]),
    ]).then(([p, b]) => {
      setProducts(p.items);
      setBranches(b);
    });
  }, []);

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
    reset,
    formState: { errors },
  } = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentFormSchema),
    defaultValues: { productId: "", branchId: "", quantityDelta: "", notes: "" },
  });

  const onSubmit = async (data: AdjustmentFormValues) => {
    setLoading(true);
    setBanner(null);
    try {
      await createStockAdjustment({
        productId: data.productId,
        branchId: data.branchId,
        quantityDelta: parseInt(data.quantityDelta, 10),
        notes: data.notes || undefined,
      });
      reset();
      if (onSuccess) onSuccess();
    } catch (err) {
      setBanner({ type: "error", message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  const selectClass =
    "w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-fg text-sm focus:border-accent focus:outline-none";

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-xl">
      <h2 className="text-lg font-bold text-fg mb-4">{t("form.titleNew")}</h2>

      {banner && <FormBanner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-fg mb-1">{t("form.product")}</label>
            <select {...register("productId")} className={selectClass}>
              <option value="">{t("form.selectProduct")}</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
            {errors.productId && <p className="text-red-500 text-sm mt-1">{errors.productId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-fg mb-1">{t("form.branch")}</label>
            <select {...register("branchId")} className={selectClass}>
              <option value="">{t("form.selectBranch")}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nameAr}
                </option>
              ))}
            </select>
            {errors.branchId && <p className="text-red-500 text-sm mt-1">{errors.branchId.message}</p>}
          </div>

          <Input
            label={t("form.quantityDelta")}
            type="number"
            dir="ltr"
            {...register("quantityDelta")}
            error={errors.quantityDelta?.message}
            placeholder={t("form.quantityDeltaHint")}
          />
          <Input label={t("form.notes")} {...register("notes")} error={errors.notes?.message} />
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
