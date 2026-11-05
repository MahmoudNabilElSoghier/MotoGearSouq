"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getDeadStock, type DeadStockResponse } from "@motogearsouq/api-client";
import { Button } from "@/components/ui/Button";
import { Loader2, AlertCircle, Download } from "lucide-react";

export default function AdminDeadStockPage() {
  const t = useTranslations("admin.reports.deadStock");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const isAr = locale === "ar";
  const nf = new Intl.NumberFormat(isAr ? "ar-EG-u-nu-latn" : "en-US");
  const currency = (n: number) => `${nf.format(n)} EGP`;

  const [days, setDays] = useState(90);
  const [data, setData] = useState<DeadStockResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getDeadStock(days)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [days]);

  const exportCsv = () => {
    if (!data || data.products.length === 0) return;
    const headers = [t("csv.code"), t("csv.name"), t("csv.currentStock"), t("csv.costPrice"), t("csv.capitalTied"), t("csv.lastSoldAt")];
    const rows = data.products.map((p) => [
      p.code,
      `"${p.name.replace(/"/g, '""')}"`,
      p.currentStock,
      p.costPrice,
      p.capitalTied,
      p.lastSoldAt ? p.lastSoldAt.split("T")[0] : t("csv.never"),
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dead-stock-${days}d.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-1">
            {[30, 60, 90, 180].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  days === d ? "bg-accent text-fg shadow-sm" : "text-muted hover:text-fg"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
          {data && data.products.length > 0 && (
            <Button size="sm" variant="secondary" onClick={exportCsv} className="gap-2">
              <Download className="w-4 h-4" />
              <span>{t("exportCsv")}</span>
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted" />
        </div>
      ) : !data ? (
        <div className="p-8 text-center text-muted border border-border rounded-xl bg-card">
          {tCommon("errorGeneric")}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
              <div className="text-xs font-semibold text-muted flex items-center justify-between">
                <span>{t("productsCount")}</span>
                <AlertCircle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-fg">{t("itemsCount", { count: nf.format(data.deadProductsCount) })}</div>
              <div className="text-xs text-muted">{t("checkedLine", { count: nf.format(data.totalProductsChecked) })}</div>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
              <div className="text-xs font-semibold text-muted flex items-center justify-between">
                <span>{t("capitalTied")}</span>
                <span className="text-red-500 font-bold">{t("capitalTied")}</span>
              </div>
              <div className="text-2xl font-black text-fg">{currency(data.totalCapitalTied)}</div>
              <div className="text-xs text-muted">{t("inactiveLine", { days: data.thresholdDays })}</div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-bold text-fg">{t("productsCount")}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-start text-sm">
                <thead>
                  <tr className="border-b border-border text-muted text-xs">
                    <th className="py-2.5 text-start font-semibold">{t("thCodeName")}</th>
                    <th className="py-2.5 text-end font-semibold">{t("thStock")}</th>
                    <th className="py-2.5 text-end font-semibold">{t("thCostPrice")}</th>
                    <th className="py-2.5 text-end font-semibold">{t("thCapitalTied")}</th>
                    <th className="py-2.5 text-end font-semibold">{t("lastSoldAt")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {data.products.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted">{t("emptyMessage")}</td>
                    </tr>
                  ) : (
                    data.products.map((p) => (
                      <tr key={p.productId} className="hover:bg-accent/5">
                        <td className="py-3">
                          <div className="font-bold text-fg">{p.name}</div>
                          <div className="text-xs font-mono text-muted">{p.code}</div>
                        </td>
                        <td className="py-3 text-end font-semibold">{nf.format(p.currentStock)}</td>
                        <td className="py-3 text-end font-semibold">{currency(p.costPrice)}</td>
                        <td className="py-3 text-end font-semibold text-red-600 dark:text-red-400">
                          {currency(p.capitalTied)}
                        </td>
                        <td className="py-3 text-end text-xs text-muted">
                          {p.lastSoldAt ? new Date(p.lastSoldAt).toLocaleDateString() : t("neverSold")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
