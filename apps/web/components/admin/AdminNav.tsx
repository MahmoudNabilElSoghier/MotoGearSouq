"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { authApi, type AuthUser } from "@motogearsouq/api-client";
import { useTranslations } from "next-intl";
import { LogOut, User } from "lucide-react";

export function AdminNav() {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  const navItems = [
    { href: "/admin", label: t("dashboard") },
    { href: "/admin/orders", label: t("orders") },
    { href: "/admin/products", label: t("products") },
    { href: "/admin/categories", label: t("categories") },
    { href: "/admin/brands", label: t("brands") },
    { href: "/admin/employees", label: t("employees") },
    { href: "/admin/branches", label: t("branches") },
    { href: "/admin/inventory", label: t("inventory") },
    { href: "/admin/suppliers", label: t("suppliers") },
    { href: "/admin/purchases", label: t("purchases") },
    { href: "/admin/stock-movements", label: t("stockMovements") },
    { href: "/admin/reports", label: t("reports") },
    { href: "/admin/reports/break-even", label: t("breakEven") },
    { href: "/admin/reports/abc", label: t("abcAnalysis") },
    { href: "/admin/reports/dead-stock", label: t("deadStock") },
    { href: "/admin/reports/stock-valuation", label: t("stockValuation") },
  ];

  useEffect(() => {
    authApi.me().then(setUser).catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="flex flex-col h-full justify-between p-3">
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
                "rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent-strong/20 font-semibold text-fg"
                  : "text-muted hover:bg-bg hover:text-fg"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-border mt-auto">
        {user && (
          <div className="flex items-center gap-2 px-3 py-2 mb-2 text-xs text-muted truncate">
            <User className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>{t("logout")}</span>
        </button>
      </div>
    </div>
  );
}
