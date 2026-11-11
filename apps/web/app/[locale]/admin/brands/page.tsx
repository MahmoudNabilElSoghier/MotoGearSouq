"use client";

import { useEffect, useState } from "react";
import { BrandForm } from "@/components/admin/BrandForm";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { FormBanner } from "@/components/admin/FormBanner";
import { getBrands, deleteBrand } from "@motogearsouq/api-client";
import type { Brand } from "@motogearsouq/shared";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Pencil, Trash2 } from "lucide-react";

export default function AdminBrandsPage() {
  const t = useTranslations("admin.brands");
  const tCommon = useTranslations("admin.forms.common");
  const tGlobal = useTranslations("common");
  const locale = useLocale();
  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US");

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const refetch = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    setLoading(true);
    getBrands()
      .then(setBrands)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBanner(null);
    try {
      await deleteBrand(deleteTarget.id);
      setBanner({ type: "success", message: t("deleteOk") });
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      setBanner({
        type: "error",
        message: err instanceof Error ? err.message : t("deleteFailed"),
      });
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-fg">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">
          {loading ? tGlobal("loading") : t("countLine", { count: nf.format(brands.length) })}
        </p>
      </div>

      {banner && <FormBanner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />}

      <BrandForm onSuccess={refetch} />

      {editingBrand && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-xl p-6">
            <BrandForm
              mode="edit"
              initialData={editingBrand}
              onSuccess={() => {
                setEditingBrand(null);
                refetch();
              }}
              onCancel={() => setEditingBrand(null)}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="px-4 py-3 font-medium text-start">{t("nameAr")}</th>
                  <th className="px-4 py-3 font-medium text-start">{t("nameEn")}</th>
                  <th className="px-4 py-3 font-medium text-start">{t("slugCol")}</th>
                  <th className="px-4 py-3 font-medium text-start">{t("modelsCol")}</th>
                  <th className="px-4 py-3 font-medium text-start">{t("productsCol")}</th>
                  <th className="px-4 py-3 font-medium text-start">{t("websiteCol")}</th>
                  <th className="px-4 py-3 font-medium text-start">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {brands.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted">
                      {t("empty")}
                    </td>
                  </tr>
                ) : (
                  brands.map((brand) => (
                    <tr key={brand.id} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-3 font-semibold text-fg">
                        {brand.nameAr ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-fg" dir="ltr">
                        {brand.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted" dir="ltr">
                        {brand.slug}
                      </td>
                      <td className="px-4 py-3 text-fg">
                        {nf.format(brand._count?.models ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-fg">
                        {nf.format(brand._count?.products ?? 0)}
                      </td>
                      <td className="px-4 py-3">
                        {brand.website ? (
                          <a
                            href={brand.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-accent hover:underline"
                            dir="ltr"
                          >
                            {brand.website}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 flex gap-3 text-sm">
                        <button
                          type="button"
                          onClick={() => setEditingBrand(brand)}
                          className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          {tCommon("edit")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(brand)}
                          className="inline-flex items-center gap-1 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {tCommon("delete")}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
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
