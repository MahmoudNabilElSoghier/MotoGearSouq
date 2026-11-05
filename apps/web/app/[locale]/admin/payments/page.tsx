"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { getPaymentTransactions, type PaymentTransactionPage, type PaymentTransactionItem } from "@motogearsouq/api-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { exportToCsv } from "@/lib/export-csv";
import { Loader2, Download, CreditCard, ArrowLeft, ArrowRight } from "lucide-react";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400",
  success: "bg-emerald-500/15 text-emerald-400",
  failed: "bg-red-500/15 text-red-400",
  refunded: "bg-purple-500/15 text-purple-400",
};

const providerLabels: Record<string, string> = {
  mock: "Mock Payment",
  paymob: "Paymob",
  fawry: "Fawry",
  instapay: "InstaPay",
  manual: "Manual",
};

const methodLabels: Record<string, string> = {
  cod: "Cash on Delivery",
  cash: "Cash",
  card: "Credit Card",
};

export default function AdminPaymentsPage() {
  const t = useTranslations("admin.payments");
  const locale = useLocale();
  const isAr = locale === "ar";
  const nf = new Intl.NumberFormat(isAr ? "ar-EG-u-nu-latn" : "en-US");
  const formatEgp = (val: number) => `${nf.format(val)} EGP`;

  const [pageData, setPageData] = useState<PaymentTransactionPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [providerFilter, setProviderFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPaymentTransactions({
        status: statusFilter || undefined,
        provider: providerFilter || undefined,
        page,
        pageSize,
      });
      setPageData(res);
    } catch {
      setPageData(null);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, providerFilter, page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleExportCsv = () => {
    if (!pageData || pageData.items.length === 0) return;
    const headers = {
      id: t("table.id"),
      orderNumber: t("table.orderNumber"),
      provider: t("table.provider"),
      method: t("table.method"),
      amount: t("table.amount"),
      currency: t("table.currency"),
      status: t("table.status"),
      createdAt: t("table.createdAt"),
    };
    const rows = pageData.items.map((item: PaymentTransactionItem) => ({
      id: item.id,
      orderNumber: item.order?.orderNumber ?? item.orderId,
      provider: providerLabels[item.provider] ?? item.provider,
      method: methodLabels[item.method] ?? item.method,
      amount: item.amount,
      currency: item.currency,
      status: t(`statuses.${item.status}`) ?? item.status,
      createdAt: item.createdAt,
    }));
    exportToCsv(`payments-export-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-fg flex items-center gap-2">
          <CreditCard className="w-7 h-7 text-accent" />
          <span>{t("title")}</span>
        </h1>
        <Button variant="secondary" onClick={handleExportCsv} className="inline-flex items-center gap-2">
          <Download className="w-4 h-4" />
          <span>{t("exportCsv")}</span>
        </Button>
      </div>

      {/* Filters row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 rounded-xl border border-border bg-card p-4">
        <div>
          <label className="block text-xs font-semibold text-muted mb-1">{t("filters.status")}</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
          >
            <option value="">{t("filters.all")}</option>
            <option value="pending">{t("statuses.pending")}</option>
            <option value="success">{t("statuses.success")}</option>
            <option value="failed">{t("statuses.failed")}</option>
            <option value="refunded">{t("statuses.refunded")}</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted mb-1">{t("filters.provider")}</label>
          <select
            value={providerFilter}
            onChange={(e) => {
              setProviderFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
          >
            <option value="">{t("filters.all")}</option>
            <option value="mock">{t("providers.mock")}</option>
            <option value="paymob">{t("providers.paymob")}</option>
            <option value="fawry">{t("providers.fawry")}</option>
            <option value="instapay">{t("providers.instapay")}</option>
            <option value="manual">{t("providers.manual")}</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted mb-1">{t("filters.dateFrom")}</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted mb-1">{t("filters.dateTo")}</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
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
                <tr className="border-b border-border text-muted text-xs">
                  <th className="px-5 py-3 font-semibold text-start">{t("table.date")}</th>
                  <th className="px-5 py-3 font-semibold text-start">{t("table.orderNumber")}</th>
                  <th className="px-5 py-3 font-semibold text-start">{t("table.provider")}</th>
                  <th className="px-5 py-3 font-semibold text-start">{t("table.method")}</th>
                  <th className="px-5 py-3 font-semibold text-start">{t("table.amount")}</th>
                  <th className="px-5 py-3 font-semibold text-start">{t("table.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {pageData.items.map((item: PaymentTransactionItem) => (
                  <tr key={item.id} className="hover:bg-bg/50 transition-colors">
                    <td className="px-5 py-3 text-muted text-xs" dir="ltr">
                      {new Date(item.createdAt).toLocaleString(isAr ? "ar-EG" : "en-US")}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/${locale}/admin/orders/${item.orderId}`}
                        className="font-mono text-xs font-bold text-accent hover:underline"
                        dir="ltr"
                      >
                        {item.order?.orderNumber ?? item.orderId.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-5 py-3 capitalize text-fg font-medium">{providerLabels[item.provider] ?? item.provider}</td>
                    <td className="px-5 py-3 uppercase text-xs font-semibold text-muted">{methodLabels[item.method] ?? item.method}</td>
                    <td className="px-5 py-3 font-bold text-fg" dir="ltr">
                      {formatEgp(item.amount)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[item.status] ?? "bg-bg text-muted"}`}>
                        {t(`statuses.${item.status}`) ?? item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
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
                className="inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3 h-3" />
                {t("pagination.prev")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= pageData.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1.5"
              >
                {t("pagination.next")}
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
