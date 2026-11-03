"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  getAdminCustomersPending,
  approveCustomer,
  rejectCustomer,
  type AdminCustomerPage,
  type AdminCustomerItem,
} from "@motogearsouq/api-client";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { RejectReasonModal } from "@/components/admin/RejectReasonModal";
import { FormBanner } from "@/components/admin/FormBanner";
import { Loader2, Check, X, Store } from "lucide-react";

type Banner = { type: "success" | "error"; message: string } | null;

function relativeTime(dateStr: string, isAr: boolean): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return isAr ? "الآن" : "Just now";
  if (mins < 60) {
    if (!isAr) return `${mins} min ago`;
    if (mins === 1) return "منذ دقيقة";
    if (mins === 2) return "منذ دقيقتين";
    if (mins <= 10) return `منذ ${mins} دقائق`;
    return `منذ ${mins} دقيقة`;
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    if (!isAr) return `${hours}h ago`;
    if (hours === 1) return "منذ ساعة";
    if (hours === 2) return "منذ ساعتين";
    if (hours <= 10) return `منذ ${hours} ساعات`;
    return `منذ ${hours} ساعة`;
  }
  const days = Math.floor(hours / 24);
  if (days < 30) {
    if (!isAr) return `${days}d ago`;
    if (days === 1) return "أمس";
    if (days === 2) return "منذ يومين";
    if (days <= 10) return `منذ ${days} أيام`;
    return `منذ ${days} يوم`;
  }
  return new Date(dateStr).toLocaleDateString(isAr ? "ar-EG" : "en-US");
}

export default function AdminPendingCustomersPage() {
  const t = useTranslations("admin.customers");
  const tPending = useTranslations("admin.customers.pending");
  const locale = useLocale();
  const isAr = locale === "ar";
  const nf = new Intl.NumberFormat(isAr ? "ar-EG-u-nu-latn" : "en-US");

  const [customerPage, setCustomerPage] = useState<AdminCustomerPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<Banner>(null);
  const [approveTarget, setApproveTarget] = useState<AdminCustomerItem | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminCustomerItem | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminCustomersPending({ pageSize: 50 });
      setCustomerPage(res);
    } catch {
      setCustomerPage(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleApprove = async () => {
    if (!approveTarget) return;
    setActionBusy(true);
    try {
      await approveCustomer(approveTarget.id);
      setBanner({ type: "success", message: t("approve.success") });
      setApproveTarget(null);
      await fetchPending();
    } catch (err) {
      setBanner({ type: "error", message: err instanceof Error ? err.message : "حدث خطأ" });
      setApproveTarget(null);
    } finally {
      setActionBusy(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    setActionBusy(true);
    try {
      await rejectCustomer(rejectTarget.id, reason);
      setBanner({ type: "success", message: t("reject.success") });
      setRejectTarget(null);
      await fetchPending();
    } catch (err) {
      setBanner({ type: "error", message: err instanceof Error ? err.message : "حدث خطأ" });
      setRejectTarget(null);
    } finally {
      setActionBusy(false);
    }
  };

  const items = customerPage?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold text-fg">{tPending("title")}</h1>
          {customerPage && (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-400">
              {tPending("subtitle", { count: nf.format(customerPage.total) })}
            </span>
          )}
        </div>
        <Button asChild size="sm" variant="secondary">
          <Link href={`/${locale}/admin/customers`}>{t("title")}</Link>
        </Button>
      </div>

      {banner && (
        <FormBanner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center space-y-4">
          <Store className="mx-auto h-10 w-10 text-muted/50" />
          <p className="text-muted">{tPending("empty")}</p>
          <Button asChild variant="secondary" size="sm">
            <Link href={`/${locale}/admin/customers`}>{tPending("emptyCta")}</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {items.map((c) => (
            <li key={c.id} className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-fg">{c.name}</p>
                  <p className="mt-0.5 text-sm text-muted" dir="ltr">
                    {c.phone}
                  </p>
                </div>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                  {t("filters.statusPending")}
                </span>
              </div>

              <dl className="space-y-2 rounded-lg bg-bg p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted">{tPending("card.businessName")}</dt>
                  <dd className="font-medium text-fg text-end">{c.businessName ?? "—"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">{tPending("card.taxNumber")}</dt>
                  <dd className="font-medium text-fg" dir="ltr">
                    {c.taxNumber ?? "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">{tPending("card.commercialRegister")}</dt>
                  <dd className="font-medium text-fg" dir="ltr">
                    {c.commercialRegister ?? "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">{tPending("card.appliedAt")}</dt>
                  <dd className="text-muted text-xs">{relativeTime(c.createdAt, isAr)}</dd>
                </div>
              </dl>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectTarget(c)}
                  disabled={actionBusy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  {t("actions.reject")}
                </button>
                <button
                  type="button"
                  onClick={() => setApproveTarget(c)}
                  disabled={actionBusy}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {t("actions.approve")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {approveTarget && (
        <ConfirmDialog
          title={t("approve.title")}
          message={t("approve.message", { name: approveTarget.name })}
          onConfirm={handleApprove}
          onCancel={() => setApproveTarget(null)}
          isDanger={false}
        />
      )}

      <RejectReasonModal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
        customerName={rejectTarget?.name ?? ""}
      />
    </div>
  );
}
