"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  getAdminCustomers,
  approveCustomer,
  rejectCustomer,
  blockCustomer,
  unblockCustomer,
  type AdminCustomerPage,
  type AdminCustomerItem,
} from "@motogearsouq/api-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { RejectReasonModal } from "@/components/admin/RejectReasonModal";
import { BlockCustomerModal } from "@/components/admin/BlockCustomerModal";
import { FormBanner } from "@/components/admin/FormBanner";
import { Loader2, Search, Eye, Check, X, Ban, LockOpen, User, ArrowLeft, ArrowRight } from "lucide-react";

type Banner = { type: "success" | "error"; message: string } | null;

export default function AdminCustomersPage() {
  const t = useTranslations("admin.customers");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const isAr = locale === "ar";
  const nf = new Intl.NumberFormat(isAr ? "ar-EG-u-nu-latn" : "en-US");

  const [customerPage, setCustomerPage] = useState<AdminCustomerPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [banner, setBanner] = useState<Banner>(null);
  const [approveTarget, setApproveTarget] = useState<AdminCustomerItem | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminCustomerItem | null>(null);
  const [blockTarget, setBlockTarget] = useState<AdminCustomerItem | null>(null);
  const [unblockTarget, setUnblockTarget] = useState<AdminCustomerItem | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const pageSize = 20;

  // Debounced server-side search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminCustomers({
        customerType: typeFilter || undefined,
        approvalStatus: statusFilter || undefined,
        search: search || undefined,
        page,
        pageSize,
      });
      setCustomerPage(res);
    } catch {
      setCustomerPage(null);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, search, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const hasFilters = !!typeFilter || !!statusFilter || !!search;

  const clearFilters = () => {
    setTypeFilter("");
    setStatusFilter("");
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const handleApprove = async () => {
    if (!approveTarget) return;
    setActionBusy(true);
    try {
      await approveCustomer(approveTarget.id);
      setBanner({ type: "success", message: t("approve.success") });
      setApproveTarget(null);
      await fetchCustomers();
    } catch (err) {
      setBanner({ type: "error", message: err instanceof Error ? err.message : tCommon("errorGeneric") });
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
      await fetchCustomers();
    } catch (err) {
      setBanner({ type: "error", message: err instanceof Error ? err.message : tCommon("errorGeneric") });
      setRejectTarget(null);
    } finally {
      setActionBusy(false);
    }
  };

  const handleBlock = async (reason: string) => {
    if (!blockTarget) return;
    setActionBusy(true);
    try {
      await blockCustomer(blockTarget.id, reason);
      setBanner({ type: "success", message: t("block.success") });
      setBlockTarget(null);
      await fetchCustomers();
    } catch (err) {
      setBanner({ type: "error", message: err instanceof Error ? err.message : tCommon("errorGeneric") });
      setBlockTarget(null);
    } finally {
      setActionBusy(false);
    }
  };

  const handleUnblock = async () => {
    if (!unblockTarget) return;
    setActionBusy(true);
    try {
      await unblockCustomer(unblockTarget.id);
      setBanner({ type: "success", message: t("unblock.success") });
      setUnblockTarget(null);
      await fetchCustomers();
    } catch (err) {
      setBanner({ type: "error", message: err instanceof Error ? err.message : tCommon("errorGeneric") });
      setUnblockTarget(null);
    } finally {
      setActionBusy(false);
    }
  };

  const typeBadge = (customerType: string) =>
    customerType === "wholesale" ? (
      <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2.5 py-0.5 text-xs font-semibold text-violet-400">
        {t("table.badgeWholesale")}
      </span>
    ) : (
      <span className="rounded-full border border-border bg-bg px-2.5 py-0.5 text-xs font-semibold text-muted">
        {t("table.badgeRetail")}
      </span>
    );

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "border-amber-500/30 bg-amber-500/15 text-amber-400",
      approved: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
      rejected: "border-red-500/30 bg-red-500/15 text-red-400",
    };
    const labels: Record<string, string> = {
      pending: t("filters.statusPending"),
      approved: t("filters.statusApproved"),
      rejected: t("filters.statusRejected"),
    };
    return (
      <span
        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[status] ?? "border-border bg-bg text-muted"}`}
      >
        {labels[status] ?? status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold text-fg">{t("title")}</h1>
          {customerPage && (
            <span className="rounded-full border border-border bg-card px-3 py-1 text-sm font-semibold text-muted">
              {t("subtitle", { count: nf.format(customerPage.total) })}
            </span>
          )}
        </div>
        <Button asChild size="sm" variant="secondary" className="inline-flex items-center gap-1.5">
          <Link href={`/${locale}/admin/customers/pending`}>
            <User className="w-3.5 h-3.5" />
            {t("pending.title")}
          </Link>
        </Button>
      </div>

      {banner && (
        <FormBanner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 rounded-xl border border-border bg-card p-4">
        <div>
          <label className="block text-xs font-semibold text-muted mb-1">{t("filters.type")}</label>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
          >
            <option value="">{t("filters.all")}</option>
            <option value="retail">{t("filters.typeRetail")}</option>
            <option value="wholesale">{t("filters.typeWholesale")}</option>
          </select>
        </div>

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
            <option value="pending">{t("filters.statusPending")}</option>
            <option value="approved">{t("filters.statusApproved")}</option>
            <option value="rejected">{t("filters.statusRejected")}</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-muted mb-1">{t("filters.search")}</label>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("filters.searchPlaceholder")}
              className="ps-9"
            />
          </div>
        </div>
      </div>

      {hasFilters && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={clearFilters} className="inline-flex items-center gap-1.5">
            <X className="w-3.5 h-3.5" />
            {t("filters.clearAll")}
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : !customerPage || customerPage.items.length === 0 ? (
          <p className="p-8 text-center text-muted">
            {hasFilters ? t("emptyFiltered") : t("empty")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted text-xs">
                  <th className="px-5 py-3 font-semibold text-start">{t("table.name")}</th>
                  <th className="px-5 py-3 font-semibold text-start">{t("table.phone")}</th>
                  <th className="px-5 py-3 font-semibold text-start">{t("table.type")}</th>
                  <th className="px-5 py-3 font-semibold text-start">{t("table.status")}</th>
                  <th className="px-5 py-3 font-semibold text-start">{t("table.blocked")}</th>
                  <th className="px-5 py-3 font-semibold text-start">{t("table.deliveryHistory")}</th>
                  <th className="px-5 py-3 font-semibold text-start">{t("table.orders")}</th>
                  <th className="px-5 py-3 font-semibold text-start">{t("table.created")}</th>
                  <th className="px-5 py-3 font-semibold text-end">{t("table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {customerPage.items.map((c) => (
                  <tr key={c.id} className="hover:bg-bg/50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-medium text-fg">{c.name}</span>
                      {c.businessName && (
                        <span className="block text-xs text-muted">{c.businessName}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted" dir="ltr">
                      {c.phone}
                    </td>
                    <td className="px-5 py-3">{typeBadge(c.customerType)}</td>
                    <td className="px-5 py-3">{statusBadge(c.approvalStatus)}</td>
                    <td className="px-5 py-3">
                      {c.blockedAt ? (
                        <span className="rounded-full border border-red-500/30 bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                          {t("table.blockedBadge")}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs" dir="ltr">
                      <span className="text-emerald-400 font-semibold">
                        ✓{nf.format(c.successfulDeliveries ?? 0)}
                      </span>
                      <span className="text-muted"> / </span>
                      <span
                        className={`font-semibold ${(c.failedDeliveries ?? 0) > 0 ? "text-red-400" : "text-muted"}`}
                      >
                        ✗{nf.format(c.failedDeliveries ?? 0)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-fg" dir="ltr">
                      {nf.format(c._count?.orders ?? 0)}
                    </td>
                    <td className="px-5 py-3 text-muted text-xs" dir="ltr">
                      {new Date(c.createdAt).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/${locale}/admin/orders?search=${encodeURIComponent(c.phone)}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-fg hover:border-accent hover:text-accent transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{t("actions.view")}</span>
                        </Link>
                        {c.approvalStatus === "pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => setApproveTarget(c)}
                              disabled={actionBusy}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{t("actions.approve")}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectTarget(c)}
                              disabled={actionBusy}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>{t("actions.reject")}</span>
                            </button>
                          </>
                        )}
                        {c.blockedAt ? (
                          <button
                            type="button"
                            onClick={() => setUnblockTarget(c)}
                            disabled={actionBusy}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                          >
                            <LockOpen className="w-3.5 h-3.5" />
                            <span>{t("actions.unblock")}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setBlockTarget(c)}
                            disabled={actionBusy}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>{t("actions.block")}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {customerPage && customerPage.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
            <span className="text-muted">
              {t("pagination.page", { page: customerPage.page, total: customerPage.totalPages })}
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
                disabled={page >= customerPage.totalPages}
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

      {/* Approve confirm */}
      {approveTarget && (
        <ConfirmDialog
          title={t("approve.title")}
          message={t("approve.message", { name: approveTarget.name })}
          onConfirm={handleApprove}
          onCancel={() => setApproveTarget(null)}
          isDanger={false}
        />
      )}

      {/* Reject modal */}
      <RejectReasonModal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
        customerName={rejectTarget?.name ?? ""}
      />

      {/* Block modal */}
      <BlockCustomerModal
        isOpen={!!blockTarget}
        onClose={() => setBlockTarget(null)}
        onConfirm={handleBlock}
        customerName={blockTarget?.name ?? ""}
      />

      {/* Unblock confirm */}
      {unblockTarget && (
        <ConfirmDialog
          title={t("unblock.title")}
          message={t("unblock.message", { name: unblockTarget.name })}
          onConfirm={handleUnblock}
          onCancel={() => setUnblockTarget(null)}
          isDanger={false}
        />
      )}
    </div>
  );
}
