"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  getOrderById,
  updateOrderStatus,
  markOrderPaid,
  refundOrder,
  getPaymentTransactions,
  type OrderStatusUpdate,
  type PaymentTransactionItem,
} from "@motogearsouq/api-client";
import type { Order } from "@motogearsouq/shared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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

type RiskBreakdownView = {
  accountAge?: { score: number; days: number };
  emailVerified?: { score: number; verified: boolean };
  deliveryHistory?: { score: number; successful: number; failed: number };
  orderAmount?: { score: number; total: number; limit: number | null };
  sameIpToday?: { score: number; count: number };
  sameDeviceToday?: { score: number; count: number };
};

export default function AdminOrderDetailPage({ params }: PageProps) {
  const { locale, id } = use(params);
  const t = useTranslations("admin.orders.detail");
  const tRisk = useTranslations("admin.orders.detail.risk");
  const tRiskLevels = useTranslations("admin.orders");
  const tPayment = useTranslations("admin.orders.detail.payment");
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

  const [transactions, setTransactions] = useState<PaymentTransactionItem[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState("");

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

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await getPaymentTransactions({ orderId: id });
      setTransactions(res.items || []);
    } catch {
      setTransactions([]);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
    fetchTransactions();
  }, [fetchOrder, fetchTransactions]);

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

  const handleMarkPaid = async () => {
    setActionLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await markOrderPaid(id);
      setSuccessMsg(isAr ? "تم تحديث حالة الدفع إلى مدفوع" : "Payment marked as paid successfully");
      await fetchOrder();
      await fetchTransactions();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to mark paid");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!refundReason) return;
    setActionLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await refundOrder(id, refundReason);
      setSuccessMsg(isAr ? "تم استرداد المبلغ بنجاح" : "Refund processed successfully");
      setShowRefundModal(false);
      setRefundReason("");
      await fetchOrder();
      await fetchTransactions();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to process refund");
    } finally {
      setActionLoading(false);
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

        {/* Risk Analysis (Sprint 5C-2) */}
        {(order.riskBreakdown != null || (order.riskScore ?? 0) > 0) && (() => {
          const level = order.riskLevel ?? "low";
          const bd = (order.riskBreakdown ?? {}) as RiskBreakdownView;
          const riskLabels: Record<string, string> = {
            low: tRiskLevels("riskLevels.low"),
            medium: tRiskLevels("riskLevels.medium"),
            high: tRiskLevels("riskLevels.high"),
          };
          const levelCls =
            level === "high"
              ? "border-red-500/30 bg-red-500/15 text-red-400"
              : level === "medium"
                ? "border-amber-500/30 bg-amber-500/15 text-amber-400"
                : "border-emerald-500/30 bg-emerald-500/15 text-emerald-400";
          const scoreCls =
            level === "high" ? "text-red-400" : level === "medium" ? "text-amber-400" : "text-emerald-400";
          const rows: { label: string; value: string; score: number; ok?: boolean }[] = [
            {
              label: tRisk("breakdown.accountAge"),
              value: `${nf.format(bd.accountAge?.days ?? 0)} ${isAr ? "يوم" : "days"}`,
              score: bd.accountAge?.score ?? 0,
            },
            {
              label: tRisk("breakdown.emailVerified"),
              value: bd.emailVerified?.verified ? "✓" : "✗",
              score: bd.emailVerified?.score ?? 0,
              ok: bd.emailVerified?.verified,
            },
            {
              label: tRisk("breakdown.deliveryHistory"),
              value: `${nf.format(bd.deliveryHistory?.successful ?? 0)} ✓ / ${nf.format(bd.deliveryHistory?.failed ?? 0)} ✗`,
              score: bd.deliveryHistory?.score ?? 0,
            },
            {
              label: tRisk("breakdown.amountVsLimit"),
              value: `${nf.format(bd.orderAmount?.total ?? order.total)} / ${
                bd.orderAmount?.limit == null ? "∞" : nf.format(bd.orderAmount.limit)
              }`,
              score: bd.orderAmount?.score ?? 0,
            },
            {
              label: tRisk("breakdown.sameIpToday"),
              value: nf.format(bd.sameIpToday?.count ?? 0),
              score: bd.sameIpToday?.score ?? 0,
            },
            {
              label: tRisk("breakdown.sameDeviceToday"),
              value: nf.format(bd.sameDeviceToday?.count ?? 0),
              score: bd.sameDeviceToday?.score ?? 0,
            },
          ];
          return (
            <div className="rounded-xl border border-border bg-bg p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                <h2 className="text-lg font-bold text-fg">{tRisk("title")}</h2>
                <div className="flex items-center gap-3">
                  <div className="text-end">
                    <p className="text-[10px] uppercase text-muted">{tRisk("score")}</p>
                    <p className={`text-3xl font-extrabold leading-none ${scoreCls}`} dir="ltr">
                      {order.riskScore ?? 0}
                    </p>
                  </div>
                  <div className="text-end space-y-1">
                    <p className="text-[10px] uppercase text-muted">{tRisk("level")}</p>
                    <span className={`inline-block rounded-full border px-3 py-1 text-xs font-bold ${levelCls}`}>
                      {riskLabels[level] ?? level}
                    </span>
                  </div>
                </div>
              </div>

              {level === "high" && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400">
                  <span aria-hidden>🔴</span>
                  {tRisk("flagged")}
                </div>
              )}

              <div className="overflow-hidden rounded-lg border border-border/60">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted text-xs">
                      <th className="px-4 py-2.5 font-semibold text-start">{tRisk("breakdownTitle")}</th>
                      <th className="px-4 py-2.5 font-semibold text-start">{isAr ? "القيمة" : "Value"}</th>
                      <th className="px-4 py-2.5 font-semibold text-end">{tRisk("score")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {rows.map((row) => (
                      <tr key={row.label}>
                        <td className="px-4 py-2.5 text-muted">{row.label}</td>
                        <td
                          className={`px-4 py-2.5 font-semibold ${
                            row.ok === false ? "text-red-400" : row.ok === true ? "text-emerald-400" : "text-fg"
                          }`}
                          dir="ltr"
                        >
                          {row.value}
                        </td>
                        <td className="px-4 py-2.5 text-end font-mono text-xs text-fg" dir="ltr">
                          {row.score > 0 ? `+${row.score}` : row.score}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted">{tRisk("ipAddress")}</p>
                  <p className="font-mono text-fg" dir="ltr">{order.ipAddress ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">{tRisk("userAgent")}</p>
                  <p className="font-mono text-fg" dir="ltr">
                    {order.userAgentHash ? `${order.userAgentHash.slice(0, 16)}…` : "—"}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Payment Section (Task 3) */}
        <div className="rounded-xl border border-border bg-bg p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <h2 className="text-lg font-bold text-fg">{tPayment("title")}</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">{tPayment("status")}:</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                order.paymentStatus === "paid" ? "bg-emerald-500/15 text-emerald-400" :
                order.paymentStatus === "refunded" ? "bg-purple-500/15 text-purple-400" :
                order.paymentStatus === "failed" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"
              }`}>
                {order.paymentStatus ?? "pending"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted">{tPayment("method")}</p>
              <p className="font-semibold text-fg uppercase">{order.paymentMethod ?? "cod"}</p>
            </div>
            <div>
              <p className="text-xs text-muted">{tPayment("amount")}</p>
              <p className="font-bold text-fg" dir="ltr">{formatEgp(order.total)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">{tPayment("paidAt")}</p>
              <p className="text-fg" dir="ltr">
                {order.paymentStatus === "paid" ? new Date(order.updatedAt).toLocaleString() : "—"}
              </p>
            </div>
          </div>

          {/* Admin Payment Actions (hidden in print) */}
          <div className="flex flex-wrap items-center gap-3 pt-2 print:hidden">
            {order.paymentStatus === "pending" && (
              <Button
                variant="primary"
                size="sm"
                disabled={actionLoading}
                onClick={handleMarkPaid}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : tPayment("markPaid")}
              </Button>
            )}

            {order.paymentStatus === "paid" && (
              <Button
                variant="secondary"
                size="sm"
                disabled={actionLoading}
                onClick={() => setShowRefundModal(true)}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                {tPayment("refund")}
              </Button>
            )}
          </div>

          {/* Transactions Timeline */}
          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-fg mb-3">{tPayment("transactions")}</h3>
            {transactions.length === 0 ? (
              <p className="text-xs text-muted">{tPayment("noTransactions")}</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx: PaymentTransactionItem) => (
                  <div key={tx.id} className="flex flex-wrap items-center justify-between rounded-lg border border-border bg-card p-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold uppercase text-fg">{tx.provider}</span>
                        <span className="rounded bg-bg px-2 py-0.5 uppercase text-[10px] text-muted">{tx.method}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          tx.status === "success" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                        }`}>{tx.status}</span>
                      </div>
                      <p className="text-muted" dir="ltr">Ref: {tx.providerRef ?? "N/A"}</p>
                    </div>
                    <div className="text-end">
                      <p className="font-bold text-fg" dir="ltr">{formatEgp(tx.amount)}</p>
                      <p className="text-[10px] text-muted" dir="ltr">{new Date(tx.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Refund Modal */}
        {showRefundModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:hidden">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xl">
              <h3 className="text-lg font-bold text-fg">{tPayment("refund")}</h3>
              <p className="text-sm text-muted">{tPayment("refundConfirm")}</p>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">{tPayment("refundReason")}</label>
                <Input
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder={isAr ? "سبب الاسترداد..." : "Reason for refund..."}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setShowRefundModal(false)}>
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  variant="primary"
                  disabled={actionLoading || !refundReason}
                  onClick={handleRefund}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : tPayment("refund")}
                </Button>
              </div>
            </div>
          </div>
        )}

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
