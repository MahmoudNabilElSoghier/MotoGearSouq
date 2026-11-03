"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormBanner } from "./FormBanner";
import { brandFormSchema, type BrandFormValues, type UpdateBrandInput, type Brand } from "@motogearsouq/shared";
import { createBrand, updateBrand, ApiError } from "@motogearsouq/api-client";
import { useTranslations } from "next-intl";
import { Loader2, Plus, Save, X } from "lucide-react";

interface BrandFormProps {
  mode?: "create" | "edit";
  initialData?: Brand;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const EDIT_FORBIDDEN = ["id", "slug", "createdAt", "updatedAt"] as const;

function pickEditable<T extends Record<string, unknown>>(input: T, forbidden: readonly string[]): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (!forbidden.includes(k)) out[k] = v;
  }
  return out as Partial<T>;
}

export function BrandForm({ mode = "create", initialData, onSuccess, onCancel }: BrandFormProps) {
  const t = useTranslations("admin.brands");
  const tCommon = useTranslations("admin.forms.common");
  const [open, setOpen] = useState(mode === "edit");
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

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
    formState: { errors, isSubmitting },
  } = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          nameAr: initialData.nameAr ?? "",
          slug: initialData.slug,
          website: initialData.website ?? "",
          description: initialData.description ?? "",
        }
      : {
          name: "",
          nameAr: "",
          slug: "",
          website: "",
          description: "",
        },
  });

  const onSubmit = async (values: BrandFormValues) => {
    setBanner(null);
    try {
      const payload = {
        ...values,
        nameAr: values.nameAr || undefined,
        website: values.website || undefined,
        description: values.description || undefined,
      };

      if (mode === "edit" && initialData) {
        const editable = pickEditable(payload, EDIT_FORBIDDEN);
        const updatePayload: UpdateBrandInput = {
          name: editable.name as string,
          nameAr: editable.nameAr as string | undefined,
          website: editable.website as string | undefined,
          description: editable.description as string | undefined,
        };
        await updateBrand(initialData.id, updatePayload);
        setBanner({ type: "success", message: t("updatedOk") });
      } else {
        await createBrand(payload);
        setBanner({ type: "success", message: t("createdOk") });
        reset();
        setOpen(false);
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      setBanner({
        type: "error",
        message: getErrorMessage(err),
      });
    }
  };

  if (!open && mode === "create") {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-fg hover:border-accent"
      >
        <Plus className="w-3.5 h-3.5" />
        {t("newBtn")}
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-3 rounded-xl border border-accent/40 bg-card p-5"
    >
      <p className="font-semibold text-fg">{mode === "edit" ? t("form.titleEdit") : t("form.titleNew")}</p>
      
      {banner && <FormBanner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label={t("form.nameEn")}
          dir="ltr"
          placeholder="SYM"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input label={t("form.nameAr")} placeholder="سيم" {...register("nameAr")} />
        <Input
          label={t("form.slug")}
          dir="ltr"
          placeholder="sym"
          hint={t("form.slugHint")}
          error={errors.slug?.message}
          {...register("slug")}
          disabled={mode === "edit"}
        />
        <Input
          label={t("form.website")}
          dir="ltr"
          placeholder="https://…"
          error={errors.website?.message}
          {...register("website")}
        />
      </div>
      <Input label={t("form.description")} {...register("description")} />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting} className="inline-flex items-center gap-1.5">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin ms-1 inline" />
              <span>{t("form.saving")}</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>{tCommon("save")}</span>
            </>
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => {
            reset();
            setOpen(false);
            if (onCancel) onCancel();
          }}
          className="inline-flex items-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
