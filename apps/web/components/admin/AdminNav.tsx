"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getPendingCustomersCount } from "@motogearsouq/api-client";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeftRight,
  BarChart3,
  ClipboardList,
  Coins,
  CreditCard,
  FolderTree,
  LayoutDashboard,
  LayoutTemplate,
  Package,
  PackageX,
  PieChart,
  Scale,
  ShoppingCart,
  Store,
  Tag,
  Truck,
  UserCog,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export function AdminNav({ collapsed }: { collapsed: boolean }) {
  const t = useTranslations("admin.nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);

  const navItems: NavItem[] = [
    { href: "/admin", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/admin/orders", label: t("orders"), icon: ShoppingCart },
    { href: "/admin/customers", label: t("customers"), icon: Users, badge: pendingCount },
    { href: "/admin/payments", label: t("payments"), icon: CreditCard },
    { href: "/admin/products", label: t("products"), icon: Package },
    { href: "/admin/categories", label: t("categories"), icon: FolderTree },
    { href: "/admin/brands", label: t("brands"), icon: Tag },
    { href: "/admin/employees", label: t("employees"), icon: UserCog },
    { href: "/admin/branches", label: t("branches"), icon: Store },
    { href: "/admin/inventory", label: t("inventory"), icon: Warehouse },
    { href: "/admin/suppliers", label: t("suppliers"), icon: Truck },
    { href: "/admin/purchases", label: t("purchases"), icon: ClipboardList },
    { href: "/admin/stock-movements", label: t("stockMovements"), icon: ArrowLeftRight },
    { href: "/admin/landing", label: t("landing"), icon: LayoutTemplate },
    { href: "/admin/reports", label: t("reports"), icon: BarChart3 },
    { href: "/admin/reports/break-even", label: t("breakEven"), icon: Scale },
    { href: "/admin/reports/abc", label: t("abcAnalysis"), icon: PieChart },
    { href: "/admin/reports/dead-stock", label: t("deadStock"), icon: PackageX },
    { href: "/admin/reports/stock-valuation", label: t("stockValuation"), icon: Coins },
  ];

  useEffect(() => {
    getPendingCustomersCount()
      .then((res) => setPendingCount(res.count))
      .catch(() => {});
  }, []);

  const basePath =
    pathname === `/${locale}`
      ? "/"
      : pathname.startsWith(`/${locale}/`)
        ? pathname.slice(locale.length + 1)
        : pathname;
  const matchesPath = (href: string) =>
    href === "/admin"
      ? basePath === "/admin"
      : basePath === href || basePath.startsWith(`${href}/`);
  const activeHref = navItems.reduce<string | null>(
    (best, item) =>
      matchesPath(item.href) && (!best || item.href.length > best.length) ? item.href : best,
    null,
  );

  return (
    <div className="flex flex-col h-full p-3">
      <nav aria-label={t("aria")} className="flex flex-col gap-1">
        {navItems.map((item) => {
          const active = activeHref === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                "relative flex items-center gap-2.5 rounded-lg border-b-2 px-3 py-2 text-sm transition-colors",
                collapsed && "md:justify-center md:px-2",
                active
                  ? "border-brand-red bg-accent-strong/20 font-semibold text-fg"
                  : "border-transparent text-muted hover:bg-bg hover:text-fg"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className={cn("min-w-0 flex-1 truncate", collapsed && "md:hidden")}>
                {item.label}
              </span>
              {typeof item.badge === "number" && item.badge > 0 && (
                <span
                  aria-label={`${item.badge}`}
                  className={cn(
                    "inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold text-white",
                    collapsed &&
                      "md:absolute md:end-1 md:top-1 md:min-w-[1rem] md:px-1 md:text-[9px]"
                  )}
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
