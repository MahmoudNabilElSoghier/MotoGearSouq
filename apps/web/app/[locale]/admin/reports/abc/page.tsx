"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getAbcAnalysis, type AbcAnalysis } from "@motogearsouq/api-client";
import { Loader2 } from "lucide-react";

export default function AdminAbcAnalysisPage() {
  const t = useTranslations("admin.reports.abc");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const isAr = locale === "ar";
  const nf = new Intl.NumberFormat(isAr ? "ar-EG-u-nu-latn" : "en-US");
  const currency = (n: number) => `${nf.format(n)} EGP`;

  const [period, setPeriod] = useState("90d");
  const [data, setData] = useState<AbcAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"A" | "B" | "C">("A");

  useEffect(() => {
    setLoading(true);
    getAbcAnalysis(period)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [period]);

  const filteredProducts = data?.products.filter((p) => p.class === activeTab) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-1">
          {["30d", "90d", "365d"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                period === p ? "bg-accent text-fg shadow-sm" : "text-muted hover:text-fg"
              }`}
            >
              {p}
            </button>
          ))}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(["A", "B", "C"] as const).map((cls) => {
              const summary =
                (cls === "A"
                  ? data.summary?.classA
                  : cls === "B"
                    ? data.summary?.classB
                    : data.summary?.classC) ?? { count: 0, revenuePercent: 0 };
              const isSelected = activeTab === cls;
              return (
                <button
                  key={cls}
                  onClick={() => setActiveTab(cls)}
                  className={`p-5 rounded-2xl border text-start transition-all ${
                    isSelected
                      ? "border-accent-strong bg-accent/10 shadow-sm ring-2 ring-accent"
                      : "border-border bg-card hover:bg-accent/5"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-fg">
                      {t(`class${cls}`)}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                        cls === "A" ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : cls === "B" ? "bg-blue-500/20 text-blue-600 dark:text-blue-400" : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      Class {cls}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-fg mb-1">{nf.format(summary.count)} items</div>
                  <div className="text-xs text-muted">{summary.revenuePercent}% of total revenue</div>
                </button>
              );
            })}
          </div>

          {/* Products Table for Active Class */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-bold text-fg">
              Class {activeTab} Products ({filteredProducts.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-start text-sm">
                <thead>
                  <tr className="border-b border-border text-muted text-xs">
                    <th className="py-2.5 text-start font-semibold">{t("code")}</th>
                    <th className="py-2.5 text-start font-semibold">{t("name")}</th>
                    <th className="py-2.5 text-end font-semibold">{t("unitsSold")}</th>
                    <th className="py-2.5 text-end font-semibold">{t("revenue")}</th>
                    <th className="py-2.5 text-end font-semibold">{t("cumulative")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted">No products in Class {activeTab}.</td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.productId} className="hover:bg-accent/5">
                        <td className="py-3 font-mono text-xs font-semibold text-muted">{p.code}</td>
                        <td className="py-3 font-bold text-fg">{p.name}</td>
                        <td className="py-3 text-end font-semibold">{nf.format(p.unitsSold)}</td>
                        <td className="py-3 text-end font-semibold">{currency(p.revenue)}</td>
                        <td className="py-3 text-end font-semibold text-muted">{p.cumulativePercent}%</td>
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
