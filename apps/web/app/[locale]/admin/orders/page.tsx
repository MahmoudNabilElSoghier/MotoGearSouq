"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { getOrders, type OrderPage } from "@motogearsouq/api-client";
import type { Order } from "@motogearsouq/shared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { exportToCsv } from "@/lib/export-csv";
import { Loader2, Search, Download, Eye } from "lucide-react";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400",
  confirmed: "bg-sky-500/15 text-sky-400",
  shipped: "bg-violet-500/15 text-violet-400",
  delivered: "bg-emerald-500/15 text-emerald-400",
  cancelled: "bg-red-500/15 text-red-400",
};

export default function AdminOrdersPage() {
  const t = useTranslations("admin.orders");
  const tDash = useTranslations("admin.dashboard");
  const locale = useLocale();
  const isAr = locale === "ar";
  const nf = new Intl.NumberFormat(isAr ? "ar-EG-u-nu-latn" : "en-US");
  const formatEgp = (val: number) => `${nf.format(val)} EGP`;

  const [ordersPage, setOrdersPage] = useState<OrderPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("search") ?? "");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrders({
        status: statusFilter || undefined,
        paymentStatus: paymentStatusFilter || undefined,
        paymentMethod: paymentMethodFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        pageSize,
      });
      setOrdersPage(res);
    } catch {
      setOrdersPage(null);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, paymentStatusFilter, paymentMethodFilter, dateFrom, dateTo, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const statusLabels: Record<string, string> = {
    pending: tDash("statusPending"),
    confirmed: tDash("statusConfirmed"),
    shipped: tDash("statusShipped"),
    delivered: tDash("statusDelivered"),
    cancelled: tDash("statusCancelled"),
  };

  const riskLabels: Record<string, string> = {
    low: t("riskLevels.low"),
    medium: t("riskLevels.medium"),
    high: t("riskLevels.high"),
  };

  const paymentMethodLabels: Record<string, string> = {
    cod: t("paymentMethods.cod", { defaultValue: "Cash on Delivery" }),
    cash: t("paymentMethods.cash", { defaultValue: "Cash" }),
    card: t("paymentMethods.card", { defaultValue: "Credit Card" }),
    mock: t("paymentMethods.mock", { defaultValue: "Mock Payment" }),
    paymob: t("paymentMethods.paymob", { defaultValue: "Paymob" }),
    fawry: t("paymentMethods.fawry", { defaultValue: "Fawry" }),
    instapay: t("paymentMethods.instapay", { defaultValue: "InstaPay" }),
  };

  const paymentStatusLabels: Record<string, string> = {
    pending: t("paymentStatuses.pending", { defaultValue: "Pending" }),
    paid: t("paymentStatuses.paid", { defaultValue: "Paid" }),
    unpaid: t("paymentStatuses.unpaid", { defaultValue: "Unpaid" }),
    failed: t("paymentStatuses.failed", { defaultValue: "Failed" }),
    refunded: t("paymentStatuses.refunded", { defaultValue: "Refunded" }),
  };

  const paymentStatusStyles: Record<string, string> = {
    paid: "bg-emerald-500/15 text-emerald-400",
    unpaid: "bg-red-500/15 text-red-400",
    pending: "bg-amber-500/15 text-amber-400",
    failed: "bg-red-500/15 text-red-400",
    refunded: "bg-sky-500/15 text-sky-400",
  };

  const riskBadge = (o: Order) => {
    const level = o.riskLevel ?? "low";
    if (level === "low") return <span className="text-xs text-muted">—</span>;
    const cls =
      level === "high"
        ? "border-red-500/30 bg-red-500/15 text-red-400"
        : "border-amber-500/30 bg-amber-500/15 text-amber-400";
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}
      >
        <span aria-hidden>{level === "high" ? "🔴" : "🟡"}</span>
        {riskLabels[level] ?? level}
        {typeof o.riskScore === "number" && (
          <span className="font-mono text-[10px] opacity-80">{o.riskScore}</span>
        )}
      </span>
    );
  };

  const filteredItems = (ordersPage?.items ?? []).filter((o: Order) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const num = o.orderNumber?.toLowerCase() ?? "";
    const phone = o.customer?.phone ?? "";
    const name = o.customer?.name?.toLowerCase() ?? "";
    return num.includes(q) || phone.includes(q) || name.includes(q);
  });

  const handleExportCsv = () => {
    if (!ordersPage || ordersPage.items.length === 0) return;
    const headers = {
      orderNumber: isAr ? "رقم الطلب" : "Order #",
      customerName: isAr ? "اسم العميل" : "Customer Name",
      phone: isAr ? "الهاتف" : "Phone",
      total: isAr ? "الإجمالي" : "Total",
      status: isAr ? "حالة الطلب" : "Status",
      paymentStatus: isAr ? "حالة الدفع" : "Payment Status",
      paymentMethod: isAr ? "طريقة الدفع" : "Payment Method",
      createdAt: isAr ? "التاريخ" : "Date",
    };
    const rows = ordersPage.items.map((o: Order) => ({
      orderNumber: o.orderNumber,
      customerName: o.customer?.name ?? "",
      phone: o.customer?.phone ?? "",
      total: o.total,
      status: o.status,
      paymentStatus: o.paymentStatus ?? "",
      paymentMethod: o.paymentMethod ?? "",
      createdAt: o.createdAt,
    }));
    exportToCsv(`orders-export-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-fg">{t("title")}</h1>
        <Button variant="secondary" onClick={handleExportCsv} className="inline-flex items-center gap-2">
          <Download className="w-4 h-4" />
          <span>{isAr ? "تصدير CSV" : "Export CSV"}</span>
        </Button>
      </div>

      {/* Filters row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 rounded-xl border border-border bg-card p-4">
        <div>
          <label className="block text-xs font-semibold text-muted mb-1">{isAr ? "بحث" : "Search"}</label>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("filter.searchPlaceholder")}
              className="ps-9"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted mb-1">{isAr ? "حالة الطلب" : "Order Status"}</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
          >
            <option value="">{t("filter.all")}</option>
            <option value="pending">{tDash("statusPending")}</option>
            <option value="confirmed">{tDash("statusConfirmed")}</option>
            <option value="shipped">{tDash("statusShipped")}</option>
            <option value="delivered">{tDash("statusDelivered")}</option>
            <option value="cancelled">{tDash("statusCancelled")}</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted mb-1">{isAr ? "حالة الدفع" : "Payment Status"}</label>
          <select
            value={paymentStatusFilter}
            onChange={(e) => {
              setPaymentStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
          >
            <option value="">{isAr ? "كل حالات الدفع" : "All Payment Statuses"}</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted mb-1">{isAr ? "طريقة الدفع" : "Payment Method"}</label>
          <select
            value={paymentMethodFilter}
            onChange={(e) => {
              setPaymentMethodFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
          >
            <option value="">{isAr ? "كل طرق الدفع" : "All Methods"}</option>
            <option value="cod">COD</option>
            <option value="mock">Mock</option>
            <option value="paymob">Paymob</option>
            <option value="fawry">Fawry</option>
            <option value="instapay">InstaPay</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">{isAr ? "من" : "From"}</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">{isAr ? "إلى" : "To"}</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
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
                <tr className="border-b border-border text-muted text-xs">
                  <th className="px-5 py-3 font-semibold text-start">{t("table.orderNumber")}</th>
                  <th className="px-5 py-3 font-semibold text-start">{t("table.customer")}</th>
                  <th className="px-5 py-3 font-semibold text-start">{t("table.phone")}</th>
                  <th className="px-5 py-3 font-semibold text-start">{t("table.total")}</th>
                  <th className="px-5 py-3 font-semibold text-start">{t("table.status")}</th>
                  <th className="px-5 py-3 font-semibold text-start">{t("riskLabel")}</th>
                  <th className="px-5 py-3 font-semibold text-start">{isAr ? "الدفع" : "Payment"}</th>
                  <th className="px-5 py-3 font-semibold text-start">{t("table.date")}</th>
                  <th className="px-5 py-3 font-semibold text-end">{isAr ? "إجراء" : "Action"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredItems.map((o: Order) => (
                  <tr key={o.id} className="hover:bg-bg/50 transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-accent" dir="ltr">
                      {o.orderNumber}
                    </td>
                    <td className="px-5 py-3 font-medium text-fg">{o.customer?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-muted" dir="ltr">{o.customer?.phone ?? "—"}</td>
                    <td className="px-5 py-3 font-bold text-fg" dir="ltr">
                      {formatEgp(o.total)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[o.status] ?? "bg-bg text-muted"}`}>
                        {statusLabels[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">{riskBadge(o)}</td>
                    <td className="px-5 py-3">
                      <span className="font-medium text-fg">
                        {paymentMethodLabels[o.paymentMethod ?? "cod"] ??
                          o.paymentMethod ??
                          "cod"}
                      </span>
                      <span
                        className={`block text-[10px] font-mono rounded-full px-2.5 py-0.5 ${
                          paymentStatusStyles[o.paymentStatus ?? "pending"] ??
                          "bg-bg text-muted"
                        }`}
                      >
                        {paymentStatusLabels[o.paymentStatus ?? "pending"] ??
                          o.paymentStatus ??
                          "pending"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted text-xs" dir="ltr">
                      {new Date(o.createdAt).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
                    </td>
                    <td className="px-5 py-3 text-end">
                      <Link
                        href={`/${locale}/admin/orders/${o.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-fg hover:border-accent hover:text-accent transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isAr ? "عرض" : "View"}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {ordersPage && ordersPage.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
            <span className="text-muted">
              {t("pagination.page", { page: ordersPage.page, total: ordersPage.totalPages })}
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
                disabled={page >= ordersPage.totalPages}
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
