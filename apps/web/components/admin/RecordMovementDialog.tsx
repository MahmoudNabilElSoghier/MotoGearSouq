"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createStockAdjustment, ApiError } from "@motogearsouq/api-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormBanner } from "./FormBanner";
import { useTranslations } from "next-intl";
import { Loader2, Plus, Minus, Edit3 } from "lucide-react";

interface RecordMovementDialogProps {
  productId: string;
  branchId: string;
  productName: string;
  branchName: string;
  currentQty: number;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type MovementMessages = {
  wholeNumber: string;
};

function createMovementFormSchema(m: MovementMessages) {
  return z.object({
    type: z.enum(["in", "out", "adjustment"]),
    quantity: z.string().regex(/^\d+$/, m.wholeNumber),
    newExactQty: z.string().optional(),
    reason: z.string().optional(),
  });
}

type MovementFormValues = z.infer<ReturnType<typeof createMovementFormSchema>>;

type MovementType = "in" | "out" | "adjustment";

const TYPE_LABELS: Record<MovementType, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  in: { label: "type.in", icon: Plus },
  out: { label: "type.out", icon: Minus },
  adjustment: { label: "type.adjustment", icon: Edit3 },
};

export function RecordMovementDialog({
  productId,
  branchId,
  productName,
  branchName,
  currentQty,
  open,
  onClose,
  onSuccess,
}: RecordMovementDialogProps) {
  const t = useTranslations("admin.inventory");
  const tCommon = useTranslations("admin.forms.common");
  const tVal = useTranslations("admin.forms.validation");
  const movementFormSchema = useMemo(
    () => createMovementFormSchema({ wholeNumber: tVal("wholeNumber") }),
    [tVal],
  );
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<MovementFormValues>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: { type: "in", quantity: "", newExactQty: "", reason: "" },
  });

  const type = watch("type");
  const quantity = watch("quantity");
  const newExactQty = watch("newExactQty");

  const isAdjustment = type === "adjustment";

  let calculatedDelta: number | null = null;
  if (isAdjustment && newExactQty !== undefined && newExactQty !== "") {
    const newQty = parseInt(newExactQty, 10);
    calculatedDelta = Number.isNaN(newQty) ? null : newQty - currentQty;
  } else if (!isAdjustment && quantity !== undefined && quantity !== "") {
    const qty = parseInt(quantity, 10);
    if (!Number.isNaN(qty) && qty > 0) {
      calculatedDelta = type === "in" ? qty : -qty;
    }
  }

  const isDeltaZero = calculatedDelta !== null && calculatedDelta === 0;
  const qtyVal = quantity ?? "";
  const newQtyVal = newExactQty ?? "";
  const hasValidQty =
    !isAdjustment
      ? qtyVal !== "" && parseInt(qtyVal, 10) > 0
      : newQtyVal !== "" && parseInt(newQtyVal, 10) >= 0;

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

  const onSubmit = async (data: MovementFormValues) => {
    setLoading(true);
    setBanner(null);
    try {
      let quantityDelta: number;
      if (data.type === "in") {
        quantityDelta = parseInt(data.quantity, 10);
      } else if (data.type === "out") {
        quantityDelta = -parseInt(data.quantity, 10);
      } else {
        quantityDelta = parseInt(data.newExactQty!, 10) - currentQty;
      }

      await createStockAdjustment({
        productId,
        branchId,
        quantityDelta,
        notes: data.reason || undefined,
      });
      reset({ type: "in", quantity: "", newExactQty: "", reason: "" });
      if (onSuccess) onSuccess();
    } catch (err) {
      setBanner({ type: "error", message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-amber-500/15 text-amber-400">
            <Edit3 className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-fg">{t("modal.title")}</h2>
        </div>

        {banner && <FormBanner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted">{t("modal.product")}: <span className="font-medium text-fg">{productName}</span></p>
            <p className="text-sm text-muted">{t("modal.branch")}: <span className="font-medium text-fg">{branchName}</span></p>
            <p className="text-sm text-muted">
              {t("modal.currentQty")}: <span className="font-mono dir-ltr text-fg font-semibold">{currentQty}</span>
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-fg">{t("modal.typeLabel")}</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(TYPE_LABELS).map(([key, { label, icon: Icon }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    reset({ type: key as MovementType, quantity: "", newExactQty: "", reason: "" });
                  }}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    type === key
                      ? "border-amber-500 bg-amber-500/10 text-amber-700"
                      : "border-border bg-bg text-muted hover:border-accent"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t(label)}</span>
                </button>
              ))}
            </div>
            {errors.type && <p className="text-red-500 text-xs">{errors.type.message}</p>}
          </div>

          {type === "adjustment" ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-fg">{t("modal.newExactQty")}</label>
              <Input
                type="number"
                min={0}
                step={1}
                dir="ltr"
                {...register("newExactQty")}
                error={errors.newExactQty?.message}
                placeholder={t("modal.newExactQtyHint")}
              />
              <p className="text-xs text-muted">{t("modal.currentQtyHint", { currentQty })}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-fg">{t("modal.quantity")}</label>
              <Input
                type="number"
                min={1}
                step={1}
                dir="ltr"
                {...register("quantity")}
                error={errors.quantity?.message}
                placeholder={t("modal.quantityHint")}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-fg">{t("modal.reason")}</label>
            <Input {...register("reason")} error={errors.reason?.message} placeholder={t("modal.reasonHint")} />
          </div>

          {calculatedDelta !== null && !isDeltaZero && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-bg border-border">
              <span className="text-sm text-muted">{t("modal.deltaLabel")}:</span>
              <span
                className={`font-mono dir-ltr text-sm font-semibold ${
                  calculatedDelta > 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {calculatedDelta > 0 ? `+${calculatedDelta}` : calculatedDelta}
              </span>
            </div>
          )}
          {isDeltaZero && (
            <p className="text-xs text-amber-500">{t("modal.zeroDelta")}</p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" size="sm" disabled={loading || !hasValidQty || isDeltaZero}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>{t("modal.saving")}</span>
                </>
              ) : (
                <span>{t("modal.submit")}</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
