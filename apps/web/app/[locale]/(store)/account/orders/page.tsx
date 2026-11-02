"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, PackageSearch, ShoppingBag } from "lucide-react";
import type { Order } from "@motogearsouq/shared";
import { useCustomerAuth } from "@/lib/customer-auth-store";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  confirmed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  shipped: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  delivered: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
};

const filters = ["all", "pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
type Filter = (typeof filters)[number];

export default function CustomerOrdersPage() {
  const t = useTranslations("customerAuth.orders");
  const tAccount = useTranslations("customerAuth.account");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { customer, init, isInitialized } = useCustomerAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const customerId = customer?.id;

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (isInitialized && !customer) {
      router.replace(`/${locale}/login?next=/${locale}/account/orders`);
    }
  }, [isInitialized, customer, locale, router]);

  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/customer/orders", { credentials: "include" });
        const data = res.ok ? await res.json() : { data: [] };
        if (!cancelled) setOrders(Array.isArray(data.data) ? data.data : []);
      } catch {
        if (!cancelled) setOrders([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const visibleOrders = useMemo(() => {
    const list = orders ?? [];
    return filter === "all" ? list : list.filter((o) => o.status === filter);
  }, [orders, filter]);

  if (!customer) {
    return (
      <main id="main-content" className="flex-1 py-16 px-4">
        <div className="flex items-center justify-center gap-3 text-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{tCommon("loading")}</span>
        </div>
      </main>
    );
  }

  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US");
  const currency = locale === "ar" ? "ج.م" : "EGP";

  const statusLabel = (status: string) =>
    status === "pending" ||
    status === "confirmed" ||
    status === "shipped" ||
    status === "delivered" ||
    status === "cancelled"
      ? t(`statuses.${status}`)
      : status;

  const filterLabel = (f: Filter) => (f === "all" ? t("filterAll") : statusLabel(f));

  return (
    <main id="main-content" className="flex-1 py-10 md:py-14">
      <Container size="md">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold text-fg">{t("title")}</h1>
          <Link
            href={`/${locale}/account`}
            className="text-sm font-semibold text-accent hover:underline"
          >
            ← {tAccount("title")}
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                filter === f
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-card text-muted hover:text-fg"
              }`}
            >
              {filterLabel(f)}
            </button>
          ))}
        </div>

        {orders === null ? (
          <div className="flex items-center justify-center gap-3 py-16 text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{tCommon("loading")}</span>
          </div>
        ) : orders.length === 0 ? (
          <Card padding="lg">
            <div className="py-10 text-center">
              <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-muted/50" />
              <p className="mb-6 text-muted">{t("empty")}</p>
              <Button asChild>
                <Link href={`/${locale}/products`}>{t("browseStore")}</Link>
              </Button>
            </div>
          </Card>
        ) : visibleOrders.length === 0 ? (
          <div className="py-12 text-center text-muted">
            <PackageSearch className="mx-auto mb-3 h-10 w-10 text-muted/50" />
            <p>{t("empty")}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {visibleOrders.map((order) => (
              <li key={order.id}>
                <Card padding="md">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-mono text-sm font-bold text-fg" dir="ltr">
                        {order.orderNumber}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {t("date")}:{" "}
                        <span dir="ltr">
                          {new Date(order.createdAt).toLocaleDateString(
                            locale === "ar" ? "ar-EG" : "en-US"
                          )}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {t("itemsCount", { count: order.items?.length ?? 0 })}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-end">
                        <p className="text-xs text-muted">{t("total")}</p>
                        <p className="font-bold text-fg" dir="ltr">
                          {nf.format(order.total)} {currency}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          statusColors[order.status] ?? "bg-card text-muted border-border"
                        }`}
                      >
                        {statusLabel(order.status)}
                      </span>
                      <Button asChild variant="secondary" size="sm">
                        <Link href={`/${locale}/orders/${order.orderNumber}`}>
                          {t("viewDetails")}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </main>
  );
}
