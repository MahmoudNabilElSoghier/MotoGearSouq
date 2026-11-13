"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { trackOrder, ApiError, type TrackOrder } from "@motogearsouq/api-client";
import { ShieldCheck, Loader2, CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { company } from "@/lib/config";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  confirmed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  shipped: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  delivered: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
};

interface OrderLookupFormProps {
  mode: "details" | "whatsapp";
  submitLabel: string;
  warning?: ReactNode;
}

export function OrderLookupForm({ mode, submitLabel, warning }: OrderLookupFormProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("trackOrder");
  const tOrder = useTranslations("order");
  const tCommon = useTranslations("common");

  const [phone, setPhone] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [phase, setPhase] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<TrackOrder | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const nf = new Intl.NumberFormat(isAr ? "ar-EG-u-nu-latn" : "en-US");

  const statusLabels: Record<string, string> = {
    pending: tOrder("statuses.pending"),
    confirmed: tOrder("statuses.confirmed"),
    shipped: tOrder("statuses.shipped"),
    delivered: tOrder("statuses.delivered"),
    cancelled: tOrder("statuses.cancelled"),
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!phone.trim() || !orderNumber.trim()) {
      setPhase("error");
      setErrorMsg(t("required"));
      return;
    }
    setPhase("loading");
    setErrorMsg("");
    try {
      const data = await trackOrder(orderNumber.trim());
      setResult(data);
      setPhase("success");
    } catch (error) {
      setPhase("error");
      setErrorMsg(
        error instanceof ApiError && error.status === 404 ? t("notFound") : t("requestError")
      );
    }
  };

  const waText = result ? t("whatsappReturn", { orderNumber: result.orderNumber }) : "";
  const waHref = `${company.whatsappUrl}?text=${encodeURIComponent(waText)}`;

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label={t("phoneLabel")}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="01XXXXXXXXX"
          dir="ltr"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          required
        />
        <Input
          label={t("orderLabel")}
          dir="ltr"
          value={orderNumber}
          onChange={(event) => setOrderNumber(event.target.value)}
          required
        />
        {warning}
        {phase === "error" && errorMsg && (
          <p
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400"
          >
            {errorMsg}
          </p>
        )}
        <Button type="submit" variant="primary" fullWidth disabled={phase === "loading"}>
          {phase === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="gap-1.5">{phase === "loading" ? tCommon("loading") : submitLabel}</span>
        </Button>
      </form>

      {phase === "success" && result && mode === "details" && (
        <div
          data-testid="track-result"
          className="mt-6 space-y-4 rounded-xl border border-border bg-bg p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted">{tOrder("orderNumber")}</p>
              <p className="font-mono text-lg font-bold text-fg" dir="ltr">
                {result.orderNumber}
              </p>
              <p className="mt-1 text-xs text-muted">
                {t("orderDate")}:{" "}
                <span dir="ltr">
                  {new Date(result.createdAt).toLocaleString(isAr ? "ar-EG" : "en-US")}
                </span>
              </p>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-bold ${
                statusStyles[result.status] ?? "border-border bg-card text-muted"
              }`}
            >
              {statusLabels[result.status] ?? result.status}
            </span>
          </div>

          <ul className="divide-y divide-border/50 rounded-lg border border-border bg-card">
            {result.items.map((item) => (
              <li
                key={item.productId}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
              >
                <span className="min-w-0 truncate font-medium text-fg">{item.name}</span>
                <span className="shrink-0 text-muted" dir="ltr">
                  &times;{item.quantity}
                </span>
                <span className="shrink-0 font-semibold text-fg" dir="ltr">
                  {nf.format(item.lineTotal)}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4">
            <div className="space-y-1 text-xs text-muted">
              {result.estimatedDelivery && (
                <p>
                  {tOrder("estimatedDelivery")}:{" "}
                  <span className="font-semibold text-fg" dir="ltr">
                    {new Date(result.estimatedDelivery).toLocaleDateString(
                      isAr ? "ar-EG" : "en-US"
                    )}
                  </span>
                </p>
              )}
              <p>
                {t("registeredPhone")}: <span dir="ltr">{result.phone}</span>
              </p>
            </div>
            <div className="text-end">
              <p className="text-xs text-muted">{tOrder("total")}</p>
              <p className="text-xl font-extrabold text-accent" dir="ltr">
                {nf.format(result.total)} {isAr ? "ج.م" : "EGP"}
              </p>
            </div>
          </div>
        </div>
      )}

      {phase === "success" && result && mode === "whatsapp" && (
        <div
          data-testid="whatsapp-result"
          className="mt-6 space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center"
        >
          <CheckCircle2
            className="mx-auto h-8 w-8 text-emerald-400"
            aria-hidden="true"
          />
          <p className="font-semibold text-fg">{t("whatsappMessage")}</p>
          <p className="font-mono text-sm text-muted" dir="ltr">
            {result.orderNumber}
          </p>
          <Button variant="primary" fullWidth asChild>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="gap-2"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              <span>{tCommon("whatsapp")}</span>
            </a>
          </Button>
        </div>
      )}
    </>
  );
}
