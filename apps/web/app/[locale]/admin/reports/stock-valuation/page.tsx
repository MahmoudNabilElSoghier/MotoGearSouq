"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getStockValuation, type StockValuationResponse } from "@motogearsouq/api-client";
import { Loader2, TrendingUp, DollarSign } from "lucide-react";

export default function AdminStockValuationPage() {
  const t = useTranslations("admin.reports.stockValuation");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const isAr = locale === "ar";
  const nf = new Intl.NumberFormat(isAr ? "ar-EG-u-nu-latn" : "en-US");
  const currency = (n: number) => `${nf.format(n)} EGP`;

  const [data, setData] = useState<StockValuationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getStockValuation()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-fg">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
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
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
              <div className="text-xs font-semibold text-muted flex items-center justify-between">
                <span>{t("totalCostValue")}</span>
                <DollarSign className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-fg">{currency(data.totalValue)}</div>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
              <div className="text-xs font-semibold text-muted flex items-center justify-between">
                <span>{t("totalRetailValue")}</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-fg">{currency(data.totalRetailValue)}</div>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
              <div className="text-xs font-semibold text-muted flex items-center justify-between">
                <span>{t("potentialProfit")}</span>
                <span className="text-emerald-500 font-bold">{t("marginTag")}</span>
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {currency(data.potentialProfit)}
              </div>
            </div>
          </div>

          {/* Tables by Branch & Category */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Branch */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-bold text-fg">{t("byBranch")}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-start text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted text-xs">
                      <th className="py-2.5 text-start font-semibold">{t("thBranch")}</th>
                      <th className="py-2.5 text-end font-semibold">{t("thCostValue")}</th>
                      <th className="py-2.5 text-end font-semibold">{t("thRetailValue")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {data.byBranch.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-muted">{t("emptyBranch")}</td>
                      </tr>
                    ) : (
                      data.byBranch.map((b) => (
                        <tr key={b.branchId} className="hover:bg-accent/5">
                          <td className="py-3 font-bold text-fg">{b.branchNameAr}</td>
                          <td className="py-3 text-end font-semibold">{currency(b.costValue)}</td>
                          <td className="py-3 text-end font-semibold">{currency(b.retailValue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* By Category */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-bold text-fg">{t("byCategory")}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-start text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted text-xs">
                      <th className="py-2.5 text-start font-semibold">{t("thCategory")}</th>
                      <th className="py-2.5 text-end font-semibold">{t("thCostValue")}</th>
                      <th className="py-2.5 text-end font-semibold">{t("thRetailValue")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {data.byCategory.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-muted">{t("emptyCategory")}</td>
                      </tr>
                    ) : (
                      data.byCategory.map((c) => (
                        <tr key={c.categoryId} className="hover:bg-accent/5">
                          <td className="py-3 font-bold text-fg">{c.categoryName}</td>
                          <td className="py-3 text-end font-semibold">{currency(c.costValue)}</td>
                          <td className="py-3 text-end font-semibold">{currency(c.retailValue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
