"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getStockMovements, type StockMovementPage } from "@motogearsouq/api-client";
import { StockAdjustmentForm } from "@/components/admin/StockAdjustmentForm";
import { FormBanner } from "@/components/admin/FormBanner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, Search } from "lucide-react";

const typeStyles: Record<string, string> = {
  purchase: "bg-emerald-500/15 text-emerald-400",
  sale: "bg-sky-500/15 text-sky-400",
  adjustment: "bg-amber-500/15 text-amber-400",
  return: "bg-violet-500/15 text-violet-400",
  transfer_in: "bg-emerald-500/10 text-emerald-300",
  transfer_out: "bg-red-500/10 text-red-300",
};

const MOVEMENT_TYPES = ["purchase", "sale", "adjustment", "return", "transfer_in", "transfer_out"];

export default function AdminStockMovementsPage() {
  const t = useTranslations("admin.stockMovements");
  const locale = useLocale();
  const isAr = locale === "ar";
  const nf = new Intl.NumberFormat(isAr ? "ar-EG-u-nu-latn" : "en-US");

  const [pageData, setPageData] = useState<StockMovementPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const pageSize = 25;

  const fetchPage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStockMovements({
        type: typeFilter || undefined,
        page,
        pageSize,
      });
      setPageData(res);
    } catch {
      setPageData(null);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, page]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const typeLabels: Record<string, string> = {
    purchase: t("type.purchase"),
    sale: t("type.sale"),
    adjustment: t("type.adjustment"),
    return: t("type.return"),
    transfer_in: t("type.transferIn"),
    transfer_out: t("type.transferOut"),
  };

  const filteredItems = (pageData?.items ?? []).filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (m.product?.name ?? "").toLowerCase().includes(q) ||
      (m.product?.code ?? "").toLowerCase().includes(q) ||
      (m.notes ?? "").toLowerCase().includes(q) ||
      (m.purchaseOrder?.orderNumber ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">{t("title")}</h1>
          {pageData && (
            <p className="mt-1 text-sm text-muted">{t("countLine", { count: nf.format(pageData.total) })}</p>
          )}
        </div>
        {!showCreate && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            {t("add")}
          </Button>
        )}
      </div>

      {banner && <FormBanner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />}

      {showCreate && (
        <StockAdjustmentForm
          onSuccess={() => {
            setShowCreate(false);
            setBanner({ type: "success", message: t("createdOk") });
            fetchPage();
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between rounded-xl border border-border bg-card p-4">
        <div className="relative flex-1 w-full sm:w-80">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("filter.searchPlaceholder")}
            className="ps-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="mv-type" className="text-sm text-muted">
            {t("filter.type")}
          </label>
          <select
            id="mv-type"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
          >
            <option value="">{t("filter.all")}</option>
            {MOVEMENT_TYPES.map((s) => (
              <option key={s} value={s}>
                {typeLabels[s] ?? s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : filteredItems.length === 0 ? (
          <p className="p-8 text-center text-muted">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="px-5 py-3 font-medium text-start">{t("table.date")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.product")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.branch")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.type")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.delta")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.reference")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.notes")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((m) => (
                  <tr key={m.id} className="border-b border-border/50 last:border-0 hover:bg-bg/50 transition-colors">
                    <td className="px-5 py-3 text-muted text-xs" dir="ltr">
                      {new Date(m.createdAt).toLocaleString(isAr ? "ar-EG" : "en-US")}
                    </td>
                    <td className="px-5 py-3 text-fg">
                      {m.product?.name ?? m.productId}
                      {m.product?.code && (
                        <span className="ms-2 font-mono text-xs text-muted" dir="ltr">
                          {m.product.code}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-fg">{m.branch?.nameAr ?? m.branchId}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          typeStyles[m.type] ?? "bg-bg text-muted border border-border"
                        }`}
                      >
                        {typeLabels[m.type] ?? m.type}
                      </span>
                    </td>
                    <td
                      className={`px-5 py-3 font-bold ${m.quantityDelta >= 0 ? "text-emerald-400" : "text-red-400"}`}
                      dir="ltr"
                    >
                      {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                    </td>
                    <td className="px-5 py-3 text-muted text-xs" dir="ltr">
                      {m.purchaseOrder?.orderNumber ?? m.referenceId ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-muted text-xs max-w-48 truncate">{m.notes ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pageData && pageData.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
            <span className="text-muted">
              {t("pagination.page", { page: pageData.page, total: pageData.totalPages })}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t("pagination.prev")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= pageData.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("pagination.next")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
