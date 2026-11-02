"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { getBrands, getLowStockItems, getOrders, getProducts, type ProductPage, type OrderPage } from "@motogearsouq/api-client";
import type { Brand, BranchInventory, Order } from "@motogearsouq/shared";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

export default function AdminHomePage() {
  const t = useTranslations("admin.dashboard");
  const locale = useLocale();
  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US");
  const formatEgp = (value: number) => `${nf.format(value)} EGP`;

  const statusStyles: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-400",
    confirmed: "bg-sky-500/15 text-sky-400",
    shipped: "bg-violet-500/15 text-violet-400",
    delivered: "bg-emerald-500/15 text-emerald-400",
    cancelled: "bg-red-500/15 text-red-400",
  };

  const statusLabels: Record<string, string> = {
    pending: t("statusPending"),
    confirmed: t("statusConfirmed"),
    shipped: t("statusShipped"),
    delivered: t("statusDelivered"),
    cancelled: t("statusCancelled"),
  };

  const [brands, setBrands] = useState<Brand[]>([]);
  const [productPage, setProductPage] = useState<ProductPage | null>(null);
  const [lowStockItems, setLowStockItems] = useState<BranchInventory[]>([]);
  const [orderPage, setOrderPage] = useState<OrderPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getBrands(),
      getProducts({ pageSize: 1 }),
      getLowStockItems(),
      getOrders({ pageSize: 5 }),
    ])
      .then(([b, p, l, o]) => {
        setBrands(b);
        setProductPage(p);
        setLowStockItems(l);
        setOrderPage(o);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const cards = [
    { label: t("cardBrands"), value: brands.length, danger: false, href: "/admin/brands" },
    { label: t("cardProducts"), value: productPage?.total ?? 0, danger: false, href: "/admin/products" },
    { label: t("cardOrders"), value: orderPage?.total ?? 0, danger: false, href: "/admin/orders" },
    { label: t("cardLowStock"), value: lowStockItems.length, danger: lowStockItems.length > 0, href: "/admin/inventory" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-fg">{t("title")}</h1>
        <div className="flex gap-3">
          <Button asChild size="sm">
            <Link href="/admin/products/new">{t("newProduct")}</Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link href="/">{t("viewSite")}</Link>
          </Button>
        </div>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label={t("statsAria")}>
        {cards.map((card) => {
          const content = (
            <>
              <p className="text-sm text-muted">{card.label}</p>
              <p
                className={`mt-2 text-3xl font-extrabold ${
                  card.danger ? "text-red-400" : "text-fg"
                }`}
              >
                {nf.format(card.value)}
              </p>
            </>
          );
          return (
            <li key={card.label}>
              {card.href ? (
                <Link
                  href={card.href}
                  className={`block rounded-xl border p-5 transition-colors hover:border-accent ${
                    card.danger ? "border-red-500/40 bg-red-500/5" : "border-border bg-card"
                  }`}
                >
                  {content}
                </Link>
              ) : (
                <div
                  className={`rounded-xl border p-5 ${
                    card.danger ? "border-red-500/40 bg-red-500/5" : "border-border bg-card"
                  }`}
                >
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <section
        aria-labelledby="recent-orders"
        className="overflow-hidden rounded-xl border border-border bg-card"
      >
        <h2 id="recent-orders" className="border-b border-border px-5 py-4 font-bold text-fg">
          {t("recentOrders")}
        </h2>
        {!orderPage || orderPage.items.length === 0 ? (
          <p className="px-5 py-6 text-muted">{t("noOrders")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="px-5 py-3 font-medium text-start">{t("orderNo")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("customer")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("branchCol")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("total")}</th>
                  <th className="px-5 py-3 font-medium text-start">{t("status")}</th>
                </tr>
              </thead>
              <tbody>
                {orderPage.items.map((order: Order) => (
                  <tr key={order.id} className="border-b border-border/50 last:border-0">
                    <td className="px-5 py-3 font-mono text-xs text-fg" dir="ltr">
                      {order.orderNumber}
                    </td>
                    <td className="px-5 py-3 text-fg">{order.customer?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-fg">{order.branch?.nameAr ?? "—"}</td>
                    <td className="px-5 py-3 text-fg">{formatEgp(order.total)}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          statusStyles[order.status] ?? "bg-bg text-muted"
                        }`}
                      >
                        {statusLabels[order.status] ?? order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
