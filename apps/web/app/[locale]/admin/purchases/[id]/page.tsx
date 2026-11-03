"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  getPurchaseById,
  updatePurchaseStatus,
  type PurchaseOrderDetail,
  type PurchaseStatus,
} from "@motogearsouq/api-client";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { FormBanner } from "@/components/admin/FormBanner";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, ArrowRight, Loader2, PackageCheck, XCircle } from "lucide-react";

const statusStyles: Record<string, string> = {
  draft: "bg-bg text-muted border border-border",
  ordered: "bg-sky-500/15 text-sky-400",
  shipped: "bg-violet-500/15 text-violet-400",
  received: "bg-emerald-500/15 text-emerald-400",
  cancelled: "bg-red-500/15 text-red-400",
};

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default function PurchaseDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const t = useTranslations("admin.purchases");
  const locale = useLocale();
  const isAr = locale === "ar";
  const nf = new Intl.NumberFormat(isAr ? "ar-EG-u-nu-latn" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const [purchase, setPurchase] = useState<PurchaseOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<PurchaseStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchPurchase = useCallback(async () => {
    try {
      const data = await getPurchaseById(id);
      setPurchase(data);
    } catch {
      setPurchase(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPurchase();
  }, [fetchPurchase]);

  const confirmAction = async () => {
    if (!action) return;
    setSaving(true);
    setBanner(null);
    try {
      await updatePurchaseStatus(id, action);
      setBanner({
        type: "success",
        message:
          action === "received"
            ? t("receivedOk")
            : t("cancelledOk"),
      });
      await fetchPurchase();
    } catch (err) {
      setBanner({
        type: "error",
        message: err instanceof Error && err.message ? err.message : t("form.saveError"),
      });
    } finally {
      setSaving(false);
      setAction(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="p-8 text-center text-muted">
        {t("notFound")}
        <div className="mt-4">
          <Link href={`/${locale}/admin/purchases`} className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" />
            {t("backToList")}
          </Link>
        </div>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    draft: t("status.draft"),
    ordered: t("status.ordered"),
    shipped: t("status.shipped"),
    received: t("status.received"),
    cancelled: t("status.cancelled"),
  };

  const actionable = purchase.status !== "received" && purchase.status !== "cancelled";
  const subtotal = Number(purchase.subtotal);
  const taxAmount = Number(purchase.taxAmount);
  const shippingCost = Number(purchase.shippingCost);
  const customsCost = Number(purchase.customsCost);
  const total = Number(purchase.total);

  return (
    <div className="space-y-6">
      {banner && <FormBanner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={`/${locale}/admin/purchases`}
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg transition-colors mb-2"
          >
            <ArrowRight className={`w-4 h-4 ${isAr ? "" : "rotate-180"}`} />
            {t("backToList")}
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-fg" dir="ltr">
              {purchase.orderNumber}
            </h1>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                statusStyles[purchase.status] ?? "bg-bg text-muted"
              }`}
            >
              {statusLabels[purchase.status] ?? purchase.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {t("detail.supplier")}: {purchase.supplier.nameAr || purchase.supplier.name} · {t("detail.branch")}:{" "}
            {purchase.branch.nameAr}
          </p>
          <p className="mt-1 text-xs text-muted" dir="ltr">
            {t("detail.created")}: {new Date(purchase.createdAt).toLocaleString(isAr ? "ar-EG" : "en-US")}
            {purchase.receivedAt
              ? ` · ${t("detail.receivedAt")}: ${new Date(purchase.receivedAt).toLocaleString(isAr ? "ar-EG" : "en-US")}`
              : ""}
            {purchase.expectedDeliveryDate
              ? ` · ${t("detail.expected")}: ${new Date(purchase.expectedDeliveryDate).toLocaleDateString(isAr ? "ar-EG" : "en-US")}`
              : ""}
          </p>
        </div>

        {actionable && (
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={saving}
              onClick={() => setAction("received")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <PackageCheck className="w-4 h-4 me-1" />
              {t("detail.markReceived")}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={saving}
              onClick={() => setAction("cancelled")}
              className="text-red-400 border-red-500/30 hover:bg-red-500/10"
            >
              <XCircle className="w-4 h-4 me-1" />
              {t("detail.cancelPo")}
            </Button>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-bold text-fg">{t("detail.itemsTitle")}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="px-5 py-3 font-medium text-start">{t("table.product")}</th>
                <th className="px-5 py-3 font-medium text-start">{t("table.qty")}</th>
                <th className="px-5 py-3 font-medium text-start">{t("table.unitCost")}</th>
                <th className="px-5 py-3 font-medium text-start">{t("table.lineTotal")}</th>
              </tr>
            </thead>
            <tbody>
              {purchase.items.map((item) => (
                <tr key={item.id} className="border-b border-border/50 last:border-0">
                  <td className="px-5 py-3 text-fg">
                    {item.product ? item.product.name : item.productId}
                    {item.product && (
                      <span className="ms-2 font-mono text-xs text-muted" dir="ltr">
                        {item.product.code}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-fg" dir="ltr">
                    {nf.format(item.quantity).replace(/\.00$/, "")}
                  </td>
                  <td className="px-5 py-3 text-fg" dir="ltr">
                    {nf.format(Number(item.unitCost))}
                  </td>
                  <td className="px-5 py-3 font-semibold text-fg" dir="ltr">
                    {nf.format(Number(item.lineTotal))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t border-border px-5 py-4 space-y-2 text-sm">
          <div className="flex justify-between text-muted">
            <span>{t("detail.subtotal")}</span>
            <span dir="ltr">{nf.format(subtotal)}</span>
          </div>
          {taxAmount > 0 && (
            <div className="flex justify-between text-muted">
              <span>{t("detail.tax")}</span>
              <span dir="ltr">{nf.format(taxAmount)}</span>
            </div>
          )}
          {shippingCost > 0 && (
            <div className="flex justify-between text-muted">
              <span>{t("detail.shipping")}</span>
              <span dir="ltr">{nf.format(shippingCost)}</span>
            </div>
          )}
          {customsCost > 0 && (
            <div className="flex justify-between text-muted">
              <span>{t("detail.customs")}</span>
              <span dir="ltr">{nf.format(customsCost)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2 font-bold text-fg">
            <span>{t("detail.total")}</span>
            <span dir="ltr">{nf.format(total)}</span>
          </div>
        </div>
      </div>

      {/* Stock movements created by this PO */}
      {purchase.stockMovements.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-bold text-fg">{t("detail.movementsTitle")}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="px-5 py-3 font-medium text-start">{t("table.product")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.movementType")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.delta")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.date")}</th>
                </tr>
              </thead>
              <tbody>
                {purchase.stockMovements.map((m) => (
                  <tr key={m.id} className="border-b border-border/50 last:border-0">
                    <td className="px-5 py-3 text-fg">{m.product?.name ?? m.productId}</td>
                    <td className="px-5 py-3 text-fg">{m.type}</td>
                    <td
                      className={`px-5 py-3 font-semibold ${m.quantityDelta >= 0 ? "text-emerald-400" : "text-red-400"}`}
                      dir="ltr"
                    >
                      {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                    </td>
                    <td className="px-5 py-3 text-muted text-xs" dir="ltr">
                      {new Date(m.createdAt).toLocaleString(isAr ? "ar-EG" : "en-US")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {purchase.notes && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-bold text-fg mb-2">{t("detail.notes")}</h2>
          <p className="text-sm text-muted whitespace-pre-wrap">{purchase.notes}</p>
        </div>
      )}

      {action && (
        <ConfirmDialog
          title={
            action === "received"
              ? t("detail.confirmReceivedTitle")
              : t("detail.confirmCancelTitle")
          }
          message={
            action === "received"
              ? t("detail.confirmReceivedMsg")
              : t("detail.confirmCancelMsg")
          }
          isDanger={action === "cancelled"}
          onConfirm={confirmAction}
          onCancel={() => setAction(null)}
        />
      )}
    </div>
  );
}
