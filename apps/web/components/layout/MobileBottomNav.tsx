"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Home, MessageSquare, Package, User } from "lucide-react";

export function MobileBottomNav() {
  const locale = useLocale();
  const pathname = usePathname();
  const tNav = useTranslations("nav");
  const tSidebar = useTranslations("sidebar");
  const tHeader = useTranslations("header");

  const items = [
    {
      href: `/${locale}`,
      label: tNav("home", { defaultValue: tSidebar("home", { defaultValue: "Home" }) }),
      icon: Home,
      exact: true,
    },
    {
      href: `/${locale}/support`,
      label: tNav("supportChat", { defaultValue: tSidebar("supportChat", { defaultValue: "Support" }) }),
      icon: MessageSquare,
      exact: false,
    },
    {
      href: `/${locale}/track-order`,
      label: tNav("trackOrder", { defaultValue: tSidebar("trackOrder", { defaultValue: "Track" }) }),
      icon: Package,
      exact: false,
    },
    {
      href: `/${locale}/account`,
      label: tSidebar("account", { defaultValue: "Profile" }),
      icon: User,
      exact: false,
    },
  ];

  const isActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href || pathname === `${href}/`;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      aria-label={tHeader("navAria")}
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-card/95 backdrop-blur px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:hidden shadow-lg"
    >
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(href, exact);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center justify-center py-1 text-xs font-medium transition-colors ${
              active ? "text-brand-red font-bold" : "text-muted hover:text-fg"
            }`}
          >
            <Icon className={`h-5 w-5 mb-1 ${active ? "text-brand-red" : "text-muted"}`} />
            <span className="truncate max-w-[70px]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
