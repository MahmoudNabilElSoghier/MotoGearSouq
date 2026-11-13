import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { trackOrder } from "@motogearsouq/api-client";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { company } from "@/lib/config";
import { PackageCheck, Clock, CheckCircle2, Truck, MessageCircle } from "lucide-react";

type PageProps = {
  params: Promise<{ locale: string; orderNumber: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, orderNumber } = await params;
  const t = await getTranslations({ locale, namespace: "order" });
  return {
    title: t("metaTitle", { orderNumber }),
  };
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  confirmed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  shipped: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  delivered: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
};

const steps = ["pending", "confirmed", "shipped", "delivered"];

const knownStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export default async function OrderTrackingPage({ params }: PageProps) {
  const { locale, orderNumber } = await params;
  const isAr = locale === "ar";
  const t = await getTranslations({ locale, namespace: "order" });
  const tTrack = await getTranslations({ locale, namespace: "trackOrder" });
  const nf = new Intl.NumberFormat(isAr ? "ar-EG-u-nu-latn" : "en-US");

  let order;
  try {
    order = await trackOrder(orderNumber);
  } catch {
    notFound();
  }

  if (!order) notFound();

  const statusLabel = (status: string) =>
    knownStatuses.includes(status) ? t(`statuses.${status}`) : status;

  const stepIndex = steps.indexOf(order.status);
  const waText = t("whatsappInquiry", { orderNumber: order.orderNumber });
  const waHref = `${company.whatsappUrl}?text=${encodeURIComponent(waText)}`;

  return (
    <main id="main-content" className="flex-1 py-12 md:py-16">
      <Container size="md">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={`/${locale}/products`}
            className="font-semibold text-accent hover:underline"
          >
            ← {t("continueShopping")}
          </Link>
          <span className="rounded-full border border-border bg-card px-3 py-1 font-mono text-xs text-muted" dir="ltr">
            {order.orderNumber}
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-8">
          {/* Header Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
            <div>
              <p className="text-sm text-muted">{t("orderNumber")}</p>
              <h1 className="text-2xl md:text-3xl font-extrabold text-fg" dir="ltr">
                {order.orderNumber}
              </h1>
              <p className="mt-1 text-xs text-muted">
                {tTrack("orderDate")}:{" "}
                <span dir="ltr">{new Date(order.createdAt).toLocaleString(isAr ? "ar-EG" : "en-US")}</span>
              </p>
            </div>
            <div>
              <span className={`inline-block rounded-full border px-4 py-1.5 text-sm font-bold ${statusColors[order.status] ?? "bg-card text-muted"}`}>
                {statusLabel(order.status)}
              </span>
            </div>
          </div>

          {/* Timeline */}
          {order.status !== "cancelled" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-fg">
                {t("timeline")}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {steps.map((st, idx) => {
                  const isDone = stepIndex >= idx;
                  const isCurrent = order.status === st;
                  return (
                    <div
                      key={st}
                      className={`flex flex-col items-center p-3 rounded-xl border text-center transition-colors ${
                        isCurrent
                          ? "border-accent bg-accent/10 text-fg"
                          : isDone
                          ? "border-border bg-card text-fg"
                          : "border-border/50 bg-card/50 text-muted opacity-50"
                      }`}
                    >
                      <div className="mb-2 p-2 rounded-full bg-bg">
                        {st === "pending" && <Clock className="w-5 h-5" />}
                        {st === "confirmed" && <CheckCircle2 className="w-5 h-5" />}
                        {st === "shipped" && <Truck className="w-5 h-5" />}
                        {st === "delivered" && <PackageCheck className="w-5 h-5" />}
                      </div>
                      <span className="text-xs font-semibold">
                        {statusLabel(st)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-fg">
              {t("itemsTitle")}
            </h2>
            <div className="overflow-hidden rounded-xl border border-border bg-bg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="px-4 py-3 font-medium text-start">{t("item")}</th>
                    <th className="px-4 py-3 font-medium text-start">{t("qty")}</th>
                    <th className="px-4 py-3 font-medium text-start">{t("price")}</th>
                    <th className="px-4 py-3 font-medium text-end">{t("total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-3 font-semibold text-fg">{item.name}</td>
                      <td className="px-4 py-3 text-fg" dir="ltr">
                        {nf.format(item.quantity)}
                      </td>
                      <td className="px-4 py-3 text-fg" dir="ltr">
                        {nf.format(item.unitPrice)} {isAr ? "ج.م" : "EGP"}
                      </td>
                      <td className="px-4 py-3 text-end font-bold text-fg" dir="ltr">
                        {nf.format(item.lineTotal)} {isAr ? "ج.م" : "EGP"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals & Delivery */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-border pt-6">
            <div>
              {order.estimatedDelivery && (
                <p className="text-sm text-muted">
                  {t("estimatedDelivery")}:{" "}
                  <span className="font-semibold text-fg" dir="ltr">
                    {new Date(order.estimatedDelivery).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
                  </span>
                </p>
              )}
              <p className="text-xs text-muted mt-1">
                {tTrack("registeredPhone")}:{" "}
                <span dir="ltr">{order.phone}</span>
              </p>
            </div>

            <div className="text-start sm:text-end">
              <p className="text-sm text-muted">{t("totalAmount")}</p>
              <p className="text-2xl font-extrabold text-accent" dir="ltr">
                {nf.format(order.total)} {isAr ? "ج.م" : "EGP"}
              </p>
            </div>
          </div>

          {/* WhatsApp support */}
          <div className="rounded-xl border border-border bg-bg p-6 text-center space-y-3">
            <p className="text-sm text-muted">
              {t("whatsappHelp")}
            </p>
            <Button variant="primary" asChild>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{t("contactWhatsApp")}</span>
              </a>
            </Button>
          </div>
        </div>
      </Container>
    </main>
  );
}
