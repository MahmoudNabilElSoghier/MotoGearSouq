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
  Mail,
  RotateCcw,
  FileText,
} from "lucide-react";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/lib/cart-store";

interface LandingSidebarProps {
  open: boolean;
  onClose: () => void;
}

const rowBase =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-bg/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

export function LandingSidebar({ open, onClose }: LandingSidebarProps) {
  const locale = useLocale();
  const t = useTranslations("sidebar");
  const tCommon = useTranslations("common");
  const cartCount = useCart((state) => state.itemCount());

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

  const navItems = [
    { href: `/${locale}`, label: t("home"), icon: Home },
    { href: `/${locale}/products`, label: t("store"), icon: ShoppingBag },
    { href: `/${locale}/cart`, label: t("cart"), icon: ShoppingCart, badge: cartCount },
    { href: `/${locale}/account`, label: t("account"), icon: User },
  ];

  const supportItems = [
    { href: `/${locale}/contact`, label: t("contactSupport"), icon: Mail },
    { href: `/${locale}/support/return-exchange`, label: t("returnExchange"), icon: RotateCcw },
    { href: `/${locale}/privacy`, label: t("privacy"), icon: FileText },
    { href: `/${locale}/terms`, label: t("terms"), icon: FileText },
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

      {/* Panel: anchored to the start edge (left in LTR, right in RTL) */}
      <aside
        id="landing-sidebar"
        aria-label={t("aria")}
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
            aria-label={tCommon("close")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-bg/60 text-muted transition-colors hover:border-accent hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
          {/* Welcome */}
          <div className="rounded-xl border border-border bg-bg p-4">
            <p className="font-extrabold text-fg">{t("welcome")}</p>
            <p className="mt-1 text-sm text-muted">{t("welcomeSubtitle")}</p>
            <Button variant="primary" fullWidth className="mt-4" asChild>
              <Link
                href={`/${locale}/login`}
                onClick={onClose}
                aria-label={t("login")}
                className="gap-2"
              >
                <User className="h-4 w-4" aria-hidden="true" />
                <span>{t("login")}</span>
              </Link>
            </Button>
          </div>

          {/* Navigation */}
          <section>
            <h2 className="px-3 text-xs font-bold uppercase tracking-wider text-muted">
              {t("sectionNav")}
            </h2>
            <nav aria-label={t("sectionNav")} className="mt-2 space-y-1">
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
              {t("sectionSupport")}
            </h2>
            <div className="mt-2 space-y-1">
              <Link
                href={`/${locale}/support`}
                onClick={onClose}
                className={rowBase}
              >
                <MessageSquare className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
                <span>{t("supportChat")}</span>
              </Link>

              {/* Locale switcher row */}
              <div className="px-3 py-1.5">
                <LocaleSwitcher />
              </div>

              {supportItems.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={onClose} className={rowBase}>
                  <Icon className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-4 text-center text-xs text-muted">
          {t("copyright")}
        </div>
      </aside>
    </>
  );
}
