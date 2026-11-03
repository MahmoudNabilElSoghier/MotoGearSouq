"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormBanner } from "@/components/admin/FormBanner";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { getProducts, deleteProduct, totalStock, type ProductPage } from "@motogearsouq/api-client";
import type { Product } from "@motogearsouq/shared";
import { Loader2, Plus, Pencil, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export default function AdminProductsPage() {
  const t = useTranslations("admin.products");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US");
  const formatEgp = (value: number | null) =>
    value == null ? "—" : `${nf.format(value)} ${locale === "ar" ? "ج.م" : "EGP"}`;

  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const page = searchParams.get("page") ?? "1";
  const pageNum = Math.max(1, Number(page) || 1);

  const [result, setResult] = useState<ProductPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const refetch = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    setLoading(true);
    getProducts({
      q: q || undefined,
      page: pageNum,
      pageSize: 20,
      includeInactive: true,
    })
      .then(setResult)
      .finally(() => setLoading(false));
  }, [q, pageNum, refreshKey]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBanner(null);
    try {
      await deleteProduct(deleteTarget.id);
      setBanner({ type: "success", message: t("deletedOk") });
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

  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    return `/admin/products${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">
            {result ? t("countLine", { count: nf.format(result.total) }) : tCommon("loading")}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/products/new" className="inline-flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" />
            {t("add")}
          </Link>
        </Button>
      </div>

      {banner && <FormBanner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />}

      <form action="/admin/products" method="get" className="flex items-end gap-2">
        <div className="w-full max-w-md">
          <Input
            label={t("searchLabel")}
            name="q"
            defaultValue={q}
            placeholder={t("searchPlaceholder")}
          />
        </div>
        <Button type="submit" variant="secondary" size="md">
          {t("searchBtn")}
        </Button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="px-4 py-3 font-medium text-start">{t("code")}</th>
                    <th className="px-4 py-3 font-medium text-start">{t("name")}</th>
                    <th className="px-4 py-3 font-medium text-start">{t("brand")}</th>
                    <th className="px-4 py-3 font-medium text-start">{t("category")}</th>
                    <th className="px-4 py-3 font-medium text-start">{t("wholesale")}</th>
                    <th className="px-4 py-3 font-medium text-start">{t("retail")}</th>
                    <th className="px-4 py-3 font-medium text-start">{t("stock")}</th>
                    <th className="px-4 py-3 font-medium text-start">{t("status")}</th>
                    <th className="px-4 py-3 font-medium text-start">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {!result || result.items.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-muted">
                        {t("empty")}
                      </td>
                    </tr>
                  ) : (
                    result.items.map((product) => {
                      const stock = totalStock(product);
                      const low = stock <= product.reorderLevel;
                      return (
                        <tr key={product.id} className="border-b border-border/50 last:border-0">
                          <td className="px-4 py-3 font-mono text-xs text-fg" dir="ltr">
                            {product.code}
                          </td>
                          <td className="px-4 py-3 text-fg">{product.name}</td>
                          <td className="px-4 py-3 text-muted">{product.brand?.name ?? "—"}</td>
                          <td className="px-4 py-3 text-muted">
                            {product.partCategory?.nameAr ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-fg">
                            {formatEgp(product.wholesalePrice)}
                          </td>
                          <td className="px-4 py-3 text-fg">
                            {formatEgp(product.retailPrice)}
                          </td>
                          <td
                            className={`px-4 py-3 font-semibold ${
                              low ? "text-red-400" : "text-fg"
                            }`}
                          >
                            {nf.format(stock)}
                            {low && <span className="ms-1 text-xs">{t("lowTag")}</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                product.active
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : "bg-bg text-muted"
                              }`}
                            >
                              {product.active ? tCommon("active") : tCommon("inactive")}
                            </span>
                          </td>
                          <td className="px-4 py-3 flex gap-3 text-sm">
                            <Link
                              href={`/admin/products/${product.id}/edit`}
                              className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
                            >
                              <Pencil className="w-3.5 h-3.5 shrink-0" />
                              {tCommon("edit")}
                            </Link>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(product)}
                              className="inline-flex items-center gap-1 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-3.5 h-3.5 shrink-0" />
                              {tCommon("delete")}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {result && result.totalPages > 1 && (
            <nav
              aria-label={t("paginationAria")}
              className="flex items-center justify-between text-sm"
            >
              <Link
                href={pageHref(result.page - 1)}
                aria-disabled={result.page <= 1}
                className={`rounded-lg border border-border px-4 py-2 font-semibold inline-flex items-center gap-1.5 ${
                  result.page <= 1
                    ? "pointer-events-none opacity-40"
                    : "text-fg hover:border-accent"
                }`}
              >
                <ArrowLeft className={`w-3.5 h-3.5 ${result.page <= 1 ? "opacity-40" : ""}`} />
                {tCommon("prev")}
              </Link>
              <span className="text-muted">
                {tCommon("pageOf", { page: nf.format(result.page), total: nf.format(result.totalPages) })}
              </span>
              <Link
                href={pageHref(result.page + 1)}
                aria-disabled={result.page >= result.totalPages}
                className={`rounded-lg border border-border px-4 py-2 font-semibold inline-flex items-center gap-1.5 ${
                  result.page >= result.totalPages
                    ? "pointer-events-none opacity-40"
                    : "text-fg hover:border-accent"
                }`}
              >
                {tCommon("next")}
                <ArrowRight className={`w-3.5 h-3.5 ${result.page >= result.totalPages ? "opacity-40" : ""}`} />
              </Link>
            </nav>
          )}
        </>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={t("deleteTitle")}
          message={t("deleteMsg", { name: deleteTarget.name })}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
