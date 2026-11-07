"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormBanner } from "./FormBanner";
import { productFormSchema, type ProductFormValues, type UpdateProductInput, type Brand, type PartCategory, type Product } from "@motogearsouq/shared";
import { createProduct, updateProduct, ApiError } from "@motogearsouq/api-client";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

const toPriceInput = (value: number | null | undefined) =>
  value == null ? "" : String(value);

type ProductFormProps = {
  product?: Product;
  brands: Brand[];
  categories: PartCategory[];
};

const EDIT_FORBIDDEN = ["id", "code", "slug", "createdAt", "updatedAt"] as const;

function pickEditable<T extends Record<string, unknown>>(input: T, forbidden: readonly string[]): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (!forbidden.includes(k)) out[k] = v;
  }
  return out as Partial<T>;
}

const inputClass =
  "bg-bg border rounded-lg px-4 py-3 text-fg placeholder:text-muted focus:border-accent focus:outline-none disabled:opacity-50 border-border";

export function ProductForm({ product, brands, categories }: ProductFormProps) {
  const t = useTranslations("admin.products.form");
  const tCommon = useTranslations("admin.forms.common");
  const locale = useLocale();
  const router = useRouter();
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof ApiError) {
      const errBody = err.body as { message?: string; issues?: Array<{ path?: string | string[]; message?: string }> };
      if (errBody?.issues && Array.isArray(errBody.issues)) {
        const details = errBody.issues
          .map((i) => `${Array.isArray(i.path) ? i.path.join(".") : i.path || ""}: ${i.message}`)
          .join("; ");
        return t("validationFailed", { details });
      }
      if (err.message) return err.message;
    }
    if (err instanceof Error) return err.message;
    return t("saveError");
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      code: product?.code ?? "",
      name: product?.name ?? "",
      nameEn: product?.nameEn ?? "",
      description: product?.description ?? "",
      oemCode: product?.oemCode ?? "",
      brandId: product?.brandId ?? "",
      partCategoryId: product?.partCategoryId ?? "",
      costPrice: toPriceInput(product?.costPrice),
      wholesalePrice: toPriceInput(product?.wholesalePrice),
      retailPrice: toPriceInput(product?.retailPrice),
      vipPrice: toPriceInput(product?.vipPrice),
      taxRate: product ? String(product.taxRate) : "0.14",
      unitOfMeasure: product?.unitOfMeasure ?? "قطعة",
      reorderLevel: String(product?.reorderLevel ?? 5),
      tags: product?.tags.join("، ") ?? "",
      active: product?.active ?? true,
    },
  });

  const onSubmit = async (values: ProductFormValues) => {
    setBanner(null);
    try {
      if (product) {
        const fullValues = { ...(product as unknown as Record<string, unknown>), ...values };
        const editable = pickEditable(fullValues, EDIT_FORBIDDEN);
        const updatePayload: UpdateProductInput = editable as UpdateProductInput;
        await updateProduct(product.id, updatePayload);
        setBanner({ type: "success", message: t("updatedOk") });
      } else {
        await createProduct(values);
        setBanner({ type: "success", message: t("createdOk") });
      }

      setTimeout(() => {
        router.push(`/${locale}/admin/products`);
        router.refresh();
      }, 1000);
    } catch (err) {
      setBanner({
        type: "error",
        message: getErrorMessage(err),
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-6 rounded-xl border border-border bg-card p-6"
    >
      {banner && <FormBanner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />}

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label={t("code")}
          dir="ltr"
          placeholder="SYM-FLT-001"
          error={errors.code?.message}
          {...register("code")}
          disabled={!!product}
        />
        <Input
          label={t("name")}
          error={errors.name?.message}
          {...register("name")}
        />
        <Input label={t("nameEn")} dir="ltr" {...register("nameEn")} />
        <Input label={t("oemCode")} dir="ltr" {...register("oemCode")} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="product-brand" className="text-sm font-medium text-fg">
            {t("brand")}
          </label>
          <select id="product-brand" className={inputClass} {...register("brandId")}>
            <option value="">{t("noBrand")}</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.nameAr ?? brand.name}
              </option>
            ))}
          </select>
          {errors.brandId && (
            <p className="text-sm text-red-500">{errors.brandId.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="product-category"
            className="text-sm font-medium text-fg"
          >
            {t("category")}
          </label>
          <select
            id="product-category"
            className={inputClass}
            {...register("partCategoryId")}
          >
            <option value="">{t("noCategory")}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.parentId ? "└ " : ""}
                {category.nameAr ?? category.name}
              </option>
            ))}
          </select>
          {errors.partCategoryId && (
            <p className="text-sm text-red-500">{errors.partCategoryId.message}</p>
          )}
        </div>

        <Input
          label={t("cost")}
          type="number"
          step="0.01"
          min="0"
          dir="ltr"
          error={errors.costPrice?.message}
          {...register("costPrice")}
        />
        <Input
          label={t("wholesale")}
          type="number"
          step="0.01"
          min="0"
          dir="ltr"
          error={errors.wholesalePrice?.message}
          {...register("wholesalePrice")}
        />
        <Input
          label={t("retail")}
          type="number"
          step="0.01"
          min="0"
          dir="ltr"
          error={errors.retailPrice?.message}
          {...register("retailPrice")}
        />
        <Input
          label={t("vip")}
          type="number"
          step="0.01"
          min="0"
          dir="ltr"
          error={errors.vipPrice?.message}
          {...register("vipPrice")}
        />
        <Input
          label={t("vat")}
          type="number"
          step="0.01"
          min="0"
          dir="ltr"
          hint={t("vatHint")}
          error={errors.taxRate?.message}
          {...register("taxRate")}
        />
        <Input
          label={t("unit")}
          error={errors.unitOfMeasure?.message}
          {...register("unitOfMeasure")}
        />
        <Input
          label={t("reorder")}
          type="number"
          min="0"
          dir="ltr"
          error={errors.reorderLevel?.message}
          {...register("reorderLevel")}
        />
        <Input
          label={t("tags")}
          hint={t("tagsHint")}
          error={errors.tags?.message}
          {...register("tags")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="product-description"
          className="text-sm font-medium text-fg"
        >
          {t("description")}
        </label>
        <textarea
          id="product-description"
          rows={4}
          className={inputClass}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-fg">
        <input
          type="checkbox"
          className="h-4 w-4 accent-accent-strong"
          {...register("active")}
        />
        {t("activeLabel")}
      </label>

      <div className="flex gap-3 border-t border-border pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin ms-2 inline" />
              <span>{t("saving")}</span>
            </>
          ) : (
            <span>{tCommon("save")}</span>
          )}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
