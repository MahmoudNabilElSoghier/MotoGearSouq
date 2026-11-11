"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  createPurchaseOrder,
  getSuppliers,
  getBranches,
  getProducts,
  ApiError,
} from "@motogearsouq/api-client";
import type { Supplier } from "@motogearsouq/api-client";
import type { Branch, Product } from "@motogearsouq/shared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormBanner } from "./FormBanner";
import { useTranslations } from "next-intl";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface PurchaseOrderFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

// String-tolerant fields (same approach as ProductForm) — converted on submit.
type PurchaseMessages = {
  invalidAmount: string;
  supplierRequired: string;
  branchRequired: string;
  productRequired: string;
  quantityMinOne: string;
  itemsRequired: string;
};

function createPurchaseFormSchema(m: PurchaseMessages) {
  const amountStr = z.string().regex(/^\d+(\.\d{1,2})?$/, m.invalidAmount);
  return z.object({
    supplierId: z.string().min(1, m.supplierRequired),
    branchId: z.string().min(1, m.branchRequired),
    shippingCost: amountStr,
    customsCost: amountStr,
    notes: z.string().optional(),
    expectedDeliveryDate: z.string().optional(),
    items: z
      .array(
        z.object({
          productId: z.string().min(1, m.productRequired),
          quantity: z.string().regex(/^[1-9]\d*$/, m.quantityMinOne),
          unitCost: amountStr,
        }),
      )
      .min(1, m.itemsRequired),
  });
}

type PurchaseFormValues = z.infer<ReturnType<typeof createPurchaseFormSchema>>;

export function PurchaseOrderForm({ onSuccess, onCancel }: PurchaseOrderFormProps) {
  const t = useTranslations("admin.purchases");
  const tCommon = useTranslations("admin.forms.common");
  const tVal = useTranslations("admin.forms.validation");
  const purchaseFormSchema = useMemo(
    () =>
      createPurchaseFormSchema({
        invalidAmount: tVal("invalidAmount"),
        supplierRequired: tVal("supplierRequired"),
        branchRequired: tVal("branchRequired"),
        productRequired: tVal("productRequired"),
        quantityMinOne: tVal("quantityMinOne"),
        itemsRequired: t("form.itemsRequired"),
      }),
    [t, tVal],
  );
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    Promise.all([
      getSuppliers().catch(() => [] as Supplier[]),
      getBranches().catch(() => [] as Branch[]),
      getProducts({ pageSize: 100 }).catch(() => ({
        items: [],
        total: 0,
        page: 1,
        pageSize: 100,
        totalPages: 0,
      })),
    ]).then(([s, b, p]) => {
      setSuppliers(s);
      setBranches(b);
      setProducts(p.items);
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
    control,
    formState: { errors },
  } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      supplierId: "",
      branchId: "",
      shippingCost: "0",
      customsCost: "0",
      notes: "",
      expectedDeliveryDate: "",
      items: [{ productId: "", quantity: "1", unitCost: "0" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const onSubmit = async (data: PurchaseFormValues) => {
    setLoading(true);
    setBanner(null);
    try {
      await createPurchaseOrder({
        supplierId: data.supplierId,
        branchId: data.branchId,
        shippingCost: Number(data.shippingCost),
        customsCost: Number(data.customsCost),
        notes: data.notes || undefined,
        expectedDeliveryDate: data.expectedDeliveryDate || undefined,
        items: data.items.map((item) => ({
          productId: item.productId,
          quantity: parseInt(item.quantity, 10),
          unitCost: Number(item.unitCost),
        })),
      });
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
            <label className="block text-sm font-medium text-fg mb-1">{t("form.supplier")}</label>
            <select {...register("supplierId")} className={selectClass}>
              <option value="">{t("form.selectSupplier")}</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nameAr || s.name} ({s.code})
                </option>
              ))}
            </select>
            {errors.supplierId && <p className="text-red-500 text-sm mt-1">{errors.supplierId.message}</p>}
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
            label={t("form.shippingCost")}
            type="number"
            min={0}
            step="0.01"
            dir="ltr"
            {...register("shippingCost")}
            error={errors.shippingCost?.message}
          />
          <Input
            label={t("form.customsCost")}
            type="number"
            min={0}
            step="0.01"
            dir="ltr"
            {...register("customsCost")}
            error={errors.customsCost?.message}
          />
          <Input
            label={t("form.expectedDate")}
            type="date"
            dir="ltr"
            {...register("expectedDeliveryDate")}
            error={errors.expectedDeliveryDate?.message}
          />
          <Input label={t("form.notes")} {...register("notes")} error={errors.notes?.message} />
        </div>

        {/* Items */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-fg">{t("form.itemsTitle")}</h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => append({ productId: "", quantity: "1", unitCost: "0" })}
            >
              <Plus className="w-4 h-4 me-1" /> {t("form.addItem")}
            </Button>
          </div>

          {errors.items && !errors.items.root && Array.isArray(errors.items) && (
            <p className="text-red-500 text-sm mb-2">{t("form.itemsRequired")}</p>
          )}

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-[1fr_100px_140px_auto] gap-3 items-end rounded-lg border border-border bg-bg p-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">{t("form.product")}</label>
                  <select {...register(`items.${index}.productId`)} className={selectClass}>
                    <option value="">{t("form.selectProduct")}</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                  {errors.items?.[index]?.productId && (
                    <p className="text-red-500 text-sm mt-1">{errors.items[index]?.productId?.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">{t("form.qty")}</label>
                  <input
                    type="number"
                    min={1}
                    dir="ltr"
                    className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-fg text-sm focus:border-accent focus:outline-none"
                    {...register(`items.${index}.quantity`)}
                  />
                  {errors.items?.[index]?.quantity && (
                    <p className="text-red-500 text-sm mt-1">{errors.items[index]?.quantity?.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">{t("form.unitCost")}</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    dir="ltr"
                    className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-fg text-sm focus:border-accent focus:outline-none"
                    {...register(`items.${index}.unitCost`)}
                  />
                  {errors.items?.[index]?.unitCost && (
                    <p className="text-red-500 text-sm mt-1">{errors.items[index]?.unitCost?.message}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  aria-label={t("form.removeItem")}
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            ))}
          </div>
          {typeof errors.items?.message === "string" && (
            <p className="text-red-500 text-sm mt-2">{errors.items.message}</p>
          )}
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
