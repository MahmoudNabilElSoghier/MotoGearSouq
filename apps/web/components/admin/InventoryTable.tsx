"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BranchInventory } from "@motogearsouq/shared";
import { useLocale, useTranslations } from "next-intl";
import { RecordMovementDialog } from "./RecordMovementDialog";

function isLow(row: BranchInventory): boolean {
  const threshold = row.reorderLevel ?? row.product?.reorderLevel ?? 0;
  return row.quantity <= threshold;
}

interface InventoryTableProps {
  rows: BranchInventory[];
  onRefresh?: () => void;
}

export function InventoryTable({ rows, onRefresh }: InventoryTableProps) {
  const t = useTranslations("admin.inventory");
  const locale = useLocale();
  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US");
  const router = useRouter();

  const [edits, setEdits] = useState<Record<string, string>>({});
  const [savedId, setSavedId] = useState<string | null>(null);

  // Movement dialog state
  const [movementOpen, setMovementOpen] = useState(false);
  const [movementRow, setMovementRow] = useState<BranchInventory | null>(null);

  const setQty = (id: string, value: string) =>
    setEdits((prev) => ({ ...prev, [id]: value }));

  const handleSave = (row: BranchInventory) => {
    const raw = edits[row.id] ?? String(row.quantity);
    const quantity = Number(raw);
    if (!Number.isInteger(quantity) || quantity < 0) return;
    console.log("[admin] update inventory:", {
      id: row.id,
      branchId: row.branchId,
      productId: row.productId,
      quantity,
    });
    setEdits((prev) => {
      const next = { ...prev };
      delete next[row.id];
      return next;
    });
    setSavedId(row.id);
  };

  const openMovementDialog = (row: BranchInventory) => {
    setMovementRow(row);
    setMovementOpen(true);
  };

  const closeMovementDialog = () => {
    setMovementOpen(false);
    setMovementRow(null);
  };

  const handleMovementSuccess = () => {
    closeMovementDialog();
    onRefresh?.();
  };

  const viewHistory = (productId: string, branchId: string) => {
    router.push(`/${locale}/admin/stock-movements?productId=${productId}&branchId=${branchId}`);
  };

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-card px-4 py-8 text-center text-muted">
        {t("empty")}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-4 py-3 font-medium text-start">{t("product")}</th>
              <th className="px-4 py-3 font-medium text-start">{t("code")}</th>
              <th className="px-4 py-3 font-medium text-start">{t("branchCol")}</th>
              <th className="px-4 py-3 font-medium text-start">{t("qty")}</th>
              <th className="px-4 py-3 font-medium text-start">{t("reorder")}</th>
              <th className="px-4 py-3 font-medium text-start">{t("statusCol")}</th>
              <th className="px-4 py-3 font-medium text-start">
                <span className="sr-only">{t("actionSr")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const low = isLow(row);
              const dirty = edits[row.id] !== undefined;
              const threshold = row.reorderLevel ?? row.product?.reorderLevel ?? 0;
              return (
                <tr
                  key={row.id}
                  className={`border-b border-border/50 last:border-0 ${
                    low ? "bg-red-500/5" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-fg">
                    {row.product?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted" dir="ltr">
                    {row.product?.code ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {row.branch?.nameAr ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={edits[row.id] ?? String(row.quantity)}
                      onChange={(event) => setQty(row.id, event.target.value)}
                      aria-label={t("qtyAria", { product: row.product?.name ?? "", branch: row.branch?.nameAr ?? "" })}
                      className="w-24 rounded-lg border border-border bg-bg px-3 py-2 text-fg focus:border-accent focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-3 text-muted">{nf.format(threshold)}</td>
                  <td className="px-4 py-3">
                    {low ? (
                      <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-400">
                        {t("low")}
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
                        {t("inStock")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openMovementDialog(row)}
                        className="rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors border-amber-500 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20"
                        title={t("recordMovement")}
                      >
                        {t("recordMovementShort")}
                      </button>
                      <button
                        type="button"
                        onClick={() => viewHistory(row.productId, row.branchId)}
                        className="rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors border-border bg-bg text-muted hover:border-accent hover:text-fg"
                        title={t("viewHistory")}
                      >
                        {t("viewHistoryShort")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSave(row)}
                        disabled={!dirty}
                        className={`rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors ${
                          dirty
                            ? "border-accent text-fg hover:bg-accent-strong/20"
                            : "border-border text-muted opacity-60"
                        }`}
                      >
                        {savedId === row.id && !dirty ? t("done") : t("saveShort")}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {movementOpen && movementRow && (
        <RecordMovementDialog
          productId={movementRow.productId}
          branchId={movementRow.branchId}
          productName={movementRow.product?.name ?? movementRow.productId}
          branchName={movementRow.branch?.nameAr ?? movementRow.branchId}
          currentQty={movementRow.quantity}
          open={movementOpen}
          onClose={closeMovementDialog}
          onSuccess={handleMovementSuccess}
        />
      )}
    </div>
  );
}
