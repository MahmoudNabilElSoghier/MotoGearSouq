"use client";

import { useEffect, useState } from "react";
import { getBranches } from "@motogearsouq/api-client";
import { BranchForm } from "@/components/admin/BranchForm";
import { FormBanner } from "@/components/admin/FormBanner";
import type { Branch } from "@motogearsouq/shared";
import { Button } from "@/components/ui/Button";
import { Loader2, Plus, Pencil } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export default function AdminBranchesPage() {
  const t = useTranslations("admin.branches");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US");

  const typeLabels: Record<string, string> = {
    retail: t("types.retail"),
    warehouse: t("types.warehouse"),
    showroom: t("types.showroom"),
    main: t("types.main"),
    service_center: t("types.service_center"),
  };

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const refetch = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    setLoading(true);
    getBranches()
      .then(setBranches)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">
            {loading ? tCommon("loading") : t("countLine", { count: nf.format(branches.length) })}
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
        <BranchForm
          mode="create"
          onSuccess={() => {
            setShowCreate(false);
            setBanner({ type: "success", message: t("createdOk") });
            refetch();
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {editingBranch && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-card border border-border rounded-xl p-6 max-h-[90vh] overflow-y-auto">
            <BranchForm
              mode="edit"
              initialData={editingBranch}
              onSuccess={() => {
                setEditingBranch(null);
                setBanner({ type: "success", message: t("updatedOk") });
                refetch();
              }}
              onCancel={() => setEditingBranch(null)}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : branches.length === 0 ? (
        <p className="text-muted">{t("empty")}</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {branches.map((branch) => (
            <li
              key={branch.id}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-fg">
                    {locale === "ar" ? branch.nameAr : (branch.nameEn ?? branch.nameAr)}
                  </p>
                  {branch.nameEn && locale === "ar" && (
                    <p className="text-xs text-muted" dir="ltr">
                      {branch.nameEn}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      branch.active
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-bg text-muted"
                    }`}
                  >
                    {branch.active ? tCommon("active") : tCommon("inactive")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingBranch(branch)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline ms-1"
                  >
                    <Pencil className="w-3 h-3" />
                    {tCommon("edit")}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-bg px-2.5 py-1 font-mono text-muted" dir="ltr">
                  {branch.code}
                </span>
                <span className="rounded-full bg-bg px-2.5 py-1 text-muted">
                  {typeLabels[branch.type] ?? branch.type}
                </span>
                <span className="rounded-full bg-bg px-2.5 py-1 text-muted">
                  {branch.governorate}
                </span>
              </div>

              <div className="space-y-1.5 text-sm">
                <p className="text-muted">{branch.address}</p>
                {branch.phone && (
                  <p>
                    <a
                      href={`tel:${branch.phone}`}
                      className="text-fg hover:text-accent"
                      dir="ltr"
                    >
                      {branch.phone}
                    </a>
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
