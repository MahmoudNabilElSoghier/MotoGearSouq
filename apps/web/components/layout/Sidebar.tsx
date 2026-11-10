"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  X,
  Home,
  ShoppingBag,
  ShoppingCart,
  User,
  MessageSquare,
  Package,
  Mail,
  RotateCcw,
  FileText,
  UserCircle,
  LogOut,
} from "lucide-react";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/lib/cart-store";
import { useCustomerAuth } from "@/lib/customer-auth-store";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const rowBase =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-bg/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

export function Sidebar({ open, onClose }: SidebarProps) {
  const locale = useLocale();
  const t = useTranslations("sidebar");
  const tCommon = useTranslations("common");
  const tAccount = useTranslations("customerAuth.account");
  const cartCount = useCart((state) => state.itemCount());
  const customer = useCustomerAuth((s) => s.customer);

  useEffect(() => {
    useCustomerAuth.getState().init();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const handleLogout = async () => {
    onClose();
    await useCustomerAuth.getState().logout();
    window.location.href = `/${locale}`;
  };

  const navItems = [
    { href: `/${locale}`, label: t("home", { defaultValue: "Home" }), icon: Home },
    { href: `/${locale}/products`, label: t("store", { defaultValue: "Store" }), icon: ShoppingBag },
    { href: `/${locale}/cart`, label: t("cart", { defaultValue: "Cart" }), icon: ShoppingCart, badge: cartCount },
    { href: `/${locale}/account`, label: t("account", { defaultValue: "Account" }), icon: User },
  ];

  const supportItems = [
    { href: `/${locale}/support`, label: t("supportChat", { defaultValue: "Support Chat" }), icon: MessageSquare },
    { href: `/${locale}/track-order`, label: t("trackOrder", { defaultValue: "Track Order" }), icon: Package },
    { href: `/${locale}/contact`, label: t("contactSupport", { defaultValue: "Contact Support" }), icon: Mail },
    { href: `/${locale}/support/return-exchange`, label: t("returnExchange", { defaultValue: "Return & Exchange" }), icon: RotateCcw },
    { href: `/${locale}/privacy`, label: t("privacy", { defaultValue: "Privacy Policy" }), icon: FileText },
    { href: `/${locale}/terms`, label: t("terms", { defaultValue: "Terms of Service" }), icon: FileText },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-[60] bg-black/60 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        id="app-sidebar"
        aria-label={t("aria", { defaultValue: "Main menu" })}
        aria-hidden={!open}
        inert={!open}
        className={`fixed inset-y-0 start-0 z-[70] flex w-[min(320px,85vw)] flex-col border-e border-border bg-card shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full"
        }`}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <Image
            src={
              locale === "ar"
                ? "/brand/Logo_Icon_Name_AR_Large.png"
                : "/brand/Logo_Icon_Name_EN_Large.png"
            }
            alt={locale === "ar" ? "موتوغير سوق" : "MotoGearSouq"}
            width={130}
            height={48}
            className="h-9 w-auto object-contain"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label={tCommon("close") ?? "Close"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-bg/60 text-muted transition-colors hover:border-accent hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
          {/* Welcome / Auth */}
          <div className="rounded-xl border border-border bg-bg p-4">
            {customer ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <UserCircle className="h-8 w-8 text-accent" />
                  <div className="overflow-hidden">
                    <p className="font-extrabold text-fg truncate">{customer.name}</p>
                    <p className="text-xs text-muted truncate">{customer.email || customer.phone}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-border flex flex-col gap-1">
                  <Link
                    href={`/${locale}/account`}
                    onClick={onClose}
                    className="text-xs font-semibold text-fg hover:text-accent py-1"
                  >
                    {tAccount("title", { defaultValue: "Account" })}
                  </Link>
                  <Link
                    href={`/${locale}/account/orders`}
                    onClick={onClose}
                    className="text-xs font-semibold text-fg hover:text-accent py-1"
                  >
                    {tAccount("sidebar.orders", { defaultValue: "Orders" })}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:underline py-1 mt-1 text-start"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    {tAccount("sidebar.logout", { defaultValue: "Sign Out" })}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="font-extrabold text-fg">{t("welcome", { defaultValue: "Welcome to MotoGearSouq" })}</p>
                <p className="mt-1 text-sm text-muted">{t("welcomeSubtitle", { defaultValue: "Sign in to follow your orders and check out faster." })}</p>
                <Button variant="primary" fullWidth className="mt-4" asChild>
                  <Link
                    href={`/${locale}/login`}
                    onClick={onClose}
                    className="gap-2"
                  >
                    <User className="h-4 w-4" aria-hidden="true" />
                    <span>{t("login", { defaultValue: "Login" })}</span>
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <section>
            <h2 className="px-3 text-xs font-bold uppercase tracking-wider text-muted">
              {t("sectionNav", { defaultValue: "Navigation" })}
            </h2>
            <nav aria-label={t("sectionNav", { defaultValue: "Navigation" })} className="mt-2 space-y-1">
              {navItems.map(({ href, label, icon: Icon, badge }) => (
                <Link key={href} href={href} onClick={onClose} className={rowBase}>
                  <Icon className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
                  <span>{label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className="ms-auto min-w-[20px] rounded-full bg-accent px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </section>

          {/* Support & Legal */}
          <section>
            <h2 className="px-3 text-xs font-bold uppercase tracking-wider text-muted">
              {t("sectionSupport", { defaultValue: "Support & Legal" })}
            </h2>
            <div className="mt-2 space-y-1">
              {supportItems.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={onClose} className={rowBase}>
                  <Icon className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              ))}

              {/* Settings: Locale switcher & Theme toggle */}
              <div className="px-3 py-3 flex items-center justify-between border-t border-border mt-3">
                <span className="text-xs font-semibold text-muted">{t("settings", { defaultValue: "Settings" })}</span>
                <div className="flex items-center gap-2">
                  <LocaleSwitcher />
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-4 text-center text-xs text-muted">
          {t("copyright", { defaultValue: "© 2026 MotoGearSouq. All rights reserved." })}
        </div>
      </aside>
    </>
  );
}
