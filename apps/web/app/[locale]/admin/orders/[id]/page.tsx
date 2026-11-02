"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getOrderById, updateOrderStatus, type OrderStatusUpdate } from "@motogearsouq/api-client";
import type { Order } from "@motogearsouq/shared";
import { Button } from "@/components/ui/Button";
import { Loader2, ArrowLeft, ArrowRight, Printer, CheckCircle2, AlertCircle } from "lucide-react";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  confirmed: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  shipped: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  delivered: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
};

const validTransitions: Record<string, OrderStatusUpdate[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

type OrderItemView = {
  name?: string;
  product?: { name?: string; code?: string };
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export default function AdminOrderDetailPage({ params }: PageProps) {
  const { locale, id } = use(params);
  const t = useTranslations("admin.orders.detail");
  const tDash = useTranslations("admin.dashboard");
  const isAr = locale === "ar";
  const nf = new Intl.NumberFormat(isAr ? "ar-EG-u-nu-latn" : "en-US");
  const formatEgp = (val: number) => `${nf.format(val)} EGP`;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [targetStatus, setTargetStatus] = useState<OrderStatusUpdate | "">("");
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await getOrderById(id);
      setOrder(res);
      if (res) {
        const allowed = validTransitions[res.status] || [];
        if (allowed.length > 0) {
          setTargetStatus(allowed[0]);
        } else {
          setTargetStatus("");
        }
      }
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleUpdateStatus = async () => {
    if (!targetStatus || !order) return;
    setUpdating(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await updateOrderStatus(order.id, targetStatus as OrderStatusUpdate);
      setSuccessMsg(t("statusActions.success"));
      await fetchOrder();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      setErrorMsg(msg || t("statusActions.error"));
    } finally {
      setUpdating(false);
    }
  };

  const statusLabels: Record<string, string> = {
    pending: tDash("statusPending"),
    confirmed: tDash("statusConfirmed"),
    shipped: tDash("statusShipped"),
    delivered: tDash("statusDelivered"),
    cancelled: tDash("statusCancelled"),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center text-muted">
        <p>Order not found</p>
        <Button variant="secondary" className="mt-4" asChild>
          <Link href={`/${locale}/admin/orders`}>Back to orders</Link>
        </Button>
      </div>
    );
  }

  const allowedTransitions = validTransitions[order.status] || [];

  return (
    <div className="space-y-8 print:space-y-4">
      {/* Top bar (hidden in print) */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href={`/${locale}/admin/orders`}
          className="inline-flex items-center gap-2 font-semibold text-accent hover:underline"
        >
          {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{isAr ? "العودة للطلبات" : "Back to orders"}</span>
        </Link>
        <Button variant="secondary" size="sm" onClick={() => window.print()} className="inline-flex items-center gap-2">
          <Printer className="w-4 h-4" />
          <span>{t("print")}</span>
        </Button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400 print:hidden">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-sm">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 print:hidden">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{errorMsg}</p>
        </div>
      )}

      {/* Main Order Card */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6 print:border-0 print:p-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="text-sm text-muted">{t("title")}</p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-fg" dir="ltr">
              {order.orderNumber}
            </h1>
            <p className="mt-1 text-xs text-muted">
              {t("timeline")}: <span dir="ltr">{new Date(order.createdAt).toLocaleString()}</span>
            </p>
          </div>
          <div>
            <span className={`inline-block rounded-full border px-4 py-1.5 text-sm font-bold ${statusStyles[order.status] ?? "bg-card text-muted"}`}>
              {statusLabels[order.status] ?? order.status}
            </span>
          </div>
        </div>

        {/* Status Update Control (hidden in print) */}
        {allowedTransitions.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-bg p-4 print:hidden">
            <span className="text-sm font-semibold text-fg">{t("statusActions.label")}:</span>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as OrderStatusUpdate)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
            >
              {allowedTransitions.map((st) => (
                <option key={st} value={st}>
                  {statusLabels[st] ?? st}
                </option>
              ))}
            </select>
            <Button
              variant="primary"
              size="sm"
              disabled={updating || !targetStatus}
              onClick={handleUpdateStatus}
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : t("statusActions.update")}
            </Button>
          </div>
        )}

        {/* Customer & Shipping Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-bg p-5 space-y-2">
            <h2 className="font-bold text-fg border-b border-border pb-2">{t("customer")}</h2>
            <p className="text-sm"><span className="text-muted">Name:</span> {order.customer?.name ?? "—"}</p>
            <p className="text-sm" dir="ltr"><span className="text-muted">Phone:</span> {order.customer?.phone ?? "—"}</p>
            {order.customer?.email && (
              <p className="text-sm" dir="ltr"><span className="text-muted">Email:</span> {order.customer.email}</p>
            )}
          </div>

          <div className="rounded-xl border border-border/60 bg-bg p-5 space-y-2">
            <h2 className="font-bold text-fg border-b border-border pb-2">{t("shipping")}</h2>
            <p className="text-sm"><span className="text-muted">Address:</span> {order.shippingAddress ?? "—"}</p>
            <p className="text-sm"><span className="text-muted">City / Governorate:</span> {[order.shippingCity, order.shippingGovernorate].filter(Boolean).join(", ") || "—"}</p>
            <p className="text-sm" dir="ltr"><span className="text-muted">Shipping Phone:</span> {order.shippingPhone ?? "—"}</p>
          </div>
        </div>

        {order.notes && (
          <div className="rounded-xl border border-border/60 bg-bg p-4 text-sm">
            <span className="font-bold text-fg">{t("notes")}:</span> <span className="text-muted">{order.notes}</span>
          </div>
        )}

        {/* Items Table */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-fg">{t("items")}</h2>
          <div className="overflow-hidden rounded-xl border border-border bg-bg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="px-4 py-3 font-medium text-start">Product</th>
                  <th className="px-4 py-3 font-medium text-start">Code</th>
                  <th className="px-4 py-3 font-medium text-start">Qty</th>
                  <th className="px-4 py-3 font-medium text-start">Unit Price</th>
                  <th className="px-4 py-3 font-medium text-end">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {((order.items ?? []) as OrderItemView[]).map((item, idx) => (
                  <tr key={idx} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-3 font-semibold text-fg">{item.product?.name ?? item.name ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted" dir="ltr">{item.product?.code ?? "—"}</td>
                    <td className="px-4 py-3 text-fg" dir="ltr">{nf.format(item.quantity)}</td>
                    <td className="px-4 py-3 text-fg" dir="ltr">{formatEgp(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-end font-bold text-fg" dir="ltr">{formatEgp(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end pt-4 border-t border-border">
          <div className="w-full sm:w-80 space-y-2 text-sm">
            <div className="flex justify-between text-muted">
              <span>{t("subtotal")}</span>
              <span className="font-semibold text-fg" dir="ltr">{formatEgp(order.subtotal ?? order.total)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>{t("tax")} (14%)</span>
              <span className="font-semibold text-fg" dir="ltr">{formatEgp(order.taxAmount ?? 0)}</span>
            </div>
            <div className="flex justify-between text-lg font-extrabold text-fg border-t border-border pt-2">
              <span>{t("total")}</span>
              <span className="text-accent" dir="ltr">{formatEgp(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
