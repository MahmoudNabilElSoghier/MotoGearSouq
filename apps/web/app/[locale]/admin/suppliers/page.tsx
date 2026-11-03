"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getSuppliers } from "@motogearsouq/api-client";
import type { Supplier } from "@motogearsouq/api-client";
import { SupplierForm } from "@/components/admin/SupplierForm";
import { FormBanner } from "@/components/admin/FormBanner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, Pencil, Search, Plus } from "lucide-react";

export default function AdminSuppliersPage() {
  const t = useTranslations("admin.suppliers");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const isAr = locale === "ar";
  const nf = new Intl.NumberFormat(isAr ? "ar-EG-u-nu-latn" : "en-US");

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const refetch = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    setLoading(true);
    getSuppliers()
      .then(setSuppliers)
      .catch(() => setSuppliers([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filtered = suppliers.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.code.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      (s.nameAr ?? "").toLowerCase().includes(q) ||
      (s.phone ?? "").includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">
            {loading ? tCommon("loading") : t("countLine", { count: nf.format(suppliers.length) })}
          </p>
        </div>
        {!showCreate && (
          <Button size="sm" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            {t("add")}
          </Button>
        )}
      </div>

      {banner && <FormBanner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />}

      {showCreate && (
        <SupplierForm
          mode="create"
          onSuccess={() => {
            setShowCreate(false);
            setBanner({ type: "success", message: t("createdOk") });
            refetch();
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-card border border-border rounded-xl p-6 max-h-[90vh] overflow-y-auto">
            <SupplierForm
              mode="edit"
              initialData={editing}
              onSuccess={() => {
                setEditing(null);
                setBanner({ type: "success", message: t("updatedOk") });
                refetch();
              }}
              onCancel={() => setEditing(null)}
            />
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between rounded-xl border border-border bg-card p-4">
        <div className="relative flex-1 w-full sm:w-80">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("filter.searchPlaceholder")}
            className="ps-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-muted">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="px-5 py-3 font-medium text-start">{t("table.code")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.name")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.phone")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.email")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.country")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.leadTime")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.products")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.pos")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((supplier) => (
                  <tr key={supplier.id} className="border-b border-border/50 last:border-0 hover:bg-bg/50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-bold text-accent" dir="ltr">
                      {supplier.code}
                    </td>
                    <td className="px-5 py-3 text-fg">{isAr ? supplier.nameAr || supplier.name : supplier.nameEn || supplier.name}</td>
                    <td className="px-5 py-3 text-fg" dir="ltr">
                      {supplier.phone ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-muted" dir="ltr">
                      {supplier.email ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-fg">{supplier.country ?? "—"}</td>
                    <td className="px-5 py-3 text-fg" dir="ltr">
                      {nf.format(supplier.leadTimeDays)}
                    </td>
                    <td className="px-5 py-3 text-fg" dir="ltr">
                      {nf.format(supplier._count?.products ?? 0)}
                    </td>
                    <td className="px-5 py-3 text-fg" dir="ltr">
                      {nf.format(supplier._count?.purchaseOrders ?? 0)}
                    </td>
                    <td className="px-5 py-3">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(supplier)} aria-label={t("edit")}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
