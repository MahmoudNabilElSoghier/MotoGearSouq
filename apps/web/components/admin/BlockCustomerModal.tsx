"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface BlockCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  customerName: string;
}

export function BlockCustomerModal({ isOpen, onClose, onConfirm, customerName }: BlockCustomerModalProps) {
  const t = useTranslations("admin.customers.block");
  const tCommon = useTranslations("admin.forms.common");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (trimmed.length < 10) {
      setError(t("reasonMin"));
      return;
    }
    onConfirm(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="block-customer-title"
        className="w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-red-500/15 text-red-400">
            <Ban className="w-6 h-6" />
          </div>
          <h2 id="block-customer-title" className="text-lg font-bold text-fg">
            {t("title")}
          </h2>
        </div>

        <p className="text-sm text-muted">{t("message", { name: customerName })}</p>

        <div>
          <label htmlFor="block-reason" className="block text-xs font-semibold text-muted mb-1">
            {t("reasonLabel")}
          </label>
          <textarea
            id="block-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            rows={3}
            placeholder={t("reasonPlaceholder")}
            aria-invalid={error ? true : undefined}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none resize-y"
          />
          {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {t("confirm")}
          </Button>
        </div>
      </div>
    </div>
  );
}
