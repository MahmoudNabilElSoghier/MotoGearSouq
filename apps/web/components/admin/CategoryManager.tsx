"use client";

import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormBanner } from "./FormBanner";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  categoryFormSchema,
  type CategoryFormValues,
  type UpdateCategoryInput,
  type PartCategory,
} from "@motogearsouq/shared";
import { createCategory, updateCategory, deleteCategory, ApiError } from "@motogearsouq/api-client";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Plus, Pencil, Trash2, Save, X } from "lucide-react";

type Mode =
  | { type: "edit"; category: PartCategory }
  | { type: "add"; parentId: string | null };

function CategoryFormPanel({
  mode,
  onCancel,
  onSuccess,
}: {
  mode: Mode;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("admin.categories");
  const tCommon = useTranslations("admin.forms.common");
  const isEdit = mode.type === "edit";
  const category = isEdit ? mode.category : null;
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
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      nameAr: category?.nameAr ?? "",
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      order: category ? String(category.order) : "",
    },
  });

  const onSubmit = async (values: CategoryFormValues) => {
    setBanner(null);
    try {
      const payload = {
        ...(category ?? {}),
        nameAr: values.nameAr,
        name: values.name || undefined,
        slug: values.slug,
        order: values.order ? String(values.order) : "0",
        parentId: isEdit ? category?.parentId ?? null : mode.type === "add" ? mode.parentId : null,
      };

      if (isEdit && category) {
        const editable = pickEditable(payload, EDIT_FORBIDDEN);
        const updatePayload: UpdateCategoryInput = {
          nameAr: editable.nameAr as string,
          name: editable.name as string | undefined,
          order: editable.order as string,
        };
        await updateCategory(category.id, updatePayload);
      } else {
        await createCategory(payload);
      }

      onSuccess();
      onCancel();
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
      className="space-y-3 rounded-lg border border-accent/40 bg-bg p-4"
    >
      <p className="text-sm font-semibold text-fg">
        {isEdit ? t("form.editTitle", { name: category?.nameAr ?? category?.name ?? "" }) : t("form.newTitle")}
      </p>

      {banner && <FormBanner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label={t("form.nameAr")}
          error={errors.nameAr?.message}
          {...register("nameAr")}
        />
        <Input label={t("form.nameEn")} dir="ltr" {...register("name")} />
        <Input
          label={t("form.slug")}
          dir="ltr"
          placeholder="oil-filter"
          error={errors.slug?.message}
          {...register("slug")}
          disabled={isEdit}
        />
        <Input
          label={t("form.order")}
          type="number"
          dir="ltr"
          error={errors.order?.message}
          {...register("order")}
        />
      </div>
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
        <Button type="button" size="sm" variant="secondary" onClick={onCancel} className="inline-flex items-center gap-1.5">
          <X className="w-3.5 h-3.5" />
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}

const EDIT_FORBIDDEN = ["id", "slug", "createdAt", "updatedAt"] as const;

function pickEditable<T extends Record<string, unknown>>(input: T, forbidden: readonly string[]): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (!forbidden.includes(k)) out[k] = v;
  }
  return out as Partial<T>;
}

export function CategoryManager({ tree, onSuccess }: { tree: PartCategory[]; onSuccess: () => void }) {
  const t = useTranslations("admin.categories");
  const tCommon = useTranslations("admin.forms.common");
  const locale = useLocale();
  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US");

  const [mode, setMode] = useState<Mode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PartCategory | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.id);
      setBanner({ type: "success", message: t("deleteOk") });
      setDeleteTarget(null);
      onSuccess();
    } catch (err) {
      setBanner({
        type: "error",
        message: err instanceof Error ? err.message : t("form.saveError"),
      });
      setDeleteTarget(null);
    }
  };

  const renderNode = (category: PartCategory, depth: number): ReactNode => (
    <li key={category.id} className="space-y-2">
      <div
        className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
        style={{ marginInlineStart: depth * 16 }}
      >
        <span className="font-semibold text-fg">
          {category.nameAr ?? category.name}
        </span>
        <span className="font-mono text-xs text-muted" dir="ltr">
          {category.slug}
        </span>
        <span className="rounded-full bg-bg px-2 py-0.5 text-xs text-muted">
          {t("productCount", { count: nf.format(category._count?.products ?? 0) })}
        </span>
        <span className="ms-auto flex gap-3 text-sm">
          <button
            type="button"
            onClick={() => setMode({ type: "edit", category })}
            className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
          >
            <Pencil className="w-3.5 h-3.5" />
            {tCommon("edit")}
          </button>
          <button
            type="button"
            onClick={() => setMode({ type: "add", parentId: category.id })}
            className="inline-flex items-center gap-1 text-muted hover:text-fg"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("addChild")}
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(category)}
            className="inline-flex items-center gap-1 text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {tCommon("delete")}
          </button>
        </span>
      </div>
      {mode?.type === "edit" && mode.category.id === category.id && (
        <CategoryFormPanel
          key={`edit-${category.id}`}
          mode={mode}
          onCancel={() => setMode(null)}
          onSuccess={onSuccess}
        />
      )}
      {mode?.type === "add" && mode.parentId === category.id && (
        <CategoryFormPanel
          key={`add-${category.id}`}
          mode={mode}
          onCancel={() => setMode(null)}
          onSuccess={onSuccess}
        />
      )}
      {category.children && category.children.length > 0 && (
        <ul className="space-y-2">
          {category.children.map((child) => renderNode(child, depth + 1))}
        </ul>
      )}
    </li>
  );

  return (
    <div className="space-y-4">
      {banner && <FormBanner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />}

      <div>
      <button
        type="button"
        onClick={() => setMode({ type: "add", parentId: null })}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-fg hover:border-accent"
      >
        <Plus className="w-3.5 h-3.5" />
        {t("addRoot")}
      </button>
      </div>
      {mode?.type === "add" && mode.parentId === null && (
        <CategoryFormPanel key="add-root" mode={mode} onCancel={() => setMode(null)} onSuccess={onSuccess} />
      )}
      {tree.length === 0 ? (
        <p className="text-muted">{t("empty")}</p>
      ) : (
        <ul className="space-y-2">{tree.map((category) => renderNode(category, 0))}</ul>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={t("deleteTitle")}
          message={t("deleteMsg", { name: deleteTarget.nameAr ?? deleteTarget.name })}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
