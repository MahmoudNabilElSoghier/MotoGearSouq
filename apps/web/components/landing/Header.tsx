"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Menu, Home, MessageSquare, Package, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { CartIcon } from "@/components/cart/CartIcon";
import { LandingSidebar } from "@/components/landing/LandingSidebar";

export function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const locale = useLocale();
  const tNav = useTranslations("nav");
  const tHeader = useTranslations("header");

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
                aria-controls="landing-sidebar"
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

            {/* End: locale switcher (desktop) + cart + login */}
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden md:flex">
                <LocaleSwitcher />
              </span>
              <CartIcon />
              <Button variant="primary" size="sm" asChild>
                <Link
                  href={`/${locale}/login`}
                  aria-label={tNav("login")}
                  className="gap-1.5 px-3"
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{tNav("login")}</span>
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </header>

      <LandingSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
