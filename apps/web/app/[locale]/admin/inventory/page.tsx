"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { InventoryTable } from "@/components/admin/InventoryTable";
import { getBranches, getInventory, isLowStock } from "@motogearsouq/api-client";
import type { Branch, BranchInventory } from "@motogearsouq/shared";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export default function AdminInventoryPage() {
  const t = useTranslations("admin.inventory");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US");

  const searchParams = useSearchParams();
  const branch = searchParams.get("branch") ?? "";

  const [branches, setBranches] = useState<Branch[]>([]);
  const [rows, setRows] = useState<BranchInventory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getBranches(),
      getInventory(branch || undefined),
    ])
      .then(([b, r]) => {
        setBranches(b);
        setRows(r);
      })
      .finally(() => setLoading(false));
  }, [branch]);

  const lowCount = rows.filter(isLowStock).length;

  const refetch = async () => {
    setLoading(true);
    try {
      const [b, r] = await Promise.all([
        getBranches(),
        getInventory(branch || undefined),
      ]);
      setBranches(b);
      setRows(r);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">
            {loading ? tCommon("loading") : t("countLine", { count: nf.format(rows.length) })}
          </p>
        </div>
        {!loading && lowCount > 0 && (
          <p className="rounded-full bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-400">
            {t("lowCount", { count: nf.format(lowCount) })}
          </p>
        )}
      </div>

      <form action="/admin/inventory" method="get" className="flex items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="branch-select"
            className="text-sm font-medium text-fg"
          >
            {t("filterLabel")}
          </label>
          <select
            id="branch-select"
            name="branch"
            defaultValue={branch}
            className="rounded-lg border border-border bg-bg px-4 py-3 text-fg focus:border-accent focus:outline-none"
          >
            <option value="">{t("allBranches")}</option>
            {branches.map((branchItem) => (
              <option key={branchItem.id} value={branchItem.id}>
                {locale === "ar" ? branchItem.nameAr : (branchItem.nameEn ?? branchItem.nameAr)}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="secondary" size="md">
          {t("viewBtn")}
        </Button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : (
        <InventoryTable rows={rows} onRefresh={refetch} />
      )}
    </div>
  );
}
