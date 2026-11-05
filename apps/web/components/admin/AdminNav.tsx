"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getPendingCustomersCount } from "@motogearsouq/api-client";
import { useTranslations } from "next-intl";

export function AdminNav() {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);

  const navItems = [
    { href: "/admin", label: t("dashboard") },
    { href: "/admin/orders", label: t("orders") },
    { href: "/admin/customers", label: t("customers"), badge: pendingCount },
    { href: "/admin/payments", label: t("payments") },
    { href: "/admin/products", label: t("products") },
    { href: "/admin/categories", label: t("categories") },
    { href: "/admin/brands", label: t("brands") },
    { href: "/admin/employees", label: t("employees") },
    { href: "/admin/branches", label: t("branches") },
    { href: "/admin/inventory", label: t("inventory") },
    { href: "/admin/suppliers", label: t("suppliers") },
    { href: "/admin/purchases", label: t("purchases") },
    { href: "/admin/stock-movements", label: t("stockMovements") },
    { href: "/admin/landing", label: t("landing") },
    { href: "/admin/reports", label: t("reports") },
    { href: "/admin/reports/break-even", label: t("breakEven") },
    { href: "/admin/reports/abc", label: t("abcAnalysis") },
    { href: "/admin/reports/dead-stock", label: t("deadStock") },
    { href: "/admin/reports/stock-valuation", label: t("stockValuation") },
  ];

  useEffect(() => {
    getPendingCustomersCount()
      .then((res) => setPendingCount(res.count))
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col h-full p-3">
      <nav aria-label={t("aria")} className="flex flex-col gap-1">
        {navItems.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname.endsWith("/admin")
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent-strong/20 font-semibold text-fg"
                  : "text-muted hover:bg-bg hover:text-fg"
              )}
            >
              <span className="flex-1">{item.label}</span>
              {typeof item.badge === "number" && item.badge > 0 && (
                <span
                  aria-label={`${item.badge}`}
                  className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold text-white"
                >
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
