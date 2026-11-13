"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { ChevronsLeft, ChevronsRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminLayoutShell } from "@/components/admin/AdminLayoutShell";
import { useAdminSidebar } from "@/components/admin/AdminSidebarProvider";

interface AdminSidebarProps {
  locale: string;
  dbConfigured: boolean;
}

export function AdminSidebar({ locale, dbConfigured }: AdminSidebarProps) {
  const t = useTranslations("admin.layout");
  const tNav = useTranslations("admin.nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const { collapsed, mobileOpen, toggleCollapsed, closeMobile } = useAdminSidebar();

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  const CollapseIcon = locale === "ar" ? ChevronsRight : ChevronsLeft;
  const ExpandIcon = locale === "ar" ? ChevronsLeft : ChevronsRight;
  const ToggleIcon = collapsed ? ExpandIcon : CollapseIcon;

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}
      <aside
        className={cn(
          "flex h-screen w-64 shrink-0 flex-col border-e border-border bg-card",
          "max-md:fixed max-md:inset-y-0 max-md:start-0 max-md:z-50 max-md:shadow-2xl",
          mobileOpen ? "max-md:flex" : "max-md:hidden",
          "md:sticky md:top-0 md:transition-[width] md:duration-200 md:ease-in-out",
          collapsed ? "md:w-16" : "md:w-64",
        )}
      >
        <div className="flex shrink-0 flex-col gap-3 border-b border-border p-3 md:p-4">
          <div className={cn(collapsed && "md:hidden")}>
            <Image
              src={
                locale === "ar"
                  ? "/brand/Logo_Icon_Name_AR_Large.png"
                  : "/brand/Logo_Icon_Name_EN_Large.png"
              }
              alt={tCommon("logoAlt")}
              width={120}
              height={48}
              className="mb-2 h-auto max-h-16 w-full max-w-full object-contain"
              priority
            />
            <p className="text-lg font-bold text-fg">{t("panelName")}</p>
            {!dbConfigured && (
              <span className="mt-2 inline-block rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400">
                {t("demoBadge")}
              </span>
            )}
          </div>
          <div
            className={cn(
              "flex items-center justify-end gap-1",
              collapsed && "md:justify-center",
            )}
          >
            <button
              type="button"
              onClick={closeMobile}
              aria-label={tNav("closeMenu")}
              className="rounded-lg p-2 text-muted transition-colors hover:bg-bg hover:text-fg md:hidden"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={tNav("toggleSidebar")}
              aria-expanded={!collapsed}
              title={tNav("toggleSidebar")}
              className="hidden rounded-lg p-2 text-muted transition-colors hover:bg-bg hover:text-fg md:inline-flex"
            >
              <ToggleIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <AdminLayoutShell locale={locale} collapsed={collapsed} />
      </aside>
    </>
  );
}
