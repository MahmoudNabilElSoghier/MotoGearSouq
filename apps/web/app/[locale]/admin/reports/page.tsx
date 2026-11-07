"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  getAnalyticsDashboard,
  getPaymentTransactions,
  type AnalyticsDashboard,
  type PaymentTransactionPage,
} from "@motogearsouq/api-client";
import Link from "next/link";
import { Loader2, TrendingUp, DollarSign, ShoppingCart, Users, AlertCircle, ArrowRight, BarChart3, CreditCard, Clock } from "lucide-react";

export default function AdminReportsDashboardPage() {
  const t = useTranslations("admin.reports");
  const tPayKpis = useTranslations("admin.reports.paymentKpis");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const isAr = locale === "ar";
  const nf = new Intl.NumberFormat(isAr ? "ar-EG-u-nu-latn" : "en-US");
  const currency = (n: number) => `${nf.format(Number.isFinite(n) ? n : 0)} EGP`;

  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [txPage, setTxPage] = useState<PaymentTransactionPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getAnalyticsDashboard(period).catch(() => null),
      getPaymentTransactions({ pageSize: 500 }).catch(() => null),
    ])
      .then(([dashRes, txRes]) => {
        setData(dashRes);
        setTxPage(txRes);
      })
      .finally(() => setLoading(false));
  }, [period]);

  const kpis = data?.kpis;
  const txItems = txPage?.items ?? [];
  const totalCollected = txItems
    .filter((tx) => tx.status === "success")
    .reduce((acc, tx) => acc + tx.amount, 0);
  const totalPending = txItems
    .filter((tx) => tx.status === "pending")
    .reduce((acc, tx) => acc + tx.amount, 0);
  const refunded = txItems
    .filter((tx) => tx.status === "refunded")
    .reduce((acc, tx) => acc + tx.amount, 0);
  const codCount = txItems.filter((tx) => tx.method === "cod" || !tx.method).length;

  const methodMap = txItems.reduce((acc: Record<string, { count: number; total: number }>, tx) => {
    const m = tx.method || "cod";
    if (!acc[m]) acc[m] = { count: 0, total: 0 };
    acc[m].count += 1;
    acc[m].total += tx.amount;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">
            {t("nav.dashboard")}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-1">
          {["7d", "30d", "90d", "365d"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                period === p ? "bg-accent text-fg shadow-sm" : "text-muted hover:text-fg"
              }`}
            >
              <Clock className="w-3 h-3 mr-1.5 shrink-0" />
              {t(`period.last${p.replace("d", "Days").replace("365Days", "365Days")}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Nav Sub-links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/admin/reports/break-even", label: t("nav.breakEven"), icon: DollarSign },
          { href: "/admin/reports/abc", label: t("nav.abc"), icon: BarChart3 },
          { href: "/admin/reports/dead-stock", label: t("nav.deadStock"), icon: AlertCircle },
          { href: "/admin/reports/stock-valuation", label: t("nav.stockValuation"), icon: TrendingUp },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={`/${locale}${item.href}`}
              className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-accent/10 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-accent/20 text-fg">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-fg">{item.label}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted group-hover:translate-x-0.5 transition-transform" />
            </Link>
          );
        })}
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
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
              <div className="text-xs font-semibold text-muted flex items-center justify-between">
                <span>{t("dashboard.totalRevenue")}</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-fg">{currency(kpis?.totalRevenue ?? 0)}</div>
              <div className="text-xs text-muted">{t("dashboard.ordersCount", { count: kpis?.totalOrders ?? 0 })}</div>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
              <div className="text-xs font-semibold text-muted flex items-center justify-between">
                <span>{t("dashboard.grossProfit")}</span>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-fg">{currency(kpis?.grossProfit ?? 0)}</div>
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {kpis?.grossMarginPercent ?? 0}% {t("dashboard.margin")}
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
              <div className="text-xs font-semibold text-muted flex items-center justify-between">
                <span>{t("dashboard.avgOrderValue")}</span>
                <ShoppingCart className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-black text-fg">{currency(kpis?.avgOrderValue ?? 0)}</div>
              <div className="text-xs text-muted">{t("dashboard.cancelledOrders")}: {kpis?.cancelledOrders ?? 0}</div>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
              <div className="text-xs font-semibold text-muted flex items-center justify-between">
                <span>{t("dashboard.newCustomers")}</span>
                <Users className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-fg">{nf.format(kpis?.newCustomers ?? 0)}</div>
              <div className="text-xs text-muted">{t("dashboard.newCustomersPeriod")}</div>
            </div>
          </div>

          {/* Payment KPIs Grid (Task 4) */}
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-fg flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-accent" />
              <span>{tPayKpis("title")}</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
                <div className="text-xs font-semibold text-muted">{tPayKpis("totalCollected")}</div>
                <div className="text-2xl font-black text-emerald-500">{currency(totalCollected)}</div>
              </div>
              <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
                <div className="text-xs font-semibold text-muted">{tPayKpis("totalPending")}</div>
                <div className="text-2xl font-black text-amber-500">{currency(totalPending)}</div>
              </div>
              <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
                <div className="text-xs font-semibold text-muted">{tPayKpis("refunded")}</div>
                <div className="text-2xl font-black text-purple-500">{currency(refunded)}</div>
              </div>
              <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
                <div className="text-xs font-semibold text-muted">{tPayKpis("codOrders")}</div>
                <div className="text-2xl font-black text-fg">{nf.format(codCount)}</div>
              </div>
            </div>

            {/* Payment Method Breakdown Table */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h3 className="text-lg font-bold text-fg">{tPayKpis("byMethod.title")}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-start text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted text-xs">
                      <th className="py-2.5 text-start font-semibold">{tPayKpis("byMethod.method")}</th>
                      <th className="py-2.5 text-end font-semibold">{tPayKpis("byMethod.count")}</th>
                      <th className="py-2.5 text-end font-semibold">{tPayKpis("byMethod.total")}</th>
                      <th className="py-2.5 text-end font-semibold">{tPayKpis("byMethod.avgOrderValue")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {Object.keys(methodMap).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-muted">{tPayKpis("empty")}</td>
                      </tr>
                    ) : (
                      Object.entries(methodMap).map(([method, stats]) => (
                        <tr key={method} className="hover:bg-bg/50">
                          <td className="py-3 font-semibold uppercase text-fg">{method}</td>
                          <td className="py-3 text-end font-mono" dir="ltr">{nf.format(stats.count)}</td>
                          <td className="py-3 text-end font-bold text-fg" dir="ltr">{currency(stats.total)}</td>
                          <td className="py-3 text-end font-mono text-muted" dir="ltr">{currency(stats.count > 0 ? stats.total / stats.count : 0)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Top Products & Sales by Branch */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-bold text-fg">{t("dashboard.topProducts")}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-start text-sm">
                  <thead>
<tr className="border-b border-border text-muted text-xs">
                      <th className="py-2.5 text-start font-semibold">{t("dashboard.codeName")}</th>
                      <th className="py-2.5 text-end font-semibold">{t("dashboard.units")}</th>
                      <th className="py-2.5 text-end font-semibold">{t("dashboard.revenue")}</th>
                      <th className="py-2.5 text-end font-semibold">{t("dashboard.profit")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {data.topProducts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-muted">{t("dashboard.emptyTopProducts")}</td>
                      </tr>
                    ) : (
                      data.topProducts.map((p) => (
                        <tr key={p.productId} className="hover:bg-accent/5">
                          <td className="py-3">
                            <div className="font-bold text-fg">{p.name}</div>
                            <div className="text-xs text-muted">{p.code}</div>
                          </td>
                          <td className="py-3 text-end font-semibold">{nf.format(p.unitsSold)}</td>
                          <td className="py-3 text-end font-semibold">{currency(p.revenue)}</td>
                          <td className="py-3 text-end font-semibold text-emerald-600 dark:text-emerald-400">
                            {currency(p.profit)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sales by Branch */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-bold text-fg">{t("dashboard.salesByBranch")}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-start text-sm">
                  <thead>
<tr className="border-b border-border text-muted text-xs">
                      <th className="py-2.5 text-start font-semibold">{t("dashboard.branch")}</th>
                      <th className="py-2.5 text-end font-semibold">{t("dashboard.orders")}</th>
                      <th className="py-2.5 text-end font-semibold">{t("dashboard.revenue")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {data.salesByBranch.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-muted">{t("dashboard.emptyBranchSales")}</td>
                      </tr>
                    ) : (
                      data.salesByBranch.map((b) => (
                        <tr key={b.branchId} className="hover:bg-accent/5">
                          <td className="py-3 font-bold text-fg">{t("dashboard.branch")}: {b.branchName}</td>
                          <td className="py-3 text-end font-semibold">{t("dashboard.orders")}: {nf.format(b.orderCount ?? 0)}</td>
                          <td className="py-3 text-end font-semibold">{t("dashboard.revenue")}: {currency(b.revenue ?? 0)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
