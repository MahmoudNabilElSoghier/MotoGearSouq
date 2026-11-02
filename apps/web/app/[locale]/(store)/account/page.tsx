"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, LogOut, Package, ShoppingBag, Wallet, Clock } from "lucide-react";
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

const knownStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export default function AccountPage() {
  const t = useTranslations("customerAuth.account");
  const tOrders = useTranslations("customerAuth.orders");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { customer, init, isInitialized, logout } = useCustomerAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const customerId = customer?.id;

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (isInitialized && !customer) {
      router.replace(`/${locale}/login?next=/${locale}/account`);
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

  const onLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.push(`/${locale}`);
    router.refresh();
  };

  const statusLabel = (status: string) =>
    knownStatuses.includes(status)
      ? tOrders(`statuses.${status}` as "statuses.pending")
      : status;

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

  const isWholesale = customer.customerType === "wholesale";
  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US");
  const currency = locale === "ar" ? "ج.م" : "EGP";

  const totalOrders = orders?.length ?? 0;
  const totalSpent = orders?.reduce((sum, o) => sum + (o.total ?? 0), 0) ?? 0;
  const pendingOrders = orders?.filter((o) => o.status === "pending").length ?? 0;
  const recentOrders = (orders ?? []).slice(0, 3);

  const stats = [
    { label: t("stats.totalOrders"), value: nf.format(totalOrders), icon: Package },
    { label: t("stats.totalSpent"), value: `${nf.format(totalSpent)} ${currency}`, icon: Wallet },
    { label: t("stats.pendingOrders"), value: nf.format(pendingOrders), icon: Clock },
  ];

  return (
    <main id="main-content" className="flex-1 py-10 md:py-14">
      <Container size="md">
        <h1 className="mb-6 text-2xl font-extrabold text-fg">{t("title")}</h1>

        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          {/* Sidebar */}
          <Card padding="md" className="h-fit space-y-4">
            <div>
              <p className="font-bold text-fg">{customer.name}</p>
              <p className="mt-1 text-sm text-muted" dir="ltr">
                {customer.phone}
              </p>
              {isWholesale && (
                <span className="mt-2 inline-block rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  {t("wholesaleBadge")}
                </span>
              )}
            </div>
            <nav className="flex flex-col gap-1 border-t border-border pt-3">
              <Link
                href={`/${locale}/account`}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                  pathname === `/${locale}/account`
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:bg-bg hover:text-fg"
                }`}
              >
                {t("sidebar.overview")}
              </Link>
              <Link
                href={`/${locale}/account/orders`}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                  pathname.startsWith(`/${locale}/account/orders`)
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:bg-bg hover:text-fg"
                }`}
              >
                {t("sidebar.orders")}
              </Link>
              <button
                type="button"
                onClick={onLogout}
                disabled={loggingOut}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                {t("sidebar.logout")}
              </button>
            </nav>
          </Card>

          {/* Main */}
          <div className="space-y-6">
            <Card padding="md">
              <h2 className="text-lg font-bold text-fg">{t("welcome", { name: customer.name })}</h2>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <Card key={stat.label} padding="md">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <stat.icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs text-muted">{stat.label}</p>
                      <p className="truncate text-lg font-extrabold text-fg" dir="ltr">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Recent orders */}
            <Card padding="md">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-fg">{t("recentOrders")}</h3>
                {totalOrders > 0 && (
                  <Link
                    href={`/${locale}/account/orders`}
                    className="text-sm font-semibold text-accent hover:underline"
                  >
                    {t("viewAll")}
                  </Link>
                )}
              </div>

              {orders === null ? (
                <div className="flex items-center gap-2 py-6 text-sm text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{tCommon("loading")}</span>
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="py-6 text-center">
                  <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-muted/50" />
                  <p className="mb-4 text-sm text-muted">{t("noOrders")}</p>
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/${locale}/products`}>{t("browseStore")}</Link>
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {recentOrders.map((order) => (
                    <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div>
                        <p className="font-mono text-sm font-bold text-fg" dir="ltr">
                          {order.orderNumber}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {new Date(order.createdAt).toLocaleDateString(
                            locale === "ar" ? "ar-EG" : "en-US"
                          )}
                          {" · "}
                          {tOrders("itemsCount", { count: order.items?.length ?? 0 })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-fg" dir="ltr">
                          {nf.format(order.total)} {currency}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                            statusColors[order.status] ?? "bg-card text-muted border-border"
                          }`}
                        >
                          {statusLabel(order.status)}
                        </span>
                        <Link
                          href={`/${locale}/orders/${order.orderNumber}`}
                          className="text-xs font-semibold text-accent hover:underline"
                        >
                          {tOrders("viewDetails")}
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </Container>
    </main>
  );
}
