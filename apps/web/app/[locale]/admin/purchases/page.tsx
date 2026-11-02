"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getPurchases, type PurchaseOrderPage, type PurchaseStatus } from "@motogearsouq/api-client";
import { PurchaseOrderForm } from "@/components/admin/PurchaseOrderForm";
import { FormBanner } from "@/components/admin/FormBanner";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

const statusStyles: Record<string, string> = {
  draft: "bg-bg text-muted border border-border",
  ordered: "bg-sky-500/15 text-sky-400",
  shipped: "bg-violet-500/15 text-violet-400",
  received: "bg-emerald-500/15 text-emerald-400",
  cancelled: "bg-red-500/15 text-red-400",
};

const STATUSES: PurchaseStatus[] = ["draft", "ordered", "shipped", "received", "cancelled"];

export default function AdminPurchasesPage() {
  const t = useTranslations("admin.purchases");
  const locale = useLocale();
  const isAr = locale === "ar";
  const nf = new Intl.NumberFormat(isAr ? "ar-EG-u-nu-latn" : "en-US");

  const [pageData, setPageData] = useState<PurchaseOrderPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const pageSize = 20;

  const fetchPage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPurchases({
        status: statusFilter || undefined,
        page,
        pageSize,
      });
      setPageData(res);
    } catch {
      setPageData(null);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const statusLabels: Record<string, string> = {
    draft: t("status.draft"),
    ordered: t("status.ordered"),
    shipped: t("status.shipped"),
    received: t("status.received"),
    cancelled: t("status.cancelled"),
  };

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
        <PurchaseOrderForm
          onSuccess={() => {
            setShowCreate(false);
            setBanner({ type: "success", message: t("createdOk") });
            fetchPage();
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-end rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <label htmlFor="po-status" className="text-sm text-muted">
            {t("filter.status")}
          </label>
          <select
            id="po-status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
          >
            <option value="">{t("filter.all")}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
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
        ) : !pageData || pageData.items.length === 0 ? (
          <p className="p-8 text-center text-muted">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="px-5 py-3 font-medium text-start">{t("table.orderNumber")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.supplier")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.branch")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.items")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.total")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.status")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.date")}</th>
                </tr>
              </thead>
              <tbody>
                {pageData.items.map((po) => (
                  <tr
                    key={po.id}
                    onClick={() => {
                      window.location.href = `/${locale}/admin/purchases/${po.id}`;
                    }}
                    className="border-b border-border/50 last:border-0 cursor-pointer hover:bg-bg/50 transition-colors"
                  >
                    <td className="px-5 py-3 font-mono text-xs font-bold text-accent" dir="ltr">
                      {po.orderNumber}
                    </td>
                    <td className="px-5 py-3 text-fg">{po.supplier.name}</td>
                    <td className="px-5 py-3 text-fg">{po.branch.nameAr}</td>
                    <td className="px-5 py-3 text-fg" dir="ltr">
                      {nf.format(po._count?.items ?? 0)}
                    </td>
                    <td className="px-5 py-3 font-semibold text-fg" dir="ltr">
                      {nf.format(Number(po.total))}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          statusStyles[po.status] ?? "bg-bg text-muted"
                        }`}
                      >
                        {statusLabels[po.status] ?? po.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted text-xs" dir="ltr">
                      {new Date(po.createdAt).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
                    </td>
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
