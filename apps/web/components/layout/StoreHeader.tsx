"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Menu, Home, MessageSquare, Package, User, UserCircle, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { CartIcon } from "@/components/cart/CartIcon";
import { Sidebar } from "@/components/layout/Sidebar";
import { useCustomerAuth } from "@/lib/customer-auth-store";

export function StoreHeader() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const locale = useLocale();
  const tNav = useTranslations("nav");
  const tHeader = useTranslations("header");
  const tAccount = useTranslations("customerAuth.account");
  const tLogin = useTranslations("customerAuth.login");
  const customer = useCustomerAuth((s) => s.customer);

  useEffect(() => {
    useCustomerAuth.getState().init();
  }, []);

  const handleLogout = async () => {
    setAccountOpen(false);
    await useCustomerAuth.getState().logout();
    window.location.href = `/${locale}`;
  };

  const centerLinks = [
    { href: `/${locale}`, label: tNav("home"), icon: Home },
    { href: `/${locale}/support`, label: tNav("supportChat"), icon: MessageSquare },
    { href: `/${locale}/track-order`, label: tNav("trackOrder"), icon: Package },
  ];

  const renderLogo = (priority: boolean) => (
    <Image
      src={
        locale === "ar"
          ? "/brand/Logo_Icon_Name_AR_Large.png"
          : "/brand/Logo_Icon_Name_EN_Large.png"
      }
      alt={locale === "ar" ? "موتوغير سوق" : "MotoGearSouq"}
      width={150}
      height={60}
      className="h-10 w-auto object-contain md:h-12"
      priority={priority}
    />
  );

  const accountControl = customer ? (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAccountOpen((v) => !v)}
        aria-expanded={accountOpen}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-fg transition-colors hover:bg-card border border-border"
      >
        <UserCircle className="h-5 w-5 text-accent" />
        <span className="hidden max-w-[10ch] truncate sm:inline">{customer.name}</span>
        <ChevronDown
          className={`h-4 w-4 text-muted transition-transform ${accountOpen ? "rotate-180" : ""}`}
        />
      </button>
      {accountOpen && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setAccountOpen(false)}
            className="fixed inset-0 z-45 cursor-default"
          />
          <div
            role="menu"
            className="absolute end-0 top-full z-50 mt-2 w-48 rounded-lg border border-border bg-card p-1 shadow-xl"
          >
            <Link
              role="menuitem"
              href={`/${locale}/account`}
              onClick={() => setAccountOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-semibold text-fg transition-colors hover:bg-bg"
            >
              {tAccount("title")}
            </Link>
            <Link
              role="menuitem"
              href={`/${locale}/account/orders`}
              onClick={() => setAccountOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-semibold text-fg transition-colors hover:bg-bg"
            >
              {tAccount("sidebar.orders")}
            </Link>
            <div className="my-1 border-t border-border" />
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10 text-start"
            >
              <LogOut className="h-4 w-4" />
              {tAccount("sidebar.logout")}
            </button>
          </div>
        </>
      )}
    </div>
  ) : (
    <Button variant="primary" size="sm" asChild>
      <Link
        href={`/${locale}/login`}
        aria-label={tNav("login")}
        className="gap-1.5 px-3"
      >
        <User className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">{tNav("login") || tLogin("signinShort")}</span>
      </Link>
    </Button>
  );

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur">
        <Container size="xl" as="div">
          <div className="relative flex h-16 items-center justify-between gap-3 md:h-20">
            {/* Start: hamburger + logo (desktop) */}
            <div className="flex items-center gap-2 md:gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen((v) => !v)}
                aria-label={tHeader("menuToggle")}
                aria-expanded={sidebarOpen}
                aria-controls="app-sidebar"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-bg/60 text-fg transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
              <Link href={`/${locale}`} className="hidden md:flex">
                {renderLogo(true)}
              </Link>
            </div>

            {/* Center: desktop nav */}
            <nav
              aria-label={tHeader("navAria")}
              className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-3 md:flex lg:gap-5"
            >
              {centerLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-fg/90 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:text-base"
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </nav>

            {/* Center: mobile logo */}
            <Link
              href={`/${locale}`}
              className="absolute left-1/2 -translate-x-1/2 md:hidden"
            >
              {renderLogo(false)}
            </Link>

            {/* End: locale switcher (desktop) + cart + login/account */}
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden md:flex">
                <LocaleSwitcher />
              </span>
              <CartIcon />
              {accountControl}
            </div>
          </div>
        </Container>
      </header>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
