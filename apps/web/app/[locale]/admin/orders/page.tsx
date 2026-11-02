"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getOrders, type OrderPage } from "@motogearsouq/api-client";
import type { Order } from "@motogearsouq/shared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, Search } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrders({
        status: statusFilter || undefined,
        page,
        pageSize,
      });
      setOrdersPage(res);
    } catch {
      setOrdersPage(null);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

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

  const filteredItems = (ordersPage?.items ?? []).filter((o: Order) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const num = o.orderNumber?.toLowerCase() ?? "";
    const phone = o.customer?.phone ?? o.shippingPhone ?? "";
    const name = o.customer?.name?.toLowerCase() ?? "";
    return num.includes(q) || phone.includes(q) || name.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-fg">{t("title")}</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("filter.searchPlaceholder")}
              className="ps-9"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
          >
            <option value="">{t("filter.all")}</option>
            <option value="pending">{tDash("statusPending")}</option>
            <option value="confirmed">{tDash("statusConfirmed")}</option>
            <option value="shipped">{tDash("statusShipped")}</option>
            <option value="delivered">{tDash("statusDelivered")}</option>
            <option value="cancelled">{tDash("statusCancelled")}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : !ordersPage || filteredItems.length === 0 ? (
          <p className="p-8 text-center text-muted">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="px-5 py-3 font-medium text-start">{t("table.orderNumber")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.customer")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.phone")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.total")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.status")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.date")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((order: Order) => (
                  <tr
                    key={order.id}
                    onClick={() => window.location.href = `/${locale}/admin/orders/${order.id}`}
                    className="border-b border-border/50 last:border-0 cursor-pointer hover:bg-bg/50 transition-colors"
                  >
                    <td className="px-5 py-3 font-mono text-xs font-bold text-accent" dir="ltr">
                      {order.orderNumber}
                    </td>
                    <td className="px-5 py-3 text-fg">{order.customer?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-fg" dir="ltr">
                      {order.customer?.phone ?? order.shippingPhone ?? "—"}
                    </td>
                    <td className="px-5 py-3 font-semibold text-fg" dir="ltr">
                      {formatEgp(order.total)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          statusStyles[order.status] ?? "bg-bg text-muted"
                        }`}
                      >
                        {statusLabels[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted text-xs" dir="ltr">
                      {new Date(order.createdAt).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
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
